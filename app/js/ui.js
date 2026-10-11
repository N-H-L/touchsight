import { loadOpenCV } from './libs.js';
import { analyze } from './pipeline.js';
import { buildLayout } from './tactile.js';
import { renderTactile, renderKeyPage, TEXTURES } from './render.js';
import { checkAll } from './check.js';
import { toUnicode } from './braille.js';

let reliefMod = null, relief = null, reliefFor = null;
async function showRelief() {
  try {
    reliefMod ??= await import('./relief.js');
    relief ??= new reliefMod.ReliefView($('#relief'));
    if (reliefFor !== state.layout) { await relief.build(state.layout); reliefFor = state.layout; }
    else relief.start();
  } catch (e) {
    console.error(e);
    $('#relief').innerHTML = `<p style="color:#eee;padding:24px">3D preview needs WebGL, which this browser could not start (${e.message}).</p>`;
  }
}

const $ = (s) => document.querySelector(s);
const state = { imageData: null, original: null, analysis: null, layout: null, check: null, name: 'diagram', busy: false, mode: 'tactile' };
const MAX_SIDE = 1400; // keep in-browser inference fast
const PAL = ['#e6194b', '#3cb44b', '#0082c8', '#f58230', '#911eb4', '#2fa8a8', '#f032e6', '#7f9d1f', '#008080', '#aa6e28', '#5a5aff', '#c0392b'];

// ---------- samples ----------
const DEMO_ORDER = ['heart', 'volcano', 'animal-cell', 'mitochondrion', 'tooth', 'ear', 'earth-layers', 'flower', 'eye'];
const samples = await fetch('samples/samples.json').then((r) => r.json()).catch(() => []);
const byId = Object.fromEntries(samples.map((s) => [s.id, s]));
const grid = $('#samples');
const shortTitle = (t) => t.replace(/^(Diagram of the |Schematic diagram of the )/i, '').replace(/^./, (c) => c.toUpperCase());
for (const id of DEMO_ORDER) {
  const s = byId[id]; if (!s) continue;
  const b = document.createElement('button');
  b.className = 'sample'; b.type = 'button'; b.dataset.id = id;
  b.setAttribute('role', 'listitem'); b.setAttribute('aria-pressed', 'false');
  b.innerHTML = `<img src="samples/${s.file}" alt="" loading="lazy"><span>${shortTitle(s.title)}</span>`;
  b.title = `${s.title} — ${s.author}, ${s.license}`;
  b.onclick = () => runSample(id);
  grid.appendChild(b);
}
function runSample(id) {
  const s = byId[id]; if (!s || state.busy) return;
  grid.querySelectorAll('.sample').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.id === id)));
  runFromURL(`samples/${s.file}`, shortTitle(s.title), id);
}
$('#try-heart').onclick = () => runSample('heart');

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
  grid.querySelectorAll('.sample').forEach((x) => x.setAttribute('aria-pressed', 'false'));
  runFromURL(URL.createObjectURL(f), '', f.name.replace(/\.[^.]+$/, ''));
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
    state.original = c.toDataURL('image/jpeg', 0.85);
    state.name = name || 'diagram';
    $('#opt-title').value = title || '';
    await run();
  } catch (e) {
    console.error(e);
    setStatus('Could not read that image. ' + (e.message || ''), true);
  }
}

// ---------- loading overlay ----------
const STEPS = ['engines', 'ocr', 'leaders', 'segment', 'layout', 'check'];
let timer = null;
function showLoading(on) {
  $('#loading').hidden = !on;
  clearInterval(timer);
  if (on) {
    const t0 = performance.now();
    $('#elapsed').textContent = '0 s';
    timer = setInterval(() => { $('#elapsed').textContent = `${Math.round((performance.now() - t0) / 1000)} s`; }, 500);
    setStep('engines', 'Loading on-device models…');
  }
}
function setStep(k, msg) {
  const i = STEPS.indexOf(k);
  document.querySelectorAll('#steps li').forEach((el) => {
    const j = STEPS.indexOf(el.dataset.step);
    el.classList.toggle('done', j < i);
    el.classList.toggle('active', j === i);
  });
  if (msg) $('#loadmsg').textContent = msg;
}
function setStatus(msg, err = false) { const s = $('#status'); s.textContent = msg; s.classList.toggle('error', err); }
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

// ---------- pipeline ----------
async function run() {
  state.busy = true;
  document.body.setAttribute('aria-busy', 'true');
  $('#empty').hidden = true;
  showLoading(true);
  setStatus('Working… everything runs on this device.');
  const t0 = performance.now();
  try {
    state.analysis = await analyze(state.imageData, {
      onStage: (k, msg) => setStep(k, k === 'engines' ? 'Loading on-device models… (first run only)' : msg),
    });
    await relayout(true);
    const secs = ((performance.now() - t0) / 1000).toFixed(1);
    const st = state.layout.stats;
    const fixes = state.analysis.labels.reduce((n, L) => n + (L.corrections?.length || 0), 0);
    setStatus(`Done in ${secs} s on this device · ${state.analysis.labels.length} labels found · ${st.parts} parts segmented · ${st.fullLabels} full braille labels + ${st.keyLabels} keyed${fixes ? ` · ${fixes} OCR slip${fixes > 1 ? 's' : ''} auto-corrected` : ''}${state.analysis.labels.length ? '' : ' · no printed labels found, so this is outlines only'}`);
  } catch (e) {
    console.error(e);
    if (byId[state.name] && await showPrecomputed(state.name)) {
      setStatus(`This browser could not run the on-device models (${e.message || e}). Showing a result computed earlier with the same pipeline.`, true);
    } else {
      $('#empty').hidden = !!state.layout;
      setStatus('Something went wrong: ' + (e.message || e) + '. Try another image or reload the page.', true);
    }
  } finally {
    showLoading(false);
    state.busy = false;
    document.body.removeAttribute('aria-busy');
  }
}

async function showPrecomputed(id) {
  try {
    const svg = await fetch(`precomputed/${id}.svg`).then((r) => (r.ok ? r.text() : null));
    if (!svg) return false;
    $('#views').hidden = false;
    $('#tactile').innerHTML = svg;
    return true;
  } catch { return false; }
}

async function relayout(withSteps = false) {
  const cv = await loadOpenCV();
  if (withSteps) { setStep('layout', 'Laying out the tactile page…'); await nextFrame(); }
  state.layout = buildLayout(cv, state.analysis, {
    page: $('#opt-page').value, style: $('#opt-style').value, title: $('#opt-title').value.trim(),
    textures: $('#opt-textures').checked, forceKeys: $('#opt-keys').checked,
  });
  if (withSteps) { setStep('check', 'Running guideline checks…'); await nextFrame(); }
  state.check = checkAll(cv, state.analysis, state.layout, state.imageData);
  draw();
}

// ---------- views ----------
function draw() {
  $('#tabs').hidden = false; $('#views').hidden = false; $('#side').hidden = false; $('#howto').hidden = true;
  $('#viewmode').hidden = currentTab() !== 'tactile';
  drawTactile();
  $('#ours-small').innerHTML = renderTactile(state.layout);
  $('#keypage').innerHTML = state.layout.keyEntries.length
    ? renderKeyPage(state.layout, { preview: true })
    : '<p>Every label fits as full braille, so no key page is needed.</p>';
  drawBaseline();
  drawAnalysis();
  drawLabels();
  drawLegend();
  drawRules();
  if (currentTab() === 'relief') showRelief();
}

function drawTactile(highlight = null) {
  const el = $('#tactile');
  if (state.mode === 'original') {
    el.innerHTML = `<img src="${state.original}" alt="Original diagram">`;
    return;
  }
  const underlay = state.mode === 'overlay' ? { href: state.original, w: state.analysis.W, h: state.analysis.H } : null;
  el.innerHTML = renderTactile(state.layout, { preview: true, highlight, underlay });
  el.querySelector('svg')?.setAttribute('aria-label', `Tactile graphic preview with ${state.layout.labels.length} braille labels`);
}

function drawBaseline() {
  // The same Canny tracing the checker measures, thickened to the same 0.8 mm raised line.
  const cv = window.cv, L = state.layout, img = state.imageData;
  const src = cv.matFromImageData(img), gray = new cv.Mat(), edges = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.GaussianBlur(gray, gray, new cv.Size(3, 3), 0);
  cv.Canny(gray, edges, 60, 160);
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

// Mask outlines (computed once per label) for the "What the AI saw" view.
function maskContours(L, W, H) {
  if (L._contours || !L.mask) return L._contours || [];
  const cv = window.cv;
  const m = new cv.Mat(H, W, cv.CV_8UC1);
  for (let i = 0; i < W * H; i++) m.data[i] = L.mask[i] ? 255 : 0;
  const cs = new cv.MatVector(), hier = new cv.Mat();
  cv.findContours(m, cs, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  L._contours = [];
  for (let i = 0; i < cs.size(); i++) {
    const c = cs.get(i);
    if (cv.contourArea(c) > 40) { const pts = []; for (let j = 0; j < c.rows; j++) pts.push([c.data32S[j * 2], c.data32S[j * 2 + 1]]); L._contours.push(pts); }
    c.delete();
  }
  m.delete(); cs.delete(); hier.delete();
  return L._contours;
}

function drawAnalysis(highlight = -1) {
  const a = state.analysis, c = $('#analysis');
  c.width = a.W; c.height = a.H;
  const ctx = c.getContext('2d');
  ctx.putImageData(state.imageData, 0, 0);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(0, 0, a.W, a.H); // fade the original
  const lw = Math.max(2, a.W / 380);
  a.labels.forEach((L, i) => {
    if (L.removed) return;
    const col = PAL[i % PAL.length], on = highlight === -1 || highlight === i;
    ctx.globalAlpha = on ? 1 : 0.18;
    for (const poly of maskContours(L, a.W, a.H)) {
      ctx.beginPath(); poly.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
      ctx.fillStyle = col + (highlight === i ? '55' : '22'); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = highlight === i ? lw * 2 : lw; ctx.stroke();
    }
    ctx.strokeStyle = col; ctx.lineWidth = lw;
    ctx.setLineDash([lw * 3, lw * 2]);
    ctx.strokeRect(L.x0 - 3, L.y0 - 3, L.x1 - L.x0 + 6, L.y1 - L.y0 + 6);
    ctx.setLineDash([]);
    if (L.leader) { ctx.lineWidth = lw * 1.4; ctx.beginPath(); ctx.moveTo(L.leader.x1, L.leader.y1); ctx.lineTo(L.leader.x2, L.leader.y2); ctx.stroke(); }
    if (L.anchor) badge(ctx, L.anchor[0], L.anchor[1], String(i + 1), col, lw);
    badge(ctx, L.x0 - 3, L.y0 - 3, String(i + 1), col, lw * 0.8);
    ctx.globalAlpha = 1;
  });
}
function badge(ctx, x, y, text, col, lw) {
  const r = lw * 5.5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
  ctx.lineWidth = lw * 0.8; ctx.strokeStyle = '#fff'; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = `700 ${r * 1.1}px "Atkinson Hyperlegible", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + r * 0.05);
}

function drawLabels() {
  const ol = $('#labels'); ol.innerHTML = '';
  const placedByText = new Map(state.layout.labels.map((p, k) => [p.text, { p, k }]));
  state.analysis.labels.forEach((L, i) => {
    const li = document.createElement('li');
    if (L.removed) li.classList.add('removed');
    const hit = placedByText.get(L.text), p = hit?.p;
    const how = L.removed ? 'removed' : !p ? 'could not be placed' : p.usesKey ? `key “${p.key}”` : 'full braille';
    const fix = L.corrections?.length ? ` · <span class="fix">auto-corrected ${L.corrections.join(', ')}</span>` : '';
    li.innerHTML = `<span class="badge" style="background:${PAL[i % PAL.length]}">${i + 1}</span>
      <input type="text" aria-label="Label ${i + 1} text" value="${L.text.replace(/"/g, '&quot;')}">
      <span class="acts">${i > 0 && !L.removed ? `<button class="m" type="button" aria-label="Merge label ${i + 1} into the label above" title="Merge into the label above">⤒</button>` : ''}<button class="x" type="button" aria-label="${L.removed ? 'Restore' : 'Remove'} label ${i + 1}" title="${L.removed ? 'Restore' : 'Remove'}">${L.removed ? 'Undo' : '✕'}</button></span>
      <div class="br" aria-hidden="true">${toUnicode(L.text.toLowerCase())}</div>
      <div class="meta">${how} · ${L.leader ? 'leader traced' : 'label sits on the part'} · ${L.mask ? 'part segmented' : 'no part found'}${fix}</div>`;
    const input = li.querySelector('input');
    input.addEventListener('change', async () => { L.text = input.value.trim() || L.text; L.corrections = []; await relayout(); });
    li.querySelector('.x').addEventListener('click', async () => { L.removed = !L.removed; await relayout(); });
    li.querySelector('.m')?.addEventListener('click', async () => {
      // OCR sometimes splits a two-line label: join it to the one above.
      const labels = state.analysis.labels, prev = labels[i - 1];
      prev.text = `${prev.text} ${L.text}`.trim();
      prev.x0 = Math.min(prev.x0, L.x0); prev.y0 = Math.min(prev.y0, L.y0); prev.x1 = Math.max(prev.x1, L.x1); prev.y1 = Math.max(prev.y1, L.y1);
      prev.leader ??= L.leader; prev.mask ??= L.mask;
      labels.splice(i, 1);
      await relayout();
    });
    li.addEventListener('mouseenter', () => { li.classList.add('hl'); hover(i, hit?.k); });
    li.addEventListener('mouseleave', () => { li.classList.remove('hl'); hover(-1, null); });
    ol.appendChild(li);
  });
}
function hover(i, k) {
  if (currentTab() === 'analysis') drawAnalysis(i);
  else if (currentTab() === 'tactile' && state.mode !== 'original') drawTactile(k ?? null);
}

function drawLegend() {
  const ul = $('#legend'); ul.innerHTML = '';
  const parts = state.layout.parts.filter((p) => p.texture != null);
  const bold = state.layout.stats.boldEdges;
  $('#legend-card').hidden = !parts.length && !bold;
  if (bold) {
    for (const [w, txt] of [[3, '<b>Bold line</b> · edge of a labeled part (found by Segment Anything from the leader tip)'], [1.4, '<b>Fine line</b> · other detail traced from the original']]) {
      const li = document.createElement('li');
      li.innerHTML = `<svg viewBox="0 0 12 12" aria-hidden="true"><line x1="1" y1="6" x2="11" y2="6" stroke="#000" stroke-width="${w}" stroke-linecap="round"/></svg><span>${txt}</span>`;
      ul.appendChild(li);
    }
  }
  for (const p of parts) {
    const names = state.analysis.labels.filter((L) => !L.removed && L.partId === p.id).map((L) => L.text);
    const li = document.createElement('li');
    li.innerHTML = `<svg viewBox="0 0 12 12" aria-hidden="true"><defs>${TEXTURES[p.texture].svg.replace(`id="tx${p.texture}"`, `id="lg${p.texture}"`)}</defs><rect width="12" height="12" fill="url(#lg${p.texture})"/></svg>
      <span><b>${TEXTURES[p.texture].name}</b> · ${names.join(', ') || p.labelText}</span>`;
    ul.appendChild(li);
  }
}

function drawRules() {
  const tb = $('#rules tbody'); tb.innerHTML = '';
  for (const r of state.check.rules) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.name}</td><td class="${r.pass === true ? 'ok' : r.pass === false ? 'warn' : ''}">${r.ours}</td><td class="base">${r.base}</td>`;
    tb.appendChild(tr);
  }
}

// ---------- tabs, view mode & options ----------
const currentTab = () => $('#tabs button[aria-selected="true"]')?.dataset.tab;
$('#tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button[role=tab]'); if (!b) return;
  document.querySelectorAll('#tabs button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  document.querySelectorAll('.view').forEach((v) => { v.hidden = v.dataset.view !== b.dataset.tab; });
  $('#viewmode').hidden = b.dataset.tab !== 'tactile';
  if (b.dataset.tab === 'analysis') drawAnalysis();
  if (b.dataset.tab === 'relief') showRelief(); else relief?.stop();
});
$('#viewmode').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b || !state.layout) return;
  state.mode = b.dataset.mode;
  $('#viewmode').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  drawTactile();
});
for (const id of ['#opt-page', '#opt-style', '#opt-textures', '#opt-keys', '#opt-title']) $(id).addEventListener('change', () => state.analysis && !state.busy && relayout());

// ---------- export ----------
function download(name, text, type = 'image/svg+xml') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$('#relief-light').onclick = (e) => {
  if (!relief) return;
  relief.sweep = !relief.sweep;
  e.currentTarget.setAttribute('aria-pressed', String(relief.sweep));
  e.currentTarget.textContent = relief.sweep ? 'Pause light' : 'Move light';
};
$('#dl-stl').onclick = async () => {
  const btn = $('#dl-stl'); btn.disabled = true; btn.textContent = 'Building STL…';
  try {
    reliefMod ??= await import('./relief.js');
    const blob = await reliefMod.buildSTL(state.layout);
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${state.name}-tactile.stl`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } finally { btn.disabled = false; btn.textContent = 'Download STL for 3D printing'; }
};
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

// Deep link: ?sample=heart runs a sample straight away (demos and the eval harness).
const deep = new URLSearchParams(location.search).get('sample');
if (deep && byId[deep]) {
  if (DEMO_ORDER.includes(deep)) runSample(deep);
  else runFromURL(`samples/${byId[deep].file}`, byId[deep].title, deep);
}
window.__touchsight = state; // read by scripts/eval.mjs
