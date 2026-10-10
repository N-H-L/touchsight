// Stage 2 — turn the analysis into a tactile layout in millimetres, following the
// BANA-derived parameters in docs/hackathon/TACTILE_SPEC.md.
import { fillHoles } from './pipeline.js';
import { toCells, makeKeys, brailleWidth, brailleHeight, BRAILLE } from './braille.js';

export const SPEC = {
  clearance: 3,          // mm between distinct symbols / braille and lines
  minArea: 161,          // mm², smallest area a reader can identify (1/4 sq in)
  minLine: 12.5,         // mm, shortest primary line
  outline: 1.5,          // mm stroke, silhouette
  partLine: 1.0,         // mm stroke, part outlines
  leaderLine: 0.6,       // mm stroke, thinnest line in the graphic
  textureInset: 1.5,     // mm blank break between a texture and its outline
  maxTextures: 5,
};

export const PAGES = {
  letter: { name: 'Swell paper, Letter (8.5×11 in)', w: 215.9, h: 279.4 },
  tabloid: { name: 'Swell paper, Tabloid (11×17 in)', w: 279.4, h: 431.8 },
  braille: { name: 'Braille page (11.5×11 in)', w: 292.1, h: 279.4 },
};

export function buildLayout(cv, analysis, opts = {}) {
  const { W, H } = analysis;
  const page = PAGES[opts.page || 'letter'];
  const landscape = W / H > 1.15 && opts.page !== 'braille';
  const pageW = landscape ? page.h : page.w, pageH = landscape ? page.w : page.h;
  const margin = 15, titleH = opts.title ? 14 : 0;
  const areaW = pageW - 2 * margin, areaH = pageH - 2 * margin - titleH;
  const s = Math.min(areaW / W, areaH / H);
  const ox = margin + (areaW - W * s) / 2, oy = margin + titleH + (areaH - H * s) / 2;
  const toMM = ([x, y]) => [ox + x * s, oy + y * s];
  const px = (mm) => mm / s; // mm -> image px

  const labels = analysis.labels.filter((L) => !L.removed);

  // Silhouette: the outer shape of the drawing.
  const fgMat = maskToMat(cv, analysis.fg, W, H);
  const silhouette = contoursOf(cv, fgMat, px(0.5)).filter((p) => perimeter(p) * s >= SPEC.minLine).map((p) => p.map(toMM));

  // Parts: one per labeled SAM mask, cleaned up and deduplicated.
  const parts = [];
  const fgArea = countOnes(analysis.fg);
  const k = Math.max(3, Math.round(px(2.5))) | 1; // smooth away shading speckle (~2.5 mm)
  const ker = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(k, k));
  labels.forEach((L) => {
    L.partId = null;
    if (!L.mask || L.skipPart) return;
    const m = maskToMat(cv, L.mask, W, H);
    cv.morphologyEx(m, m, cv.MORPH_OPEN, ker);
    cv.morphologyEx(m, m, cv.MORPH_CLOSE, ker);
    keepLargest(cv, m);
    fillHoles(cv, m);
    const area = cv.countNonZero(m);
    if (area * s * s < 12) { m.delete(); return; }
    const whole = area > 0.7 * fgArea;
    const dup = parts.find((p) => iouMat(cv, p.mat, m) > 0.85);
    if (dup) { L.partId = dup.id; m.delete(); return; }
    const id = parts.length;
    parts.push({ id, mat: m, area, areaMM: area * s * s, whole, labelText: L.text });
    L.partId = id;
  });
  ker.delete();

  // Textures: distinct patterns for the largest identifiable parts (BANA: at most 5).
  // Very large parts (most of the figure) get an outline only: a texture there would
  // swamp everything inside it.
  const texturable = parts.filter((p) => !p.whole && p.areaMM >= SPEC.minArea * 1.5 && p.area < 0.35 * fgArea)
    .sort((a, b) => b.areaMM - a.areaMM).slice(0, opts.textures === false ? 0 : 4);
  texturable.forEach((p, i) => { p.texture = i; });

  const inset = Math.max(1, Math.round(px(SPEC.textureInset)));
  const insetKer = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(2 * inset + 1, 2 * inset + 1));
  for (const p of parts) {
    p.outline = p.whole || p.areaMM < 25 ? [] : contoursOf(cv, p.mat, px(0.9)).filter((c) => perimeter(c) * s >= SPEC.minLine * 0.6).map((c) => c.map(toMM));
    if (p.texture != null) {
      const er = new cv.Mat();
      cv.erode(p.mat, er, insetKer);
      p.fill = contoursOf(cv, er, px(0.4)).map((c) => c.map(toMM));
      er.delete();
    }
  }
  insetKer.delete();
  fgMat.delete();

  // Occupancy grid (2 cells/mm) of drawn ink, used to keep braille 3 mm clear of lines.
  const grid = new Grid(pageW, pageH, 2);
  for (const poly of silhouette) grid.strokePoly(poly, SPEC.outline / 2 + SPEC.clearance);
  for (const p of parts) {
    for (const poly of p.outline) grid.strokePoly(poly, SPEC.partLine / 2 + SPEC.clearance);
    if (p.fill) for (const poly of p.fill) grid.fillPoly(poly, SPEC.clearance);
  }

  // Labels: full uncontracted braille where it fits, otherwise a two-letter key.
  const keys = makeKeys(labels.map((L) => L.text));
  const placed = [];
  const bh = brailleHeight();
  labels.forEach((L, i) => {
    const text = L.text.toLowerCase(); // capital indicators omitted in labels (noted in transcriber's note)
    const full = toCells(text), key = toCells(keys[i]);
    const box = { x0: ox + L.x0 * s, y0: oy + L.y0 * s, x1: ox + L.x1 * s, y1: oy + L.y1 * s };
    const cy = (box.y0 + box.y1) / 2;
    let align = 'center';
    if (L.leader) align = L.leader.x1 >= (L.x0 + L.x1) / 2 ? 'right' : 'left';
    const tip = L.leader ? toMM([L.leader.x2, L.leader.y2]) : null;
    const tryPlace = (cells, allowKnockout) => {
      const w = brailleWidth(cells.length);
      const baseX = align === 'right' ? box.x1 - w : align === 'left' ? box.x0 : (box.x0 + box.x1 - w) / 2;
      const offsets = [[0, 0]];
      for (let r = 4; r <= 24; r += 4) offsets.push([0, -r], [0, r], [r, 0], [-r, 0], [r, -r], [-r, -r], [r, r], [-r, r]);
      for (const [dx, dy] of offsets) {
        const rect = { x: baseX + dx, y: cy - bh / 2 + dy, w, h: bh };
        if (rect.x < 5 || rect.y < 5 || rect.x + rect.w > pageW - 5 || rect.y + rect.h > pageH - 5) continue;
        if (grid.rectFree(rect) && placed.every((o) => !overlap(rect, o.rect, SPEC.clearance))) return { rect, knockout: false };
      }
      if (allowKnockout) {
        const rect = { x: clamp(baseX, 5, pageW - 5 - w), y: clamp(cy - bh / 2, 5, pageH - 5 - bh), w, h: bh };
        if (placed.every((o) => !overlap(rect, o.rect, SPEC.clearance))) return { rect, knockout: true };
      }
      return null;
    };
    let usesKey = false;
    let pos = opts.forceKeys ? null : tryPlace(full, false);
    if (!pos) { usesKey = true; pos = tryPlace(key, true); }
    if (!pos) return; // could not place without colliding with another label
    const cells = usesKey ? key : full;
    const entry = { text: L.text, key: keys[i], usesKey, cells, rect: pos.rect, knockout: pos.knockout, leader: null };
    // Leader from 3 mm off the label to the part (or to the original label spot if moved).
    const target = tip ?? (pos.rect.x !== undefined && distRectPoint(pos.rect, [(box.x0 + box.x1) / 2, cy]) > 6 ? [(box.x0 + box.x1) / 2, cy] : null);
    if (target) {
      // Measured from the dot centres: clearance + dot radius + half the leader stroke.
      const start = rectExitPoint(pos.rect, target, SPEC.clearance + BRAILLE.dotDiameter / 2 + SPEC.leaderLine / 2 + 0.1);
      if (start && Math.hypot(target[0] - start[0], target[1] - start[1]) > 3) entry.leader = [start, target];
    }
    placed.push(entry);
    grid.fillRect(pos.rect, SPEC.clearance);
  });

  const keyEntries = placed.filter((p) => p.usesKey).map((p) => ({ key: p.key, text: p.text, keyCells: p.cells, textCells: toCells(p.text.toLowerCase()) }));
  const title = opts.title ? { text: opts.title, cells: toCells(opts.title.toLowerCase()) } : null;
  for (const p of parts) p.mat.delete();

  return {
    pageW, pageH, s, ox, oy, margin, title,
    silhouette,
    parts: parts.map(({ mat, ...p }) => p),
    labels: placed,
    keyEntries,
    stats: {
      labelsDetected: analysis.labels.length, labelsPlaced: placed.length,
      fullLabels: placed.filter((p) => !p.usesKey).length, keyLabels: keyEntries.length,
      parts: parts.length, textures: texturable.length,
    },
  };
}

// ---------- geometry helpers ----------

function maskToMat(cv, mask, W, H) {
  const m = new cv.Mat(H, W, cv.CV_8UC1);
  for (let i = 0; i < W * H; i++) m.data[i] = mask[i] ? 255 : 0;
  return m;
}
function countOnes(a) { let n = 0; for (let i = 0; i < a.length; i++) n += a[i]; return n; }

function keepLargest(cv, m) {
  const cs = new cv.MatVector(), h = new cv.Mat();
  cv.findContours(m, cs, h, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  let best = -1, bestA = 0;
  for (let i = 0; i < cs.size(); i++) { const c = cs.get(i); const a = cv.contourArea(c); if (a > bestA) { bestA = a; best = i; } c.delete(); }
  m.setTo(new cv.Scalar(0));
  if (best >= 0) cv.drawContours(m, cs, best, new cv.Scalar(255), -1);
  cs.delete(); h.delete();
}

function iouMat(cv, a, b) {
  const i = new cv.Mat(), u = new cv.Mat();
  cv.bitwise_and(a, b, i); cv.bitwise_or(a, b, u);
  const r = cv.countNonZero(i) / Math.max(1, cv.countNonZero(u));
  i.delete(); u.delete();
  return r;
}

// Contours (outer + holes) simplified with Douglas–Peucker then Chaikin-smoothed.
function contoursOf(cv, m, eps) {
  const cs = new cv.MatVector(), h = new cv.Mat();
  const tmp = m.clone();
  cv.findContours(tmp, cs, h, cv.RETR_CCOMP, cv.CHAIN_APPROX_NONE);
  const out = [];
  for (let i = 0; i < cs.size(); i++) {
    const c = cs.get(i);
    const ap = new cv.Mat();
    cv.approxPolyDP(c, ap, Math.max(0.8, eps), true);
    const pts = [];
    for (let j = 0; j < ap.rows; j++) pts.push([ap.data32S[j * 2], ap.data32S[j * 2 + 1]]);
    if (pts.length >= 3) out.push(chaikin(chaikin(pts)));
    c.delete(); ap.delete();
  }
  cs.delete(); h.delete(); tmp.delete();
  return out;
}

function chaikin(pts) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    out.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]], [0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
  }
  return out;
}

export function perimeter(p) {
  let s = 0;
  for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  return s;
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function overlap(a, b, gap) {
  return a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
}
function distRectPoint(r, [x, y]) {
  const dx = Math.max(r.x - x, 0, x - (r.x + r.w)), dy = Math.max(r.y - y, 0, y - (r.y + r.h));
  return Math.hypot(dx, dy);
}
// Point on the rect (grown by `gap`) boundary along the ray from its center to `target`.
function rectExitPoint(r, target, gap) {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const dx = target[0] - cx, dy = target[1] - cy;
  const hw = r.w / 2 + gap, hh = r.h / 2 + gap;
  const t = Math.min(Math.abs(dx) > 1e-6 ? hw / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-6 ? hh / Math.abs(dy) : Infinity);
  if (t >= 1) return null; // target is inside the clearance zone
  return [cx + dx * t, cy + dy * t];
}

class Grid {
  constructor(w, h, res) { this.res = res; this.w = Math.ceil(w * res); this.h = Math.ceil(h * res); this.a = new Uint8Array(this.w * this.h); }
  set(x, y) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.a[y * this.w + x] = 1; }
  disc(cx, cy, r) {
    const R = r * this.res, X = cx * this.res, Y = cy * this.res;
    for (let y = Math.floor(Y - R); y <= Y + R; y++) for (let x = Math.floor(X - R); x <= X + R; x++) {
      if ((x - X) ** 2 + (y - Y) ** 2 <= R * R) this.set(x, y);
    }
  }
  strokePoly(poly, r) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * this.res / Math.max(1, r * this.res * 0.7)));
      for (let k = 0; k <= n; k++) this.disc(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n, r);
    }
  }
  fillPoly(poly, grow) {
    // Scanline fill, then grow by stroking the boundary.
    const ys = poly.map((p) => p[1]);
    const y0 = Math.floor(Math.min(...ys) * this.res), y1 = Math.ceil(Math.max(...ys) * this.res);
    for (let y = y0; y <= y1; y++) {
      const yy = (y + 0.5) / this.res, xs = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) xs.push(a[0] + (yy - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.floor(xs[i] * this.res); x <= xs[i + 1] * this.res; x++) this.set(x, y);
    }
    if (grow) this.strokePoly(poly, grow);
  }
  fillRect(r, grow) {
    for (let y = Math.floor((r.y - grow) * this.res); y <= (r.y + r.h + grow) * this.res; y++)
      for (let x = Math.floor((r.x - grow) * this.res); x <= (r.x + r.w + grow) * this.res; x++) this.set(x, y);
  }
  rectFree(r) {
    // Braille dots have radius ~0.72 mm; test the dot box.
    const pad = BRAILLE.dotDiameter / 2;
    for (let y = Math.floor((r.y - pad) * this.res); y <= (r.y + r.h + pad) * this.res; y++)
      for (let x = Math.floor((r.x - pad) * this.res); x <= (r.x + r.w + pad) * this.res; x++) {
        if (x < 0 || y < 0 || x >= this.w || y >= this.h || this.a[y * this.w + x]) return false;
      }
    return true;
  }
}
