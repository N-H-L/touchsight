// Leader-line detection: which part of the drawing does each printed label point at?
// Thin strokes (dark-on-light or light-on-dark) -> probabilistic Hough segments ->
// assign the best segment starting at each label, then follow collinear segments to the tip.

function distToBox(x, y, b) {
  const dx = Math.max(b.x0 - x, 0, x - b.x1);
  const dy = Math.max(b.y0 - y, 0, y - b.y1);
  return Math.hypot(dx, dy);
}

export function thinStrokeMask(cv, gray, boxes, pad = 3) {
  const k = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(7, 7));
  const bh = new cv.Mat(), th = new cv.Mat(), thin = new cv.Mat();
  cv.morphologyEx(gray, bh, cv.MORPH_BLACKHAT, k);
  cv.morphologyEx(gray, th, cv.MORPH_TOPHAT, k);
  cv.max(bh, th, thin);
  cv.threshold(thin, thin, 40, 255, cv.THRESH_BINARY);
  for (const b of boxes) {
    cv.rectangle(thin, new cv.Point(b.x0 - pad, b.y0 - pad), new cv.Point(b.x1 + pad, b.y1 + pad), new cv.Scalar(0), -1);
  }
  k.delete(); bh.delete(); th.delete();
  return thin;
}

export function houghSegments(cv, thin) {
  const lines = new cv.Mat();
  cv.HoughLinesP(thin, lines, 1, Math.PI / 180, 18, 18, 7);
  const segs = [];
  for (let i = 0; i < lines.rows; i++) {
    const [x1, y1, x2, y2] = lines.data32S.slice(i * 4, i * 4 + 4);
    segs.push({ x1, y1, x2, y2, len: Math.hypot(x2 - x1, y2 - y1) });
  }
  lines.delete();
  return segs;
}

function angleOf(dx, dy) { return Math.atan2(dy, dx); }
function angDiff(a, b) { let d = Math.abs(a - b) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; }

export function assignLeaders(textLines, segs) {
  const cands = [];
  textLines.forEach((L, li) => {
    const h = L.y1 - L.y0;
    const cx = (L.x0 + L.x1) / 2, cy = (L.y0 + L.y1) / 2;
    segs.forEach((s, si) => {
      for (const [px, py, qx, qy] of [[s.x1, s.y1, s.x2, s.y2], [s.x2, s.y2, s.x1, s.y1]]) {
        const dp = distToBox(px, py, L);
        const dq = distToBox(qx, qy, L);
        if (dp > Math.max(8, 0.9 * h) || dq < 1.5 * h) continue;
        // The segment must head away from the label, not run along its edge.
        const away = angDiff(angleOf(qx - px, qy - py), angleOf(px - cx, py - cy));
        if (away > Math.PI / 2.6) continue;
        cands.push({ li, si, px, py, qx, qy, score: s.len - 4 * dp - 40 * away });
      }
    });
  });
  cands.sort((a, b) => b.score - a.score);
  const usedL = new Set(), usedS = new Set();
  for (const c of cands) {
    if (usedL.has(c.li) || usedS.has(c.si)) continue;
    usedL.add(c.li); usedS.add(c.si);
    const tip = followChain(c, segs, usedS);
    textLines[c.li].leader = { x1: c.px, y1: c.py, x2: tip.x, y2: tip.y };
  }
  return textLines;
}

// Dotted or broken leaders come out of Hough as several collinear pieces.
function followChain(c, segs, usedS) {
  let tip = { x: c.qx, y: c.qy };
  const dir = angleOf(c.qx - c.px, c.qy - c.py);
  for (let iter = 0; iter < 12; iter++) {
    let best = null;
    segs.forEach((s, si) => {
      if (usedS.has(si)) return;
      for (const [ax, ay, bx, by] of [[s.x1, s.y1, s.x2, s.y2], [s.x2, s.y2, s.x1, s.y1]]) {
        const gap = Math.hypot(ax - tip.x, ay - tip.y);
        if (gap > 14) continue;
        if (angDiff(angleOf(bx - ax, by - ay), dir) > 0.2) continue;
        const ext = (bx - tip.x) * Math.cos(dir) + (by - tip.y) * Math.sin(dir);
        if (ext <= 2) continue;
        if (!best || ext > best.ext) best = { si, ext, x: bx, y: by };
      }
    });
    if (!best) break;
    usedS.add(best.si);
    tip = { x: best.x, y: best.y };
  }
  return tip;
}
