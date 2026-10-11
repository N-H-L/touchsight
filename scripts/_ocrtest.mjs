import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage();
p.on('pageerror', (e) => console.log('ERR', e.message));
for (const id of process.argv.slice(2)) {
  await p.goto(`http://localhost:5173/dev/ocrtest.html?s=${id}`);
  await p.waitForFunction(() => window.__done, null, { timeout: 200000 });
  const r = await p.evaluate(() => window.__done);
  for (const [k, v] of Object.entries(r)) console.log(id, k, v.ms + 'ms', v.words.length, v.words.join(' ').slice(0, 160));
}
await b.close();
