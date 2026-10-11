// PaddleOCR (PP-OCRv6 det small + PP-OCRv5 English rec mobile, ONNX conversions by
// RapidOCR, Apache-2.0) running on onnxruntime-web WASM. Finds far more diagram labels
// than Tesseract, especially small text and text printed on coloured fills.
//
//   const P = await loadPaddle();                      // fetch models, create sessions (once)
//   const words = await detectText(imageData, { cv }); // [{text, conf 0-100, x0,y0,x1,y1, line}]
//   const lines = await detectText(imageData, { cv, level: 'line' });
//
// Word boxes are split from the detected line box in proportion to character counts.
// That is good enough for ocr.js wordsToLines(), which regroups them into lines anyway.

const base = new URL('..', import.meta.url).href; // .../app/
const MODELS = base + 'models/paddleocr/';
const DET = 'PP-OCRv6_det_small.onnx';
const REC = 'en_PP-OCRv5_rec_mobile.onnx';

const DET_THRESH = 0.3, BOX_THRESH = 0.5, UNCLIP = 1.6, MIN_SIZE = 3, MAX_CANDIDATES = 1000;
const REC_H = 48, REC_BATCH = 6, TEXT_SCORE = 0.5;

let paddlePromise;
export function loadPaddle({ proxy = false } = {}) {
  paddlePromise ??= (async () => {
    // The WebGPU build is the one that loads the asyncify WASM already vendored for
    // transformers.js; we only use its 'wasm' execution provider.
    const ort = await import(base + 'vendor/ort/ort.webgpu.min.mjs');
    ort.env.wasm.wasmPaths = base + 'vendor/ort/';
    ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
    ort.env.wasm.proxy = proxy;
    const [detBuf, recBuf] = await Promise.all([DET, REC].map(async (f) => {
      const r = await fetch(MODELS + f);
      if (!r.ok) throw new Error(`Could not load ${f} (${r.status})`);
      return new Uint8Array(await r.arrayBuffer());
    }));
    const dict = onnxMetadata(recBuf).character?.split(/\r?\n/);
    while (dict?.at(-1) === '') dict.pop(); // trailing newline
    if (!dict?.length) throw new Error('Recognizer has no character dictionary');
    const opts = { executionProviders: ['wasm'], graphOptimizationLevel: 'all' };
    const det = await ort.InferenceSession.create(detBuf, opts);
    const rec = await ort.InferenceSession.create(recBuf, opts);
    return { ort, det, rec, chars: ['', ...dict, ' '] }; // index 0 = CTC blank
  })();
  return paddlePromise;
}

// imageData: ImageData (RGBA). Transparent pixels are composited on white.
export async function detectText(imageData, { cv = window.cv, level = 'word', limitSide = 736, maxSide = 2000 } = {}) {
  const P = await loadPaddle();
  const t0 = performance.now();
  const W = imageData.width, H = imageData.height;
  const src = whiteRGB(cv, imageData);
  try {
    const boxes = await detect(P, cv, src, W, H, limitSide, maxSide);
    const t1 = performance.now();
    const lines = await recognize(P, cv, src, boxes);
    detectText.lastTiming = { det: t1 - t0, rec: performance.now() - t1, boxes: boxes.length };
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

// ---- detection (DB) ----
async function detect(P, cv, src, W, H, limitSide, maxSide) {
  let ratio = 1;
  if (Math.min(W, H) < limitSide) ratio = limitSide / Math.min(W, H);
  if (Math.max(W, H) * ratio > maxSide) ratio = maxSide / Math.max(W, H);
  const dw = Math.max(32, Math.round((W * ratio) / 32) * 32), dh = Math.max(32, Math.round((H * ratio) / 32) * 32);
  const rs = new cv.Mat();
  cv.resize(src, rs, new cv.Size(dw, dh), 0, 0, cv.INTER_LINEAR);
  const x = toCHW(rs.data, dw, dh);
  rs.delete();
  const out = await P.det.run({ [P.det.inputNames[0]]: new P.ort.Tensor('float32', x, [1, 3, dh, dw]) });
  const pred = out[P.det.outputNames[0]].data; // [1,1,dh,dw] probabilities

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
    // Unclip: offset the shrunk text kernel outwards by area * ratio / perimeter.
    const { width: w, height: h } = r.size;
    const d = (w * h * UNCLIP) / (2 * (w + h));
    const big = { center: r.center, size: { width: w + 2 * d, height: h + 2 * d }, angle: r.angle };
    if (Math.min(big.size.width, big.size.height) < MIN_SIZE + 2) continue;
    const pts = rectPoints(big).map(([px, py]) => [
      Math.min(W, Math.max(0, Math.round(px * sx))), Math.min(H, Math.max(0, Math.round(py * sy)))]);
    boxes.push({ pts, score });
  }
  contours.delete();
  // Reading order: top to bottom, then left to right.
  boxes.sort((a, b) => (Math.abs(a.pts[0][1] - b.pts[0][1]) < 10 ? a.pts[0][0] - b.pts[0][0] : a.pts[0][1] - b.pts[0][1]));
  return boxes;
}

// Normalized CHW float tensor in BGR order (as the Paddle models were trained), (v/255-0.5)/0.5.
function toCHW(rgb, w, h, out = new Float32Array(3 * w * h), outW = w, offset = 0) {
  const plane = h * outW;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = (y * w + x) * 3, o = offset + y * outW + x;
    out[o] = rgb[s + 2] / 127.5 - 1; out[o + plane] = rgb[s + 1] / 127.5 - 1; out[o + 2 * plane] = rgb[s] / 127.5 - 1;
  }
  return out;
}

// Corners of a RotatedRect ordered tl, tr, br, bl (PaddleOCR get_mini_boxes order).
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

// Mean probability inside the (convex) quad.
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

// ---- recognition (CTC) ----
async function recognize(P, cv, src, boxes) {
  const items = [];
  for (const b of boxes) {
    const crop = cropQuad(cv, src, b.pts);
    if (!crop) continue;
    const it = { box: b, crops: [crop] };
    if (crop.rows >= 1.5 * crop.cols) { // vertical text: try both 90-degree turns
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
    const imgW = Math.max(320, ...batch.map((j) => Math.ceil(REC_H * j.ratio)));
    const x = new Float32Array(batch.length * 3 * REC_H * imgW); // zero = mid-grey padding
    batch.forEach((j, n) => {
      const rw = Math.min(imgW, Math.max(1, Math.ceil(REC_H * j.ratio)));
      const rs = new cv.Mat();
      cv.resize(j.m, rs, new cv.Size(rw, REC_H), 0, 0, cv.INTER_LINEAR);
      toCHW(rs.data, rw, REC_H, x, imgW, n * 3 * REC_H * imgW);
      rs.delete();
    });
    const out = await P.rec.run({ [P.rec.inputNames[0]]: new P.ort.Tensor('float32', x, [batch.length, 3, REC_H, imgW]) });
    const o = out[P.rec.outputNames[0]];
    const [, T, C] = o.dims;
    batch.forEach((j, n) => {
      const r = ctcDecode(o.data, n * T * C, T, C, P.chars);
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
    // The unclipped DB box carries padding around the ink (~17% of its height per side);
    // inset it so boxes match Tesseract-style ink boxes that ocr.js thresholds expect.
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

function ctcDecode(data, off, T, C, chars) {
  let text = '', sum = 0, n = 0, prev = -1;
  for (let t = 0; t < T; t++) {
    let best = 0, bp = -Infinity;
    const o = off + t * C;
    for (let c = 0; c < C; c++) if (data[o + c] > bp) { bp = data[o + c]; best = c; }
    if (best !== 0 && best !== prev) { text += chars[best] ?? ''; sum += bp; n++; }
    prev = best;
  }
  return { text, conf: n ? sum / n : 0 };
}

// Split each line into words; x positions proportional to character offsets.
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

// Minimal protobuf walk over ONNX ModelProto to read metadata_props (field 14).
function onnxMetadata(buf) {
  const meta = {};
  let p = 0;
  const varint = (end) => { let v = 0, m = 1, b; do { b = buf[p++]; v += (b & 127) * m; m *= 128; } while (b & 128 && p < end); return v; };
  const str = (a, b) => new TextDecoder().decode(buf.subarray(a, b));
  while (p < buf.length) {
    const tag = varint(buf.length), field = Math.floor(tag / 8), wt = tag & 7;
    if (wt === 0) varint(buf.length);
    else if (wt === 1) p += 8;
    else if (wt === 5) p += 4;
    else if (wt === 2) {
      const len = varint(buf.length), end = p + len;
      if (field === 14) {
        let k = '', v = '';
        while (p < end) {
          const t = varint(end), l = varint(end);
          if (t >> 3 === 1) k = str(p, p + l); else if (t >> 3 === 2) v = str(p, p + l);
          p += l;
        }
        meta[k] = v;
      }
      p = end;
    } else break;
  }
  return meta;
}
