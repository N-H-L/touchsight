// Indra OCR (Datalab, v1.1.0) - experimental alternative text engine running the
// vendored ONNX models (det.onnx + rec.onnx + meta.json) on onnxruntime-web, the
// same runtime the PaddleOCR engine uses. Adapted from the DB text detection and
// CTC recognition conventions of src/js/paddle.js.
//
//   const I = await loadIndra({ proxy: true });          // once
//   const words = await detectTextIndra(imageData, { cv, level: 'word' });
//
// EXPERIMENTAL: where the reference implementation was ambiguous (input height and
// width of the recognizer, RGB/BGR channel order, blank index), this port probes or
// makes the choice configurable instead of guessing silently, and it is opt-in from
// the UI checkbox with automatic fallback to PaddleOCR (then Tesseract) in
// pipeline.js. It also currently covers the Latin recognizer (rec.onnx); the
// CJK/RTL/world recognizers, the language-model rescoring (lm.npz) and the
// orientation/script classifiers of the Python package are not ported, so tilted
// pages and non-Latin scripts fall back rather than misread.
//
// Model files are fetched by scripts/vendor.mjs into src/models/indra/.

const base = new URL('..', import.meta.url).href; // .../src/
const MODELS = base + 'models/indra/';
const DET = 'det.onnx';
const REC = 'rec.onnx';
const META = 'meta.json';

const DET_THRESH = 0.3, BOX_THRESH = 0.5, UNCLIP = 1.6, MIN_SIZE = 3, MAX_CANDIDATES = 1000;
const REC_BATCH = 6, TEXT_SCORE = 0.5;
// Candidate tensor shapes for the recognizer (Indra does not document them in the
// repo README; every candidate is probed once at load time, the winner is cached).
const REC_HEIGHTS = [48, 32, 64, 96];
const REC_FIXED_WIDTHS = [320, 512, 640, 64];
// Channel order fed to the DB detector. Flip to true if detection finds nothing
// while the recognizer works (verify against the indra-ocr Python package first).
const DET_BGR = false;

let indraPromise;
export function loadIndra({ proxy = false } = {}) {
  indraPromise ??= (async () => {
    // Same WebGPU-aware ORT bundle already vendored for PaddleOCR/transformers.js.
    const ort = await import(base + 'vendor/ort/ort.webgpu.min.mjs');
    ort.env.wasm.wasmPaths = base + 'vendor/ort/';
    ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
    ort.env.wasm.proxy = proxy;
    const [detBuf, recBuf] = await Promise.all([DET, REC].map(async (f) => {
      const r = await fetch(MODELS + f);
      if (!r.ok) throw new Error(`Could not load ${f} (${r.status}); run "npm run vendor"`);
      return new Uint8Array(await r.arrayBuffer());
    }));
    const meta = await (await fetch(MODELS + META)).json();
    const vocab = loadVocab(meta);
    const blankIndex = Number.isInteger(meta.blank_index) ? meta.blank_index : Number.isInteger(meta.blankIndex) ? meta.blankIndex : 0;
    const opts = { executionProviders: ['wasm'], graphOptimizationLevel: 'all' };
    const det = await ort.InferenceSession.create(detBuf, opts);
    const rec = await ort.InferenceSession.create(recBuf, opts);
    const { recH, recW } = await probeRec(ort, rec);
    return { ort, det, rec, vocab, blankIndex, recH, recW };
  })();
  return indraPromise;
}

function loadVocab(meta) {
  const cands = [meta.vocab, meta.chars, meta.character, meta.itos, meta.charset, meta.tokens, meta.model?.vocab, meta.text?.vocab];
  for (const c of cands) {
    if (Array.isArray(c) && c.length > 40) return c.map((s) => String(s));
    if (typeof c === 'string' && c.length > 40) {
      const lines = c.split(/\r?\n/);
      if (lines.length > 40) return lines;
      return [...c]; // one token per character
    }
  }
  throw new Error('Indra meta.json did not contain a recognizable character vocabulary');
}

// Find an input shape the recognizer accepts: (1, 3, H, W) with a dynamic W if it
// takes variable widths, otherwise a fixed size like (1, 3, 48, 320).
async function probeRec(ort, rec) {
  for (const h of REC_HEIGHTS) {
    for (const w of REC_FIXED_WIDTHS) {
      try {
        await rec.run({ [rec.inputNames[0]]: new ort.Tensor('float32', new Float32Array(3 * h * w), [1, 3, h, w]) });
        return { recH: h, recW: w };
      } catch {}
    }
  }
  throw new Error('Indra recognizer rejected every candidate input shape');
}

// Same word/line output contract as paddle.js.
export async function detectTextIndra(imageData, { cv = window.cv, level = 'word', limitSide = 736, maxSide = 2000 } = {}) {
  const I = await loadIndra();
  const t0 = performance.now();
  const W = imageData.width, H = imageData.height;
  const src = whiteRGB(cv, imageData);
  try {
    const boxes = await detect(I, cv, src, W, H, limitSide, maxSide);
    const t1 = performance.now();
    const lines = await recognize(I, cv, src, boxes);
    detectTextIndra.lastTiming = { det: t1 - t0, rec: performance.now() - t1, boxes: boxes.length };
    return level === 'line' ? lines : linesToWords(lines);
  } finally { src.delete(); }
}

function whiteRGB(cv, imageData) {
  const d = imageData.data, n = imageData.width * imageData.height;
  const rgb = new Uint8Array(n * 3);
  for (let i = 0, j = 0; i < n * 4; i += 4, j += 3) {
    const a = d[i + 3] / 255, w = 255 * (1 - a);
    rgb[j] = d[i] * a + w; rgb[j + 1] = d[i + 1] * a + w; rgb[j + 2] = d[i + 2] * a + w;
  }
  const m = new cv.Mat(imageData.height, imageData.width, cv.CV_8UC3);
  m.data.set(rgb);
  return m;
}

// ---- detection (DB-style) ----
async function detect(I, cv, src, W, H, limitSide, maxSide) {
  let ratio = 1;
  if (Math.min(W, H) < limitSide) ratio = limitSide / Math.min(W, H);
  if (Math.max(W, H) * ratio > maxSide) ratio = maxSide / Math.max(W, H);
  const dw = Math.max(32, Math.round((W * ratio) / 32) * 32), dh = Math.max(32, Math.round((H * ratio) / 32) * 32);
  const rs = new cv.Mat();
  cv.resize(src, rs, new cv.Size(dw, dh), 0, 0, cv.INTER_LINEAR);
  const x = toCHW(rs.data, dw, dh);
  rs.delete();
  const out = await I.det.run({ [I.det.inputNames[0]]: new I.ort.Tensor('float32', x, [1, 3, dh, dw]) });
  const pred = out[I.det.outputNames[0]].data;

  const mask = new cv.Mat(dh, dw, cv.CV_8UC1);
  const md = mask.data;
  for (let i = 0; i < md.length; i++) md[i] = pred[i] > DET_THRESH ? 255 : 0;
  const k = cv.Mat.ones(2, 2, cv.CV_8U);
  cv.dilate(mask, mask, k);
  k.delete();
  const contours = new cv.MatVector(), hier = new cv.Mat();
  cv.findContours(mask, contours, hier, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
  mask.delete(); hier.delete();

  const sx = W / dw, sy = H / dh, boxes = [];
  for (let i = 0; i < Math.min(contours.size(), MAX_CANDIDATES); i++) {
    const c = contours.get(i);
    const r = cv.minAreaRect(c);
    c.delete();
    if (Math.min(r.size.width, r.size.height) < MIN_SIZE) continue;
    const score = boxScore(pred, dw, dh, rectPoints(r));
    if (score < BOX_THRESH) continue;
    const { width: w, height: h } = r.size;
    const d = (w * h * UNCLIP) / (2 * (w + h));
    const big = { center: r.center, size: { width: w + 2 * d, height: h + 2 * d }, angle: r.angle };
    if (Math.min(big.size.width, big.size.height) < MIN_SIZE + 2) continue;
    const pts = rectPoints(big).map(([px, py]) => [
      Math.min(W, Math.max(0, Math.round(px * sx))), Math.min(H, Math.max(0, Math.round(py * sy)))]);
    boxes.push({ pts, score });
  }
  contours.delete();
  boxes.sort((a, b) => (Math.abs(a.pts[0][1] - b.pts[0][1]) < 10 ? a.pts[0][0] - b.pts[0][0] : a.pts[0][1] - b.pts[0][1]));
  return boxes;
}

// CHW float tensor, (v/255-0.5)/0.5 in the channel order DET_BGR selects.
function toCHW(rgb, w, h) {
  const out = new Float32Array(3 * w * h), plane = w * h;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = (y * w + x) * 3, o = y * w + x;
    if (DET_BGR) {
      out[o] = rgb[s + 2] / 127.5 - 1; out[o + plane] = rgb[s + 1] / 127.5 - 1; out[o + 2 * plane] = rgb[s] / 127.5 - 1;
    } else {
      out[o] = rgb[s] / 127.5 - 1; out[o + plane] = rgb[s + 1] / 127.5 - 1; out[o + 2 * plane] = rgb[s + 2] / 127.5 - 1;
    }
  }
  return out;
}

function rectPoints(r) {
  const a = (r.angle * Math.PI) / 180, c = Math.cos(a) / 2, s = Math.sin(a) / 2;
  const { width: w, height: h } = r.size, { x: cx, y: cy } = r.center;
  const p = [
    [cx - c * w + s * h, cy - s * w - c * h], [cx + c * w + s * h, cy + s * w - c * h],
    [cx + c * w - s * h, cy + s * w + c * h], [cx - c * w - s * h, cy - s * w + c * h],
  ].sort((u, v) => u[0] - v[0]);
  const [tl, bl] = p[1][1] > p[0][1] ? [p[0], p[1]] : [p[1], p[0]];
  const [tr, br] = p[3][1] > p[2][1] ? [p[2], p[3]] : [p[3], p[2]];
  return [tl, tr, br, bl];
}

function boxScore(pred, w, h, q) {
  const xs = q.map((p) => p[0]), ys = q.map((p) => p[1]);
  const x0 = Math.max(0, Math.floor(Math.min(...xs))), x1 = Math.min(w - 1, Math.ceil(Math.max(...xs)));
  const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(h - 1, Math.ceil(Math.max(...ys)));
  let sum = 0, n = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (!inQuad(q, x, y)) continue;
    sum += pred[y * w + x]; n++;
  }
  return n ? sum / n : 0;
}
function inQuad(q, x, y) {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = q[i], [bx, by] = q[(i + 1) % 4];
    const cr = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    if (Math.abs(cr) < 1e-6) continue;
    const s = cr > 0 ? 1 : -1;
    if (sign && s !== sign) return false;
    sign = s;
  }
  return true;
}

// ---- recognition (CTC greedy; the Python package's LM rescoring is not ported) ----
async function recognize(I, cv, src, boxes) {
  const items = [];
  for (const b of boxes) {
    const crop = cropQuad(cv, src, b.pts);
    if (!crop) continue;
    const it = { box: b, crops: [crop] };
    if (crop.rows >= 1.5 * crop.cols) {
      const ccw = new cv.Mat(), cw = new cv.Mat();
      cv.rotate(crop, ccw, cv.ROTATE_90_COUNTERCLOCKWISE);
      cv.rotate(crop, cw, cv.ROTATE_90_CLOCKWISE);
      crop.delete();
      it.crops = [ccw, cw];
      it.vertical = true;
    }
    items.push(it);
  }
  const jobs = items.flatMap((it) => it.crops.map((m) => ({ it, m, ratio: m.cols / m.rows })));
  jobs.sort((a, b) => a.ratio - b.ratio);
  for (let i = 0; i < jobs.length; i += REC_BATCH) {
    const batch = jobs.slice(i, i + REC_BATCH);
    const imgW = I.recW ?? Math.max(320, ...batch.map((j) => Math.ceil(I.recH * j.ratio)));
    const x = new Float32Array(batch.length * 3 * I.recH * imgW);
    batch.forEach((j, n) => {
      const rw = Math.min(imgW, Math.max(1, Math.ceil(I.recH * j.ratio)));
      const rs = new cv.Mat();
      cv.resize(j.m, rs, new cv.Size(rw, I.recH), 0, 0, cv.INTER_LINEAR);
      const plane = I.recH * imgW, off = n * 3 * plane;
      const rd = rs.data;
      for (let y = 0; y < I.recH; y++) for (let xx = 0; xx < rw; xx++) {
        const s = (y * rw + xx) * 3, o = off + y * imgW + xx;
        x[o] = rd[s] / 127.5 - 1; x[o + plane] = rd[s + 1] / 127.5 - 1; x[o + 2 * plane] = rd[s + 2] / 127.5 - 1;
      }
      rs.delete();
    });
    const out = await I.rec.run({ [I.rec.inputNames[0]]: new I.ort.Tensor('float32', x, [batch.length, 3, I.recH, imgW]) });
    const o = out[I.rec.outputNames[0]];
    // Logits: argmax over classes. A [N, T, C] tensor is expected; a [N, C, T] layout
    // (channels before time) would need a transpose, surfaced as an error for now.
    const [N, T, C] = o.dims.length === 3 && o.dims[1] > o.dims[2] ? o.dims : (o.dims.length === 2 ? [o.dims[0], o.dims[0], o.dims[1]] : o.dims);
    if (o.dims.length === 3 && o.dims[1] < o.dims[2]) throw new Error('Indra recognizer output is [N,C,T]; a transpose is required before decoding');
    batch.forEach((j, n) => {
      const tn = Math.min(T, Math.floor(o.data.length / (Math.max(N, n + 1) * C))) ;
      const r = ctcDecode(o.data, n * tn * C, tn, C, I.vocab, I.blankIndex);
      if (!j.it.best || r.conf > j.it.best.conf) j.it.best = r;
    });
  }
  for (const j of jobs) j.m.delete();

  const lines = [];
  for (const it of items) {
    const r = it.best;
    if (!r || !r.text.trim() || r.conf < TEXT_SCORE) continue;
    const xs = it.box.pts.map((p) => p[0]), ys = it.box.pts.map((p) => p[1]);
    const x0 = Math.min(...xs), y0 = Math.min(...ys), x1 = Math.max(...xs), y1 = Math.max(...ys);
    const k = Math.round(0.17 * Math.min(x1 - x0, y1 - y0));
    lines.push({
      text: r.text.trim(), conf: r.conf * 100,
      x0: x0 + k, y0: y0 + k, x1: x1 - k, y1: y1 - k,
      quad: it.box.pts, vertical: !!it.vertical, detScore: it.box.score,
    });
  }
  return lines;
}

function cropQuad(cv, src, [tl, tr, br, bl]) {
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const w = Math.round(Math.max(d(tl, tr), d(bl, br))), h = Math.round(Math.max(d(tl, bl), d(tr, br)));
  if (w < 2 || h < 2) return null;
  const from = cv.matFromArray(4, 1, cv.CV_32FC2, [...tl, ...tr, ...br, ...bl]);
  const to = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, w, 0, w, h, 0, h]);
  const M = cv.getPerspectiveTransform(from, to);
  const dst = new cv.Mat();
  cv.warpPerspective(src, dst, M, new cv.Size(w, h), cv.INTER_CUBIC, cv.BORDER_REPLICATE, new cv.Scalar());
  from.delete(); to.delete(); M.delete();
  return dst;
}

function ctcDecode(data, off, T, C, chars, blankIndex) {
  let text = '', sum = 0, n = 0, prev = -1;
  for (let t = 0; t < T; t++) {
    let best = 0, bp = -Infinity;
    const o = off + t * C;
    for (let c = 0; c < C; c++) if (data[o + c] > bp) { bp = data[o + c]; best = c; }
    if (best !== blankIndex && best !== prev) { text += chars[best] ?? ''; sum += bp; n++; }
    prev = best;
  }
  return { text, conf: n ? sum / n : 0 };
}

function linesToWords(lines) {
  const words = [];
  lines.forEach((L, li) => {
    if (L.vertical) { words.push({ ...L, line: li }); return; }
    const n = L.text.length, span = L.x1 - L.x0;
    let i = 0;
    for (const m of L.text.matchAll(/\S+/g)) {
      const a = m.index, b = a + m[0].length;
      const text = m[0].replace(/^[^A-Za-z0-9(]+|[^A-Za-z0-9)]+$/g, '');
      if (text) words.push({
        text, conf: L.conf, line: li, word: i++,
        x0: Math.round(L.x0 + (span * a) / n), x1: Math.round(L.x0 + (span * b) / n), y0: L.y0, y1: L.y1,
      });
    }
  });
  return words;
}
