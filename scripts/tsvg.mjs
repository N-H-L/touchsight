// Dev: run a sample, then save a large render of the tactile page (textures on and off).
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const id = process.argv[2] || 'heart';
const base = process.env.BASE || 'http://localhost:5173';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
p.on('pageerror', (e) => console.log('[pageerror]', e.message));
await p.goto(`${base}/?sample=${id}`);
await p.waitForFunction(() => /Done in|went wrong|Could not/.test(document.querySelector('#status')?.textContent || ''), null, { timeout: 300000 });
const svgs = await p.evaluate(async () => {
  const { renderTactile } = await import('./js/render.js');
  const { buildLayout } = await import('./js/tactile.js');
  const st = window.__touchsight, cv = window.cv;
  const a = renderTactile(st.layout, { braille: true }); // current UI options (detailed by default)
  const lay2 = buildLayout(cv, st.analysis, { style: 'simple' });
  return [a, renderTactile(lay2, { braille: true })];
});
const v = await b.newPage({ viewport: { width: 1700, height: 1100 } });
await v.setContent(`<body style="margin:0;display:flex;gap:10px;background:#ddd">${svgs.map((s) => s.replace(/width="[\d.]+mm" height="[\d.]+mm"/, 'height="1080"')).join('')}</body>`);
await v.screenshot({ path: `eval-out/tsvg-${id}.png` });
await b.close();
