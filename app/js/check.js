// Automated checks derived from the BANA tactile graphics guidelines (TACTILE_SPEC.md).
// The same measurements run on TouchSight's output and on a naive baseline (Canny edge
// tracing scaled to the same page), so the comparison is like-for-like.
import { SPEC } from './tactile.js';
import { BRAILLE } from './braille.js';

const RES = 4; // raster px per mm

function rasterCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * RES); c.height = Math.ceil(h * RES);
  return c;
}
function polyPath(ctx, polys) {
  ctx.beginPath();
  for (const p of polys) { p.forEach(([x, y], i) => (i ? ctx.lineTo(x * RES, y * RES) : ctx.moveTo(x * RES, y * RES))); ctx.closePath(); }
}
function toBinaryMat(cv, canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const m = new cv.Mat(canvas.height, canvas.width, cv.CV_8UC1);
  for (let i = 0; i < m.rows * m.cols; i++) m.data[i] = data[i * 4 + 3] > 100 ? 255 : 0;
  return m;
}

// Rasterize TouchSight's layout into line / texture layers + braille dot list.
function layersFromLayout(cv, layout) {
  const lc = rasterCanvas(layout.pageW, layout.pageH), tc = rasterCanvas(layout.pageW, layout.pageH);
  const l = lc.getContext('2d'), t = tc.getContext('2d');
  l.lineJoin = 'round'; l.lineCap = 'round'; l.strokeStyle = '#000';
  l.lineWidth = SPEC.outline * RES; polyPath(l, layout.silhouette); l.stroke();
  l.lineWidth = SPEC.partLine * RES;
  for (const p of layout.parts) if (p.outline.length) { polyPath(l, p.outline); l.stroke(); }
  t.fillStyle = '#000';
  for (const p of layout.parts) if (p.fill) { polyPath(t, p.fill); t.fill('evenodd'); }
  // Knockouts clear lines/textures under labels, exactly as in the SVG.
  for (const L of layout.labels) if (L.knockout) {
    const g = SPEC.clearance, r = L.rect;
    for (const ctx of [l, t]) ctx.clearRect((r.x - g) * RES, (r.y - g) * RES, (r.w + 2 * g) * RES, (r.h + 2 * g) * RES);
  }
  l.lineWidth = SPEC.leaderLine * RES;
  for (const L of layout.labels) if (L.leader) { const [[x1, y1], [x2, y2]] = L.leader; l.beginPath(); l.moveTo(x1 * RES, y1 * RES); l.lineTo(x2 * RES, y2 * RES); l.stroke(); }
  const labels = layout.labels.map((L) => ({ rect: L.rect, leader: L.leader }));
  return { lines: toBinaryMat(cv, lc), textures: toBinaryMat(cv, tc), labels, textureCount: layout.parts.filter((p) => p.texture != null).length };
}

// Baseline: what "just trace the picture" gives — Canny edges at the same scale,
// thickened to a raisable 0.8 mm line.
function layersFromBaseline(cv, imageData, layout) {
  const src = cv.matFromImageData(imageData), gray = new cv.Mat(), edges = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.GaussianBlur(gray, gray, new cv.Size(3, 3), 0);
  cv.Canny(gray, edges, 60, 160);
  const w = Math.ceil(layout.pageW * RES), h = Math.ceil(layout.pageH * RES);
  const out = cv.Mat.zeros(h, w, cv.CV_8UC1);
  const W = imageData.width, H = imageData.height;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!edges.data[y * W + x]) continue;
    const X = Math.round((layout.ox + x * layout.s) * RES), Y = Math.round((layout.oy + y * layout.s) * RES);
    if (X >= 0 && Y >= 0 && X < w && Y < h) out.data[Y * w + X] = 255;
  }
  const k = Math.max(1, Math.round(0.8 * RES)) | 1;
  const ker = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(k, k));
  cv.dilate(out, out, ker);
  ker.delete(); src.delete(); gray.delete(); edges.delete();
  return { lines: out, textures: cv.Mat.zeros(h, w, cv.CV_8UC1), labels: [], textureCount: 0 };
}

function measure(cv, layers, layout, analysis, kind) {
  const { lines, textures } = layers;
  const W = lines.cols, H = lines.rows;
  // Figure area = bounding box of the drawing on the page.
  const fx0 = layout.ox * RES, fy0 = layout.oy * RES, fx1 = (layout.ox + analysis.W * layout.s) * RES, fy1 = (layout.oy + analysis.H * layout.s) * RES;
  const figArea = (fx1 - fx0) * (fy1 - fy0) / (RES * RES);

  // 1) Print text left on the page (non-braille ink inside the original print-label boxes).
  let printLeft = 0;
  const active = analysis.labels.filter((L) => !L.removed);
  for (const L of active) {
    const x0 = Math.max(0, Math.floor((layout.ox + L.x0 * layout.s) * RES)), x1 = Math.min(W - 1, Math.ceil((layout.ox + L.x1 * layout.s) * RES));
    const y0 = Math.max(0, Math.floor((layout.oy + L.y0 * layout.s) * RES)), y1 = Math.min(H - 1, Math.ceil((layout.oy + L.y1 * layout.s) * RES));
    let ink = 0, tot = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { tot++; if (lines.data[y * W + x] || textures.data[y * W + x]) ink++; }
    if (tot && ink / tot > 0.12) printLeft++;
  }

  // 2) Lines closer than 3 mm (closing with a 3 mm disk fills gaps narrower than that).
  const k = Math.round(SPEC.clearance * RES) | 1;
  const ker = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(k, k));
  const closed = new cv.Mat();
  cv.morphologyEx(lines, closed, cv.MORPH_CLOSE, ker);
  let gapPx = 0;
  for (let i = 0; i < W * H; i++) if (closed.data[i] && !lines.data[i]) gapPx++;
  closed.delete(); ker.delete();
  const narrowGapPct = 100 * (gapPx / (RES * RES)) / figArea;

  // 3) Fragments too short to trace by touch (< 12.5 mm extent).
  const labelsMat = new cv.Mat(), stats = new cv.Mat(), cents = new cv.Mat();
  const n = cv.connectedComponentsWithStats(lines, labelsMat, stats, cents, 8, cv.CV_32S);
  let fragments = 0;
  for (let i = 1; i < n; i++) {
    const w = stats.intAt(i, cv.CC_STAT_WIDTH) / RES, h = stats.intAt(i, cv.CC_STAT_HEIGHT) / RES;
    if (Math.hypot(w, h) < SPEC.minLine) fragments++;
  }
  labelsMat.delete(); stats.delete(); cents.delete();

  // 4) Braille clearance: every dot at least 3 mm (edge to edge) from lines and textures.
  let clearOK = 0;
  if (layers.labels.length) {
    const ink = new cv.Mat();
    cv.bitwise_or(lines, textures, ink);
    // Remove each label's own leader from the clearance test (it is meant to approach the label).
    const inv = new cv.Mat();
    cv.bitwise_not(ink, inv);
    const dist = new cv.Mat();
    cv.distanceTransform(inv, dist, cv.DIST_L2, 3);
    for (const L of layers.labels) {
      const r = L.rect;
      let minD = Infinity;
      for (let y = r.y; y <= r.y + r.h + 1e-6; y += BRAILLE.dotPitch) for (let x = r.x; x <= r.x + r.w + 1e-6; x += 1.2) {
        const X = Math.round(x * RES), Y = Math.round(y * RES);
        if (X >= 0 && Y >= 0 && X < W && Y < H) minD = Math.min(minD, dist.floatAt(Y, X) / RES);
      }
      if (minD - BRAILLE.dotDiameter / 2 >= SPEC.clearance - 0.25 - (L.leader ? 0 : 0)) clearOK++;
    }
    ink.delete(); inv.delete(); dist.delete();
  }

  return {
    kind,
    printTextLeft: printLeft,
    printLabels: active.length,
    brailleLabels: layers.labels.length,
    narrowGapPct: +narrowGapPct.toFixed(1),
    fragments,
    brailleClear: layers.labels.length ? clearOK : 0,
    textures: layers.textureCount,
  };
}

export function checkAll(cv, analysis, layout, imageData) {
  const ours = layersFromLayout(cv, layout);
  const base = layersFromBaseline(cv, imageData, layout);
  const a = measure(cv, ours, layout, analysis, 'touchsight');
  const b = measure(cv, base, layout, analysis, 'baseline');
  for (const L of [ours, base]) { L.lines.delete(); L.textures.delete(); }
  const leaders = layout.labels.filter((L) => L.leader).map((L) => Math.hypot(L.leader[1][0] - L.leader[0][0], L.leader[1][1] - L.leader[0][1]));
  const rules = [
    { id: 'print', name: 'Print-label spots still covered by raised marks', ours: `${a.printTextLeft} of ${a.printLabels}`, base: `${b.printTextLeft} of ${b.printLabels}`, pass: a.printTextLeft === 0 },
    { id: 'braille', name: 'Labels available in braille', ours: `${a.brailleLabels} of ${a.printLabels}`, base: `0 of ${b.printLabels}`, pass: a.brailleLabels >= a.printLabels },
    { id: 'gaps', name: 'Lines closer than 3 mm (% of figure area)', ours: `${a.narrowGapPct}%`, base: `${b.narrowGapPct}%`, pass: a.narrowGapPct < 5 },
    { id: 'frags', name: 'Fragments shorter than 12.5 mm', ours: `${a.fragments}`, base: `${b.fragments}`, pass: a.fragments <= 3 },
    { id: 'clear', name: 'Braille labels with 3 mm clearance', ours: `${a.brailleClear} of ${a.brailleLabels}`, base: '—', pass: a.brailleClear === a.brailleLabels },
    { id: 'tex', name: 'Textures used (max 5)', ours: `${a.textures}`, base: '0', pass: a.textures <= 5 },
    { id: 'lead', name: 'Leader lines 20–37.5 mm long', ours: `${leaders.filter((d) => d >= 20 && d <= 37.5).length} of ${leaders.length}`, base: '—', pass: null },
  ];
  return { ours: a, base: b, rules };
}
