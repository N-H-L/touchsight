// The diagram's own structure lines, as a line-drawing: boundaries between flat
// colour regions (k-means on smoothed colour, small specks merged into their
// neighbours) plus thin drawn strokes that are darker or more saturated than what
// surrounds them (chamber walls, vessel outlines). Print text is erased and short
// strokes (texture stipple, dotted leaders) are dropped.
export function structureLines(cv, src, opt = {}) {
  const K = opt.K ?? 10, wL = opt.wL ?? 0.5;
  const W0 = src.cols, H0 = src.rows;
  const f = Math.min(1, 700 / Math.max(W0, H0));
  const W = Math.round(W0 * f), H = Math.round(H0 * f), N = W * H;
  const rgb = new cv.Mat(); cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
  const small = new cv.Mat(); cv.resize(rgb, small, new cv.Size(W, H), 0, 0, cv.INTER_AREA);
  const sm = new cv.Mat(), t = new cv.Mat();
  cv.bilateralFilter(small, t, 9, 40, 7); cv.bilateralFilter(t, sm, 9, 40, 7); t.delete();
  const lab = new cv.Mat(); cv.cvtColor(sm, lab, cv.COLOR_RGB2Lab);
  const labRaw = new cv.Mat(); cv.cvtColor(small, labRaw, cv.COLOR_RGB2Lab);
  const L = lab.data;

  // Background: near the border colour and connected to the border.
  const bgc = [0, 0, 0];
  { let n = 0; for (let x = 0; x < W; x++) for (const y of [0, H - 1]) { const i = (y * W + x) * 3; bgc[0] += L[i]; bgc[1] += L[i + 1]; bgc[2] += L[i + 2]; n++; } bgc.forEach((v, i) => (bgc[i] = v / n)); }
  const isBgCol = new Uint8Array(N);
  for (let p = 0; p < N; p++) { const i = p * 3; isBgCol[p] = Math.hypot(L[i] - bgc[0], L[i + 1] - bgc[1], L[i + 2] - bgc[2]) < 16 ? 1 : 0; }
  const outside = flood(isBgCol, W, H);

  // k-means on the drawing's colours (lightness down-weighted so shading matters less).
  const idx = []; for (let p = 0; p < N; p++) if (!outside[p]) idx.push(p);
  const data = new cv.Mat(idx.length, 3, cv.CV_32F);
  idx.forEach((p, j) => { const i = p * 3; data.data32F[j * 3] = L[i] * wL; data.data32F[j * 3 + 1] = L[i + 1]; data.data32F[j * 3 + 2] = L[i + 2]; });
  const labels = new cv.Mat(), centers = new cv.Mat();
  cv.kmeans(data, K, labels, new cv.TermCriteria(cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER, 20, 1), 2, cv.KMEANS_PP_CENTERS, centers);
  const lm = new Int16Array(N).fill(-1);
  idx.forEach((p, j) => { lm[p] = labels.data32S[j]; });
  // Background-coloured blobs inside the drawing (arrows, highlights) belong to what surrounds them.
  for (let p = 0; p < N; p++) if (lm[p] >= 0 && isBgCol[p]) lm[p] = -2;

  // Small regions are shading speckle: hand them to their neighbours.
  const minA = opt.minA ?? Math.round(0.0012 * N);
  for (let pass = 0; pass < 2; pass++) {
    const { id, sizes } = components(lm, W, H);
    for (let p = 0; p < N; p++) if (lm[p] >= 0 && sizes[id[p]] < minA) lm[p] = -2;
    fillUnknown(lm, W, H);
  }

  // Region boundaries, kept only where the colour actually steps across them: k-means
  // also cuts smooth shading gradients into bands, and those cuts are not drawn edges.
  const bd = new cv.Mat(H, W, cv.CV_8UC1, new cv.Scalar(0));
  const step = opt.step ?? 18, d = 2;
  const dE = (p, q) => { const i = p * 3, j = q * 3; return Math.hypot(L[i] - L[j], L[i + 1] - L[j + 1], L[i + 2] - L[j + 2]); };
  for (let y = d; y < H - d; y++) for (let x = d; x < W - d; x++) {
    const p = y * W + x, a = lm[p];
    // The drawing's outer edge always counts.
    if (lm[p + 1] !== a && (a === -1 || lm[p + 1] === -1 || dE(p - d + 1, p + d) >= step)) bd.data[p] = 255;
    if (lm[p + W] !== a && (a === -1 || lm[p + W] === -1 || dE(p - (d - 1) * W, p + d * W) >= step)) bd.data[p] = 255;
  }

  // Thin drawn lines: darker or more saturated than their surroundings.
  const Lc = new cv.Mat(H, W, cv.CV_8UC1), Cc = new cv.Mat(H, W, cv.CV_8UC1);
  for (let p = 0; p < N; p++) { const i = p * 3, r = labRaw.data; Lc.data[p] = r[i]; Cc.data[p] = Math.min(255, 2 * Math.hypot(r[i + 1] - 128, r[i + 2] - 128)); }
  const kk = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(7, 7));
  const bh = new cv.Mat(), th = new cv.Mat();
  cv.morphologyEx(Lc, bh, cv.MORPH_BLACKHAT, kk);
  cv.morphologyEx(Cc, th, cv.MORPH_TOPHAT, kk);
  const thinM = new cv.Mat(H, W, cv.CV_8UC1, new cv.Scalar(0));
  for (let p = 0; p < N; p++) thinM.data[p] = (bh.data[p] > 35 || th.data[p] > 50) && !outside[p] ? 255 : 0;
  for (const b of opt.textBoxes ?? []) for (const m of [thinM, bd]) cv.rectangle(m, new cv.Point((b.x0 - 4) * f, (b.y0 - 4) * f), new cv.Point((b.x1 + 4) * f, (b.y1 + 4) * f), new cv.Scalar(0), -1);
  {
    // Keep only strokes long enough to be structure, not stipple or hatching.
    const cl = new cv.Mat(), st = new cv.Mat(), ce = new cv.Mat();
    const n = cv.connectedComponentsWithStats(thinM, cl, st, ce, 8, cv.CV_32S);
    const minLen = (opt.minStroke ?? 0.03) * Math.hypot(W, H);
    const keep = new Uint8Array(n);
    for (let c = 1; c < n; c++) keep[c] = Math.hypot(st.intAt(c, cv.CC_STAT_WIDTH), st.intAt(c, cv.CC_STAT_HEIGHT)) >= minLen ? 1 : 0;
    for (let p = 0; p < N; p++) if (thinM.data[p] && !keep[cl.data32S[p]]) thinM.data[p] = 0;
    cl.delete(); st.delete(); ce.delete();
  }

  const all = new cv.Mat(); cv.bitwise_or(bd, thinM, all);
  const full = new cv.Mat(); cv.resize(all, full, new cv.Size(W0, H0), 0, 0, cv.INTER_LINEAR);
  const mask = new Uint8Array(W0 * H0);
  for (let p = 0; p < W0 * H0; p++) mask[p] = full.data[p] > 40 ? 1 : 0;
  full.delete();
  // Region ids at working resolution (for snapping part fills to the outlines).
  const regions = components(lm, W, H).id;
  if (!opt.views) {
    for (const m of [rgb, small, sm, lab, labRaw, data, labels, centers, Lc, Cc, kk, bh, th, bd, thinM, all]) m.delete();
    return { mask, regions, rW: W, rH: H };
  }
  // Colour view of the regions.
  const vis = new cv.Mat(H, W, cv.CV_8UC3);
  const pal = [];
  for (let k = 0; k < K; k++) { const l = new cv.Mat(1, 1, cv.CV_8UC3); l.data[0] = Math.min(255, centers.data32F[k * 3] / wL); l.data[1] = centers.data32F[k * 3 + 1]; l.data[2] = centers.data32F[k * 3 + 2]; const r = new cv.Mat(); cv.cvtColor(l, r, cv.COLOR_Lab2RGB); pal.push([r.data[0], r.data[1], r.data[2]]); l.delete(); r.delete(); }
  for (let p = 0; p < N; p++) { const c = lm[p] >= 0 ? pal[lm[p]] : lm[p] === -1 ? [255, 255, 255] : [255, 0, 255]; vis.data.set(c, p * 3); }
  const inv = (m) => { const o = new cv.Mat(); cv.bitwise_not(m, o); return o; };
  const views = { regions: vis, bounds: inv(bd), thin: inv(thinM), all: inv(all) };
  for (const m of [rgb, small, sm, lab, labRaw, data, labels, centers, Lc, Cc, kk, bh, th, bd, thinM, all]) m.delete();
  return { mask, regions, rW: W, rH: H, views };
}


// Border-connected pixels of a binary mask.
function flood(m, W, H) {
  const out = new Uint8Array(W * H), st = [];
  for (let x = 0; x < W; x++) for (const y of [0, H - 1]) st.push(y * W + x);
  for (let y = 0; y < H; y++) for (const x of [0, W - 1]) st.push(y * W + x);
  while (st.length) {
    const p = st.pop();
    if (out[p] || !m[p]) continue;
    out[p] = 1;
    const x = p % W;
    if (x > 0) st.push(p - 1); if (x < W - 1) st.push(p + 1); if (p >= W) st.push(p - W); if (p < W * (H - 1)) st.push(p + W);
  }
  return out;
}

// 4-connected components of equal labels (>= 0).
function components(lm, W, H) {
  const id = new Int32Array(W * H).fill(-1), sizes = [];
  const st = [];
  for (let s = 0; s < W * H; s++) {
    if (lm[s] < 0 || id[s] >= 0) continue;
    const c = sizes.length, v = lm[s]; let n = 0;
    st.push(s); id[s] = c;
    while (st.length) {
      const p = st.pop(); n++;
      const x = p % W;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]) {
        if (q < 0 || q >= W * H || id[q] >= 0 || lm[q] !== v) continue;
        id[q] = c; st.push(q);
      }
    }
    sizes.push(n);
  }
  return { id, sizes };
}

// Unknown (-2) pixels take the label of the nearest known drawing pixel (BFS).
function fillUnknown(lm, W, H) {
  let q = [];
  for (let p = 0; p < W * H; p++) if (lm[p] === -2) {
    const x = p % W;
    for (const n of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]) if (n >= 0 && n < W * H && lm[n] >= 0) { q.push(p); break; }
  }
  const seen = new Uint8Array(W * H);
  while (q.length) {
    const next = [];
    const assign = [];
    for (const p of q) {
      if (lm[p] !== -2) continue;
      const x = p % W, cnt = new Map();
      for (const n of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]) if (n >= 0 && n < W * H && lm[n] >= 0) cnt.set(lm[n], (cnt.get(lm[n]) || 0) + 1);
      let best = -2, bc = 0; for (const [k, c] of cnt) if (c > bc) { bc = c; best = k; }
      if (best >= 0) assign.push([p, best]);
    }
    for (const [p, v] of assign) lm[p] = v;
    for (const [p] of assign) {
      const x = p % W;
      for (const n of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]) if (n >= 0 && n < W * H && lm[n] === -2 && !seen[n]) { seen[n] = 1; next.push(n); }
    }
    q = next;
  }
  for (let p = 0; p < W * H; p++) if (lm[p] === -2) lm[p] = -1;
}
