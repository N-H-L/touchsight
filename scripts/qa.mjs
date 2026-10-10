// Interaction QA: merge a split label, remove one, switch tabs, screenshot each view.
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://localhost:5173';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
p.on('pageerror', (e) => console.log('[pageerror]', e.message));
await p.goto(`${base}/?sample=heart`);
await p.waitForFunction(() => /Done in/.test(document.querySelector('#status')?.textContent || ''), null, { timeout: 240000 });
const texts = () => p.$$eval('#labels input', (xs) => xs.map((x) => x.value));
console.log('before', await texts());
const idx = (await texts()).findIndex((t) => /^Artery$/i.test(t));
if (idx > 0) { await p.locator('#labels li').nth(idx).locator('.m').click(); await p.waitForTimeout(1500); }
console.log('after merge', await texts());
for (const tab of ['analysis', 'compare', 'key']) {
  await p.click(`#tabs button[data-tab="${tab}"]`); await p.waitForTimeout(600);
  await p.locator('.result').screenshot({ path: `eval-out/qa-${tab}.png` });
}
await b.close();
