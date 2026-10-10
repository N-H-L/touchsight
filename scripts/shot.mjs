// Screenshot the real app after running a sample: node scripts/shot.mjs heart [tab]
import { chromium } from 'playwright';
const [id = 'heart', tab = 'tactile'] = process.argv.slice(2);
const base = process.env.BASE || 'http://localhost:5173';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
p.on('pageerror', (e) => console.log('[pageerror]', e.message));
p.on('console', (m) => { if (m.type() === 'error' && !/Estimating/.test(m.text())) console.log('[console]', m.text().slice(0, 300)); });
await p.goto(`${base}/?sample=${id}`);
await p.waitForTimeout(2500);
await p.screenshot({ path: `eval-out/shot-${id}-loading.png` });
await p.waitForFunction(() => /Done in|went wrong|Could not/.test(document.querySelector('#status')?.textContent || ''), null, { timeout: 300000 });
console.log(await p.textContent('#status'));
if (tab !== 'tactile') await p.click(`#tabs button[data-tab="${tab}"]`);
await p.waitForTimeout(500);
await p.screenshot({ path: `eval-out/shot-${id}-${tab}.png` });
console.log(await p.evaluate(() => [...document.querySelectorAll('#rules tbody tr')].map((r) => r.innerText.replace(/\t/g, ' | ')).join('\n')));
await b.close();
