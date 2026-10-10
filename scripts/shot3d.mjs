// Screenshot the 3D relief tab and time an STL build.
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://localhost:5173';
const id = process.argv[2] || 'heart';
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
p.on('pageerror', (e) => console.log('[pageerror]', e.message));
p.on('console', (m) => { if (m.type() === 'error' && !/Estimating/.test(m.text())) console.log('[console]', m.text().slice(0, 200)); });
await p.goto(`${base}/?sample=${id}`);
await p.waitForFunction(() => /Done in/.test(document.querySelector('#status')?.textContent || ''), null, { timeout: 240000 });
await p.click('#tabs button[data-tab="relief"]');
await p.waitForTimeout(6000);
await p.screenshot({ path: `eval-out/qa-${id}-relief.png` });
const t0 = Date.now();
const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 120000 }), p.click('#dl-stl')]);
await dl.saveAs(`eval-out/${id}.stl`);
console.log('stl saved in', (Date.now() - t0) / 1000, 's');
await b.close();
