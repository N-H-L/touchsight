// Stage 1 — understand the diagram: labels, what they point at, and the parts themselves.
import { loadOpenCV, loadOCR, loadSAM } from './libs.js';
import { recognizeWords, mergeWordSets, filterWords, wordsToLines, linesToLabels } from './ocr.js';
import { thinStrokeMask, houghSegments, assignLeaders } from './leaders.js';
import { embedImage, segmentPoint } from './segment.js';
import { correctWord, correctPhrase } from './vocab.js';
import { loadPaddle, detectText } from './paddle.js';
import { loadIndra, detectText as detectTextIndra } from './indra.js';
import { structureLines } from './lineart.js';
import { DEFAULT_TRACING_SENSITIVITY, tracingConfig } from './tracing-config.js';

export async function analyze(imageData, { onStage = () => {}, sensitivity = DEFAULT_TRACING_SENSITIVITY, preferIndra = false } = {}) {
  const timings = {};
  const timed = async (k, f) => { const t0 = performance.now(); const r = await f(); timings[k] = Math.round(performance.now() - t0); return r; };
  const W = imageData.width, H = imageData.height;
  sensitivity = tracingConfig(sensitivity).sensitivity;

  onStage('engines', 'Loading on-device models…');
  const [cv, sam] = await timed('load', () => Promise.all([loadOpenCV(), loadSAM(), loadPaddle({ proxy: true }).catch(() => null)]));

  onStage('ocr', 'Reading the printed labels…');
  const canvas = toCanvas(imageData);
  const src = cv.matFromImageData(imageData);
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  let ocrEngine = 'paddle';
  const words = await timed('ocr', async () => {
    // Engine chain: Indra (opt-in from the UI checkbox) -> PaddleOCR -> Tesseract.
    // Each stage only runs if the previous one threw or produced nothing, so an
    // experimental engine can never leave the pipeline worse than the default.
    if (preferIndra) {
      try {
        await loadIndra({ proxy: true });
        const indraWords = await detectTextIndra(imageData, { cv, level: 'word' });
        if (indraWords.length) { console.info('OCR engine: indra'); ocrEngine = 'indra'; return indraWords; }
        console.warn('Indra OCR found no text, falling back to PaddleOCR');
      } catch (e) {
        console.warn('Indra OCR unavailable, falling back to PaddleOCR', e);
      }
    }
    try {
      await loadPaddle({ proxy: true });
      return await detectText(imageData, { cv, level: 'word' });
    } catch (e) {
      console.warn('PaddleOCR unavailable, falling back to Tesseract', e);
      ocrEngine = 'tesseract';
    }
    const worker = await loadOCR();
    const a = await recognizeWords(worker, canvas);
    // Second pass on a locally-binarized copy recovers dark text printed on colored fills.
    const bin = new cv.Mat();
    cv.adaptiveThreshold(gray, bin, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 31, 18);
    const b = (await recognizeWords(worker, matToCanvas(cv, bin)))
      .filter((w) => w.conf >= 70 && w.text.replace(/[^A-Za-z0-9]/g, '').length >= 3);
    bin.delete();
    return mergeWordSets(a, b);
  });
  const good = filterWords(words, W, H);
  // Repair low-confidence OCR slips against a science vocabulary (shown to the teacher).
  for (const w of good) { w.orig = w.text; w.text = correctWord(w.text, w.conf); }
  const lines = wordsToLines(good);

  onStage('leaders', 'Tracing leader lines to the parts they name…');
  // Labels printed on top of the drawing name the part underneath; they get no leader.
  const solid = solidMask(cv, src);
  for (const l of lines) l.inside = boxFrac(solid, W, H, l) > 0.55;
  const thin = thinStrokeMask(cv, gray, good);
  const segs = houghSegments(cv, thin);
  thin.delete();
  assignLeaders(lines.filter((l) => !l.inside), segs);
  // Reading order (top to bottom, then left to right) so the review list matches the page.
  const labels = linesToLabels(lines).sort((a, b) => (a.y0 - b.y0) || (a.x0 - b.x0));
  // Lone single characters are usually OCR noise, unless the diagram is letter-labeled.
  const singles = labels.filter((L) => L.text.replace(/[^A-Za-z0-9]/g, '').length <= 1);
  if (singles.length < 3) for (const L of singles) labels.splice(labels.indexOf(L), 1);
  for (const L of labels) {
    L.inside = L.lines.every((l) => l.inside);
    if (L.inside) L.leader = null;
    const fixes = L.lines.flatMap((l) => l.words).filter((w) => w.orig !== w.text);
    L.corrections = fixes.map((w) => `${w.orig} → ${w.text}`);
    const ph = correctPhrase(L.text);
    if (ph !== L.text) { L.corrections.push(`${L.text} → ${ph}`); L.text = ph; }
  }

  const fg = foregroundMask(cv, src, labels, sensitivity);
  const { lineArt, regions, edges } = await timed('lineart', () => lineArtMask(cv, src, labels, fg, sensitivity));

  onStage('segment', 'Segmenting each labeled part…');
  const emb = await timed('sam_embed', () => embedImage(sam, imageData));
  const fgDil = dilateMask(cv, fg, W, H, 5);
  await timed('sam_parts', async () => {
    for (const L of labels) {
      let pts;
      if (L.leader) {
        const { x1, y1, x2, y2 } = L.leader;
        const d = Math.hypot(x2 - x1, y2 - y1) || 1;
        const nudge = Math.max(3, 0.004 * Math.hypot(W, H)); // step just inside the part
        const cand = [[x2 + ((x2 - x1) / d) * nudge, y2 + ((y2 - y1) / d) * nudge], [x2, y2]];
        pts = [cand.find(([x, y]) => fgAt(fg, W, H, x, y)) ?? nearestFg(fg, W, H, x2, y2, 14) ?? cand[0]];
      } else {
        // Points just around the text (the text itself is not the part).
        const h = L.y1 - L.y0, cx = (L.x0 + L.x1) / 2, cy = (L.y0 + L.y1) / 2;
        pts = [[L.x0 - 0.5 * h, cy], [L.x1 + 0.5 * h, cy], [cx, L.y0 - 0.5 * h], [cx, L.y1 + 0.5 * h]]
          .filter(([x, y]) => fgAt(fg, W, H, x, y));
        if (!pts.length) pts = [[cx, cy]];
      }
      pts = pts.map(([x, y]) => [clamp(x, 0, W - 1), clamp(y, 0, H - 1)]);
      L.anchor = pts[0];
      const r = await segmentPoint(sam, emb, pts);
      if (r) for (let i = 0; i < r.mask.length; i++) r.mask[i] &= fgDil[i]; // parts never include the page background
      L.mask = r?.mask ?? null;
      L.maskScore = r?.score ?? 0;
    }
  });
  src.delete(); gray.delete();
  return { W, H, labels, words: good, fg, lineArt, regions, edges, timings, device: sam.device, ocrEngine, sensitivity };
}

// Non-background pixels minus text and thin strokes (leader lines), holes filled.
function foregroundMask(cv, src, labels, sensitivity = DEFAULT_TRACING_SENSITIVITY) {
  const trace = tracingConfig(sensitivity);
  const W = src.cols, H = src.rows;
  const nb = nonBackground(src, sensitivity);
  const m = new cv.Mat(H, W, cv.CV_8UC1);
  for (let i = 0; i < W * H; i++) m.data[i] = nb[i] ? 255 : 0;
  for (const L of labels) {
    const p = 3;
    cv.rectangle(m, new cv.Point(L.x0 - p, L.y0 - p), new cv.Point(L.x1 + p, L.y1 + p), new cv.Scalar(0), -1);
  }
  const k = Math.max(3, Math.round(trace.foregroundKernelScale * Math.hypot(W, H))) | 1;
  const ker = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(k, k));
  cv.morphologyEx(m, m, cv.MORPH_OPEN, ker);
  cv.morphologyEx(m, m, cv.MORPH_CLOSE, ker);
  ker.delete();
  fillHoles(cv, m);
  removeSmall(cv, m, trace.foregroundMinArea * W * H);
  const out = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = m.data[i] ? 1 : 0;
  m.delete();
  return out;
}

export function fillHoles(cv, m) {
  const contours = new cv.MatVector(), hier = new cv.Mat();
  cv.findContours(m, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  cv.drawContours(m, contours, -1, new cv.Scalar(255), -1);
  contours.delete(); hier.delete();
}

export function removeSmall(cv, m, minArea) {
  const contours = new cv.MatVector(), hier = new cv.Mat();
  cv.findContours(m, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  for (let i = 0; i < contours.size(); i++) {
    const c = contours.get(i);
    if (cv.contourArea(c) < minArea) {
      const v = new cv.MatVector(); v.push_back(c);
      cv.drawContours(m, v, 0, new cv.Scalar(0), -1);
      v.delete();
    }
    c.delete();
  }
  contours.delete(); hier.delete();
}

// Fraction of a ring around the text box that is drawing rather than page background.
function ringNonBgFrac(nonbg, W, H, b) {
  const g = 0.45 * (b.y1 - b.y0);
  let n = 0, t = 0;
  const sample = (x, y) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) { t++; return; } t++; n += nonbg[y * W + x]; };
  for (let x = b.x0 - g; x <= b.x1 + g; x += 3) { sample(x, b.y0 - g); sample(x, b.y1 + g); }
  for (let y = b.y0 - g; y <= b.y1 + g; y += 3) { sample(b.x0 - g, y); sample(b.x1 + g, y); }
  return t ? n / t : 0;
}
function bgColor(src) {
  const W = src.cols, H = src.rows, d = src.data, border = [];
  for (let x = 0; x < W; x += 4) border.push(x, x + (H - 1) * W);
  for (let y = 0; y < H; y += 4) border.push(y * W, y * W + W - 1);
  return [0, 1, 2].map((c) => border.map((i) => d[i * 4 + c]).sort((a, b) => a - b)[border.length >> 1]);
}
function nonBackground(src, sensitivity = DEFAULT_TRACING_SENSITIVITY) {
  const threshold = tracingConfig(sensitivity).foregroundDistance;
  const W = src.cols, H = src.rows, d = src.data, med = bgColor(src), out = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    out[i] = Math.max(Math.abs(d[i * 4] - med[0]), Math.abs(d[i * 4 + 1] - med[1]), Math.abs(d[i * 4 + 2] - med[2])) > threshold ? 1 : 0;
  }
  return out;
}
const fgAt = (fg, W, H, x, y) => x >= 0 && y >= 0 && x < W && y < H && fg[Math.round(y) * W + Math.round(x)] === 1;
function nearestFg(fg, W, H, x, y, r) {
  for (let d = 1; d <= r; d++) for (let a = 0; a < 16; a++) {
    const px = x + d * Math.cos(a * Math.PI / 8), py = y + d * Math.sin(a * Math.PI / 8);
    if (fgAt(fg, W, H, px, py)) return [px, py];
  }
  return null;
}
function dilateMask(cv, mask, W, H, k) {
  const m = new cv.Mat(H, W, cv.CV_8UC1);
  for (let i = 0; i < W * H; i++) m.data[i] = mask[i] ? 255 : 0;
  const ker = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(k, k));
  cv.dilate(m, m, ker);
  const out = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = m.data[i] ? 1 : 0;
  m.delete(); ker.delete();
  return out;
}

// The diagram's own structure lines (see lineart.js), with print text and leader
// lines removed and kept to the drawing itself.
function lineArtMask(cv, src, labels, fg, sensitivity = DEFAULT_TRACING_SENSITIVITY) {
  const trace = tracingConfig(sensitivity);
  const W = src.cols, H = src.rows;
  const r = structureLines(cv, src, { textBoxes: labels.flatMap((L) => L.lines), sensitivity });
  const big = new cv.Mat(H, W, cv.CV_8UC1);
  big.data.set(r.mask.map((v) => v * 255));
  for (const L of labels) if (L.leader) cv.line(big, new cv.Point(L.leader.x1, L.leader.y1), new cv.Point(L.leader.x2, L.leader.y2), new cv.Scalar(0), 9);
  const fgm = new cv.Mat(H, W, cv.CV_8UC1);
  for (let i = 0; i < W * H; i++) fgm.data[i] = fg[i] ? 255 : 0;
  const k = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(9, 9));
  cv.dilate(fgm, fgm, k);
  cv.bitwise_and(big, fgm, big);
  const out = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = big.data[i] ? 1 : 0;
  // "Detailed" style: every edge in the picture (Canny), minus print text and leaders.
  const gray = new cv.Mat(), ed = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.GaussianBlur(gray, gray, new cv.Size(3, 3), 0);
  cv.Canny(gray, ed, trace.cannyLow, trace.cannyHigh);
  for (const L of labels) {
    for (const l of L.lines) cv.rectangle(ed, new cv.Point(l.x0 - 4, l.y0 - 4), new cv.Point(l.x1 + 4, l.y1 + 4), new cv.Scalar(0), -1);
    if (L.leader) cv.line(ed, new cv.Point(L.leader.x1, L.leader.y1), new cv.Point(L.leader.x2, L.leader.y2), new cv.Scalar(0), 9);
  }
  cv.bitwise_and(ed, fgm, ed);
  const edges = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) edges[i] = ed.data[i] ? 1 : 0;
  for (const m of [big, fgm, k, gray, ed]) m.delete();
  return { lineArt: out, regions: { id: r.regions, w: r.rW, h: r.rH }, edges };
}

// The drawing as a solid shape (text and thin lines on white paper drop out; text
// printed on a colored part stays enclosed by it).
function solidMask(cv, src) {
  const W = src.cols, H = src.rows, nb = nonBackground(src);
  const m = new cv.Mat(H, W, cv.CV_8UC1);
  for (let i = 0; i < W * H; i++) m.data[i] = nb[i] ? 255 : 0;
  const k = Math.max(5, Math.round(0.008 * Math.hypot(W, H))) | 1;
  const ker = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(k, k));
  cv.morphologyEx(m, m, cv.MORPH_OPEN, ker); // drop text strokes and thin lines on the paper first
  cv.morphologyEx(m, m, cv.MORPH_CLOSE, ker);
  ker.delete();
  fillHoles(cv, m);
  const out = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = m.data[i] ? 1 : 0;
  m.delete();
  return out;
}
function boxFrac(mask, W, H, b) {
  let n = 0, t = 0;
  for (let y = Math.max(0, Math.floor(b.y0)); y < Math.min(H, b.y1); y += 2)
    for (let x = Math.max(0, Math.floor(b.x0)); x < Math.min(W, b.x1); x += 2) { t++; n += mask[y * W + x]; }
  return t ? n / t : 0;
}

function toCanvas(imageData) {
  const c = document.createElement('canvas');
  c.width = imageData.width; c.height = imageData.height;
  c.getContext('2d').putImageData(imageData, 0, 0);
  return c;
}
function matToCanvas(cv, mat) {
  const c = document.createElement('canvas');
  cv.imshow(c, mat);
  return c;
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));


// Recompute only foreground and tracing layers after sensitivity changes.
// OCR, leader assignment and SAM inference are intentionally not repeated.
export function updateTracing(cv, imageData, analysis, sensitivity) {
  const src = cv.matFromImageData(imageData);
  try {
    const value = tracingConfig(sensitivity).sensitivity;
    const fg = foregroundMask(cv, src, analysis.labels, value);
    const { lineArt, regions, edges } = lineArtMask(cv, src, analysis.labels, fg, value);
    analysis.fg = fg;
    // Keep cached SAM masks constrained to the newly computed foreground. Otherwise
    // tracing updates can leave stale mask pixels outside the current drawing.
    const fgDilated = dilateMask(cv, fg, analysis.W, analysis.H, 5);
    for (const label of analysis.labels) if (label.mask) {
      const constrained = new Uint8Array(label.mask.length);
      for (let i = 0; i < constrained.length; i++) constrained[i] = label.mask[i] && fgDilated[i] ? 1 : 0;
      label.mask = constrained;
      label._contours = null;
    }
    analysis.lineArt = lineArt;
    analysis.regions = regions;
    analysis.edges = edges;
    analysis.sensitivity = value;
    return analysis;
  } finally {
    src.delete();
  }
}
