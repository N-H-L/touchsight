// Stage 3 — SVG output in millimetres. Everything tactile is pure black on white
// (swell paper raises any dark toner, so no greys). Print text for sighted readers
// lives in a separate preview layer that is stripped from the tactile export.
import { cellDots, BRAILLE, brailleWidth } from './braille.js';
import { SPEC } from './tactile.js';

export const TEXTURES = [
  { name: 'dots', svg: '<pattern id="tx0" patternUnits="userSpaceOnUse" width="3.6" height="3.6"><circle cx="1.8" cy="1.8" r="0.65"/></pattern>' },
  { name: 'diagonal lines', svg: '<pattern id="tx1" patternUnits="userSpaceOnUse" width="3.2" height="3.2" patternTransform="rotate(45)"><rect x="0" y="0" width="0.55" height="3.2"/></pattern>' },
  { name: 'horizontal lines', svg: '<pattern id="tx2" patternUnits="userSpaceOnUse" width="3.4" height="3.4"><rect x="0" y="0" width="3.4" height="0.55"/></pattern>' },
  { name: 'grid', svg: '<pattern id="tx3" patternUnits="userSpaceOnUse" width="4.2" height="4.2"><rect x="0" y="0" width="4.2" height="0.45"/><rect x="0" y="0" width="0.45" height="4.2"/></pattern>' },
  { name: 'vertical lines', svg: '<pattern id="tx4" patternUnits="userSpaceOnUse" width="3.4" height="3.4"><rect x="0" y="0" width="0.55" height="3.4"/></pattern>' },
];

const f = (n) => Math.round(n * 100) / 100;
const pathD = (polys) => polys.map((p) => 'M' + p.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z').join('');
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function brailleSVG(cells, x, y) {
  const r = BRAILLE.dotDiameter / 2;
  return cellDots(cells, x, y).map(([cx, cy]) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${r}"/>`).join('');
}

// Approximate print-text width (mm) for the screen preview font.
const textW = (s, size) => s.length * size * 0.55;

export function renderTactile(layout, { preview = false, highlight = null, underlay = null, braille = true } = {}) {
  const { pageW, pageH } = layout;
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${f(pageW)}mm" height="${f(pageH)}mm" viewBox="0 0 ${f(pageW)} ${f(pageH)}">`);
  out.push(`<defs>${TEXTURES.map((t) => t.svg).join('')}</defs>`);
  out.push(`<rect width="${f(pageW)}" height="${f(pageH)}" fill="#fff"/>`);

  // Textures (largest first so smaller parts sit on top), each with a white underlay.
  const textured = layout.parts.filter((p) => p.texture != null).sort((a, b) => b.areaMM - a.areaMM);
  out.push('<g id="textures">');
  for (const p of textured) {
    const d = pathD(p.fill);
    out.push(`<path d="${d}" fill="#fff" fill-rule="evenodd"/><path d="${d}" fill="url(#tx${p.texture})" fill-rule="evenodd" data-part="${p.id}"/>`);
  }
  out.push('</g>');

  out.push(`<g id="outlines" fill="none" stroke="#000" stroke-linejoin="round" stroke-linecap="round">`);
  out.push(`<path d="${pathD(layout.silhouette)}" stroke-width="${SPEC.outline}"/>`);
  for (const p of layout.parts) if (p.outline.length) out.push(`<path d="${pathD(p.outline)}" stroke-width="${SPEC.partLine}" data-part="${p.id}"/>`);
  out.push('</g>');

  if (preview && underlay) {
    // Original diagram blended over the tactile lines so parts can be matched up.
    out.push(`<image href="${underlay.href}" x="${f(layout.ox)}" y="${f(layout.oy)}" width="${f(underlay.w * layout.s)}" height="${f(underlay.h * layout.s)}" opacity="${underlay.opacity ?? 0.45}" style="mix-blend-mode:multiply"/>`);
  }
  // Knockouts: pill-shaped blank space around labels that had to sit on the drawing.
  // (Always white in the tactile output: grey toner would swell on capsule paper.)
  out.push('<g id="knockouts" fill="#fff">');
  for (const L of layout.labels) if (L.knockout) {
    const g = SPEC.clearance, r = L.rect, h = r.h + 2 * g;
    out.push(`<rect x="${f(r.x - g)}" y="${f(r.y - g)}" width="${f(r.w + 2 * g)}" height="${f(h)}" rx="${f(h / 2)}"/>`);
  }
  out.push('</g>');
  if (preview) {
    // Screen-only: a light grey pill behind each label (braille + print) so it reads clearly.
    out.push('<g id="label-pills" fill="#e8e5dc" stroke="#d3cfc3" stroke-width="0.25">');
    layout.labels.forEach((L, i) => {
      const r = L.rect, ts = highlight === i ? 3.6 : 3.0;
      const txt = L.usesKey ? `${L.key} = ${L.text}` : L.text;
      const w = Math.max(r.w, textW(txt, ts)) + 5, h = r.h + ts + 5.2;
      out.push(`<rect x="${f(r.x - 2.5)}" y="${f(r.y - ts - 2.6)}" width="${f(w)}" height="${f(h)}" rx="${f(Math.min(h, w) / 2)}"${highlight === i ? ' fill="#f6d77a"' : ''}/>`);
    });
    out.push('</g>');
  }

  out.push(`<g id="leaders" stroke="#000" stroke-width="${SPEC.leaderLine}" stroke-linecap="round">`);
  for (const L of layout.labels) if (L.leader) {
    const [[x1, y1], [x2, y2]] = L.leader;
    out.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`);
  }
  out.push('</g>');

  out.push('<g id="braille" fill="#000">');
  if (braille && layout.title) {
    const w = brailleWidth(layout.title.cells.length);
    out.push(brailleSVG(layout.title.cells, (pageW - w) / 2, layout.margin));
  }
  if (braille) layout.labels.forEach((L, i) => out.push(`<g data-label="${i}">${brailleSVG(L.cells, L.rect.x, L.rect.y)}</g>`));
  out.push('</g>');

  if (preview) {
    // Print layer for sighted teachers (not part of the tactile export).
    out.push('<g id="print-preview" font-family="Atkinson Hyperlegible, system-ui, sans-serif" fill="#1e3a8a">');
    layout.labels.forEach((L, i) => {
      const hl = highlight === i;
      out.push(`<text x="${f(L.rect.x)}" y="${f(L.rect.y - 1.7)}" font-size="${hl ? 3.6 : 3.0}" font-weight="700">${esc(L.usesKey ? `${L.key} = ${L.text}` : L.text)}</text>`);
    });
    out.push('</g>');
  }
  out.push('</svg>');
  return out.join('');
}

// Key page: braille key in a two-column list, with print text in the preview layer.
export function renderKeyPage(layout, { preview = false } = {}) {
  const { pageW, pageH, margin } = layout;
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" width="${f(pageW)}mm" height="${f(pageH)}mm" viewBox="0 0 ${f(pageW)} ${f(pageH)}">`,
    `<rect width="${f(pageW)}" height="${f(pageH)}" fill="#fff"/>`, '<g fill="#000">'];
  let y = margin;
  const titleCells = layout.title ? layout.title.cells : [];
  if (titleCells.length) { out.push(brailleSVG(titleCells, (pageW - brailleWidth(titleCells.length)) / 2, y)); y += 2 * BRAILLE.linePitch; }
  const printRows = [];
  for (const e of layout.keyEntries) {
    const x2 = margin + 4 * BRAILLE.cellPitch;
    // Wrap long definitions across braille lines.
    const maxCells = Math.floor((pageW - x2 - margin) / BRAILLE.cellPitch);
    const rows = [];
    let cur = [];
    for (const c of e.textCells) { cur.push(c); if (cur.length >= maxCells) { rows.push(cur); cur = []; } }
    if (cur.length) rows.push(cur);
    if (y + rows.length * BRAILLE.linePitch > pageH - margin) break;
    out.push(brailleSVG(e.keyCells, margin, y));
    printRows.push({ y, key: e.key, text: e.text });
    rows.forEach((r, i) => out.push(brailleSVG(r, x2, y + i * BRAILLE.linePitch)));
    y += rows.length * BRAILLE.linePitch;
  }
  out.push('</g>');
  if (preview) {
    out.push('<g font-family="system-ui, sans-serif" font-size="3.2" fill="#2563eb">');
    for (const r of printRows) out.push(`<text x="${f(margin)}" y="${f(r.y - 1.6)}">${esc(r.key)}</text><text x="${f(margin + 4 * BRAILLE.cellPitch)}" y="${f(r.y - 1.6)}">${esc(r.text)}</text>`);
    out.push('</g>');
  }
  out.push('</svg>');
  return out.join('');
}
