import { loadOpenCV } from './libs.js';
import { analyze } from './pipeline.js';
import { buildLayout } from './tactile.js';
import { renderTactile, renderKeyPage } from './render.js';
import { checkAll } from './check.js';
import { toUnicode } from './braille.js';

const $ = (s) => document.querySelector(s);
const state = { imageData: null, analysis: null, layout: null, check: null, name: 'diagram', busy: false };
const MAX_SIDE = 1400; // keep in-browser inference fast

// ---------- samples ----------
const DEMO_ORDER = ['heart', 'volcano', 'animal-cell', 'flower', 'mitochondrion', 'ear', 'earth-layers', 'tooth', 'eye'];
const samples = await fetch('samples/samples.json').then((r) => r.json()).catch(() => []);
const byId = Object.fromEntries(samples.map((s) => [s.id, s]));
const grid = $('#samples');
for (const id of DEMO_ORDER) {
  const s = byId[id]; if (!s) continue;
  const b = document.createElement('button');
  b.className = 'sample'; b.type = 'button'; b.setAttribute('role', 'listitem'); b.setAttribute('aria-pressed', 'false');
  const short = s.title.replace(/^(Diagram of the |Schematic diagram of the )/i, '').replace(/^./, (c) => c.toUpperCase());
  b.innerHTML = `<img src="samples/${s.file}" alt="" loading="lazy"><span>${short}</span>`;
  b.title = `${s.title} — ${s.author}, ${s.license}`;
  b.onclick = () => { selectSample(b); runFromURL(`samples/${s.file}`, short, id); };
  grid.appendChild(b);
}
function selectSample(btn) { grid.querySelectorAll('.sample').forEach((x) => x.setAttribute('aria-pressed', String(x === btn))); }

// ---------- input ----------
const drop = $('#drop'), file = $('#file');
drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
file.addEventListener('change', () => file.files[0] && runFromFile(file.files[0]));
['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (f) runFromFile(f); });

function runFromFile(f) {
  if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return setStatus('Please choose a PNG, JPG or WebP image.', true);
  if (f.size > 15 * 1024 * 1024) return setStatus('That image is over 15 MB. Please use a smaller file.', true);
  selectSample(null);
  const url = URL.createObjectURL(f);
  runFromURL(url, '', f.name.replace(/\.[^.]+$/, ''));
}

async function runFromURL(url, title, name) {
  if (state.busy) return;
  try {
    const img = new Image(); img.src = url; await img.decode();
    let W = img.naturalWidth, H = img.naturalHeight;
    const k = Math.min(1, MAX_SIDE / Math.max(W, H));
    W = Math.round(W * k); H = Math.round(H * k);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.drawImage(img, 0, 0, W, H);
    state.imageData = ctx.getImageData(0, 0, W, H);
    state.name = name || 'diagram';
    $('#opt-title').value = title || '';
    await run();
  } catch (e) {
    console.error(e);
    setStatus('Could not read that image. ' + (e.message || ''), true);
  }
}

// ---------- pipeline ----------
const stepOrder = ['ocr', 'leaders', 'segment', 'layout', 'check'];
function setStep(k) {
  const i = stepOrder.indexOf(k);
  document.querySelectorAll('.step').forEach((el) => {
    const j = stepOrder.indexOf(el.dataset.step);
    el.classList.toggle('done', j < i || k === 'done');
    el.classList.toggle('active', j === i);
  });
}
function setStatus(msg, err = false) { const s = $('#status'); s.textContent = msg; s.classList.toggle('error', err); }

async function run() {
  state.busy = true;
  document.body.setAttribute('aria-busy', 'true');
  const t0 = performance.now();
  try {
    setStep('ocr');
    state.analysis = await analyze(state.imageData, {
      onStage: (k, msg) => { if (k !== 'engines') setStep(k); setStatus(msg + (k === 'engines' ? ' (first run downloads ~100 MB of models; they are cached afterwards)' : '')); },
    });
    await relayout();
    const secs = ((performance.now() - t0) / 1000).toFixed(1);
    const st = state.layout.stats;
    setStatus(`Done in ${secs} s on this device: ${state.analysis.labels.length} labels found, ${st.parts} parts segmented, ${st.fullLabels} braille labels + ${st.keyLabels} keyed labels.`);
    setStep('done');
  } catch (e) {
    console.error(e);
    if (byId[state.name] && await showPrecomputed(state.name)) {
      setStatus(`This browser could not run the on-device models (${e.message || e}). Showing a result computed earlier with the same pipeline.`, true);
    } else {
      setStatus('Something went wrong: ' + (e.message || e) + '. Try another image or reload the page.', true);
    }
  } finally {
    state.busy = false;
    document.body.removeAttribute('aria-busy');
  }
}

async function showPrecomputed(id) {
  try {
    const svg = await fetch(`precomputed/${id}.svg`).then((r) => (r.ok ? r.text() : null));
    if (!svg) return false;
    $('#tabs').hidden = false; $('#views').hidden = false;
    $('#tactile').innerHTML = svg;
    return true;
  } catch { return false; }
}

async function relayout() {
  const cv = await loadOpenCV();
  setStep('layout');
  state.layout = buildLayout(cv, state.analysis, {
    page: $('#opt-page').value, title: $('#opt-title').value.trim(),
    textures: $('#opt-textures').checked, forceKeys: $('#opt-keys').checked,
  });
  setStep('check');
  state.check = checkAll(cv, state.analysis, state.layout, state.imageData);
  draw();
}

// ---------- views ----------
function draw() {
  $('#tabs').hidden = false; $('#views').hidden = false; $('#side').hidden = false;
  const preview = $('#show-print').checked;
  $('#tactile').innerHTML = renderTactile(state.layout, { preview });
  $('#ours-small').innerHTML = renderTactile(state.layout, { preview: false });
  $('#keypage').innerHTML = state.layout.keyEntries.length
    ? renderKeyPage(state.layout, { preview: true })
    : '<p style="padding:24px;color:#555">Every label fits as full braille, so no key page is needed.</p>';
  drawBaseline();
  drawAnalysis();
  drawLabels();
  drawRules();
  $('#tactile svg')?.setAttribute('aria-label', `Tactile graphic preview with ${state.layout.labels.length} braille labels`);
}

function drawBaseline() {
  // Render the same Canny tracing used by the checker, at the same page size.
  const cv = window.cv, L = state.layout, img = state.imageData;
  const src = cv.matFromImageData(img), gray = new cv.Mat(), edges = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.GaussianBlur(gray, gray, new cv.Size(3, 3), 0);
  cv.Canny(gray, edges, 60, 160);
  // Same 0.8 mm raised line width the checker measures.
  const k = Math.max(1, Math.round(0.8 / L.s)) | 1;
  const ker = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(k, k));
  cv.dilate(edges, edges, ker); ker.delete();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const id = new ImageData(img.width, img.height);
  for (let i = 0; i < img.width * img.height; i++) { const v = edges.data[i] ? 0 : 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
  c.getContext('2d').putImageData(id, 0, 0);
  src.delete(); gray.delete(); edges.delete();
  $('#baseline').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L.pageW} ${L.pageH}"><rect width="100%" height="100%" fill="#fff"/><image href="${c.toDataURL()}" x="${L.ox}" y="${L.oy}" width="${img.width * L.s}" height="${img.height * L.s}"/></svg>`;
}

const PAL = [[230, 25, 75], [60, 180, 75], [0, 130, 200], [245, 130, 48], [145, 30, 180], [70, 200, 200], [240, 50, 230], [150, 190, 40], [0, 128, 128], [170, 110, 40]];
function drawAnalysis(highlight = -1) {
  const a = state.analysis, img = state.imageData, c = $('#analysis');
  c.width = a.W; c.height = a.H;
  const ctx = c.getContext('2d');
  const ov = new ImageData(new Uint8ClampedArray(img.data), a.W, a.H);
  const d = ov.data;
  for (let p = 0; p < a.W * a.H; p++) { d[p * 4] = 255 - (255 - d[p * 4]) * 0.45; d[p * 4 + 1] = 255 - (255 - d[p * 4 + 1]) * 0.45; d[p * 4 + 2] = 255 - (255 - d[p * 4 + 2]) * 0.45; }
  a.labels.forEach((L, i) => {
    if (!L.mask || L.removed) return;
    const [r, g, b] = PAL[i % PAL.length], al = highlight === -1 || highlight === i ? 0.55 : 0.12;
    for (let p = 0; p < a.W * a.H; p++) if (L.mask[p]) { d[p * 4] += (r - d[p * 4]) * al; d[p * 4 + 1] += (g - d[p * 4 + 1]) * al; d[p * 4 + 2] += (b - d[p * 4 + 2]) * al; }
  });
  ctx.putImageData(ov, 0, 0);
  const lw = Math.max(2, a.W / 400);
  a.labels.forEach((L, i) => {
    if (L.removed) return;
    const [r, g, b] = PAL[i % PAL.length];
    ctx.strokeStyle = `rgb(${r},${g},${b})`; ctx.lineWidth = highlight === i ? lw * 2 : lw;
    ctx.strokeRect(L.x0 - 3, L.y0 - 3, L.x1 - L.x0 + 6, L.y1 - L.y0 + 6);
    if (L.leader) { ctx.beginPath(); ctx.moveTo(L.leader.x1, L.leader.y1); ctx.lineTo(L.leader.x2, L.leader.y2); ctx.stroke(); }
    if (L.anchor) { ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(L.anchor[0], L.anchor[1], lw * 2.2, 0, 7); ctx.fill(); ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.beginPath(); ctx.arc(L.anchor[0], L.anchor[1], lw * 1.3, 0, 7); ctx.fill(); }
  });
}

function drawLabels() {
  const ol = $('#labels'); ol.innerHTML = '';
  const placedByText = new Map(state.layout.labels.map((p) => [p.text, p]));
  state.analysis.labels.forEach((L, i) => {
    const li = document.createElement('li');
    if (L.removed) li.classList.add('removed');
    const p = placedByText.get(L.text);
    const how = L.removed ? 'removed' : !p ? 'could not be placed' : p.usesKey ? `key “${p.key}” (full text on key page)` : 'full braille label';
    const part = L.mask ? 'part segmented' : 'no part found';
    li.innerHTML = `<input type="text" aria-label="Label ${i + 1} text" value="${L.text.replace(/"/g, '&quot;')}">
      <span class="acts">${i > 0 && !L.removed ? `<button class="m" type="button" aria-label="Merge label ${i + 1} into the label above" title="Merge into the label above">⤒</button>` : ''}<button class="x" type="button" aria-label="${L.removed ? 'Restore' : 'Remove'} label ${i + 1}" title="${L.removed ? 'Restore' : 'Remove'}">${L.removed ? 'Undo' : '✕'}</button></span>
      <div class="br" aria-hidden="true">${toUnicode(L.text.toLowerCase())}</div>
      <div class="meta">${how} · ${L.leader ? 'leader traced' : 'label on the part'} · ${part}</div>`;
    const input = li.querySelector('input');
    input.addEventListener('change', async () => { L.text = input.value.trim() || L.text; await relayout(); });
    li.querySelector('.x').addEventListener('click', async () => { L.removed = !L.removed; await relayout(); });
    li.querySelector('.m')?.addEventListener('click', async () => {
      // OCR sometimes splits a two-line label ("Pulmonary" / "Artery"): join it to the one above.
      const labels = state.analysis.labels;
      const prev = labels[i - 1];
      prev.text = `${prev.text} ${L.text}`.trim();
      prev.x0 = Math.min(prev.x0, L.x0); prev.y0 = Math.min(prev.y0, L.y0); prev.x1 = Math.max(prev.x1, L.x1); prev.y1 = Math.max(prev.y1, L.y1);
      prev.leader ??= L.leader; prev.mask ??= L.mask;
      labels.splice(i, 1);
      await relayout();
    });
    li.addEventListener('mouseenter', () => { li.classList.add('hl'); if (!$('[data-view="analysis"]').hidden) drawAnalysis(i); });
    li.addEventListener('mouseleave', () => { li.classList.remove('hl'); if (!$('[data-view="analysis"]').hidden) drawAnalysis(); });
    ol.appendChild(li);
  });
}

function drawRules() {
  const tb = $('#rules tbody'); tb.innerHTML = '';
  for (const r of state.check.rules) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.name}</td><td class="${r.pass === true ? 'ok' : r.pass === false ? 'warn' : ''}">${r.ours}</td><td class="base">${r.base}</td>`;
    tb.appendChild(tr);
  }
}

// ---------- tabs & options ----------
$('#tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button[role=tab]'); if (!b) return;
  document.querySelectorAll('#tabs button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  document.querySelectorAll('.view').forEach((v) => { v.hidden = v.dataset.view !== b.dataset.tab; });
  if (b.dataset.tab === 'analysis') drawAnalysis();
});
$('#show-print').addEventListener('change', () => state.layout && ($('#tactile').innerHTML = renderTactile(state.layout, { preview: $('#show-print').checked })));
for (const id of ['#opt-page', '#opt-textures', '#opt-keys']) $(id).addEventListener('change', () => state.analysis && !state.busy && relayout());
$('#opt-title').addEventListener('change', () => state.analysis && !state.busy && relayout());

// ---------- export ----------
function download(name, text, type = 'image/svg+xml') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$('#dl-svg').onclick = () => download(`${state.name}-tactile.svg`, renderTactile(state.layout));
$('#dl-key').onclick = () => download(`${state.name}-key.svg`, renderKeyPage(state.layout, { preview: true }));
$('#print').onclick = () => {
  const L = state.layout;
  const w = window.open('', '_blank');
  if (!w) return setStatus('Allow pop-ups to print.', true);
  const pages = [renderTactile(L)];
  if (L.keyEntries.length) pages.push(renderKeyPage(L, { preview: true }));
  w.document.write(`<!doctype html><title>${state.name} — tactile</title><style>@page{size:${L.pageW}mm ${L.pageH}mm;margin:0}body{margin:0}svg{display:block;width:${L.pageW}mm;height:${L.pageH}mm;page-break-after:always}</style>${pages.join('')}<script>onload=()=>print()<\/script>`);
  w.document.close();
};

// Deep link: ?sample=heart runs a sample straight away (used for demos).
const deep = new URLSearchParams(location.search).get('sample');
if (deep && byId[deep]) {
  const btn = [...grid.querySelectorAll('.sample')][DEMO_ORDER.filter((d) => byId[d]).indexOf(deep)];
  if (btn) btn.click();
  else runFromURL(`samples/${byId[deep].file}`, byId[deep].title, deep);
}
window.__touchsight = state; // read by scripts/eval.mjs
