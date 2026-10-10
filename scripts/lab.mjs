// Runs app/dev/lab.html in headless Chromium for each sample and saves overlays + JSON.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const ids = process.argv.slice(2);
const base = process.env.BASE || 'http://localhost:5173';
await mkdir('eval-out/lab', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1400 } });
page.on('console', (m) => { if (m.type() === 'error') console.log('[console]', m.text().slice(0, 300)); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
for (const id of ids) {
  await page.goto(`${base}/dev/lab.html?s=${id}`);
  const t0 = Date.now();
  while (!(await page.evaluate(() => window.__lab?.done))) {
    if (Date.now() - t0 > 300000) throw new Error('timeout; status=' + await page.textContent('#status'));
    await new Promise((r) => setTimeout(r, 5000));

  }
  const r = await page.evaluate(() => window.__lab);
  await writeFile(`eval-out/lab/${id}.json`, JSON.stringify(r, null, 1));
  await page.locator('#c').screenshot({ path: `eval-out/lab/${id}.png` });
  if (r.svg) { await writeFile(`eval-out/lab/${id}.svg`, r.svg); await page.locator('#svg').screenshot({ path: `eval-out/lab/${id}-tactile.png` }); }
  console.log(id, r.error || JSON.stringify(r.timings), r.sam_device, 'labels', r.labels?.length);
  console.log('  stats', JSON.stringify(r.stats));
  for (const L of r.labels ?? []) console.log('  ', L.leader ? 'L' : '-', L.mask ? 'M' : '_', L.score, JSON.stringify(L.text));
  for (const L of r.placed ?? []) console.log('   >', L.key ?? 'FULL', L.knockout ? 'KO' : '', JSON.stringify(L.text));
}
await browser.close();
