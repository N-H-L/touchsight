// Label-recall benchmark in headless Chromium: Tesseract (pipeline.js OCR stage) vs PaddleOCR.
//   node scripts/serve.mjs &   then   node scripts/ocrbench.mjs [samples] [engines] [--proxy]
// e.g. node scripts/ocrbench.mjs heart,volcano paddle,paddle-raw
import { chromium } from 'playwright';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const [s = '', e = 'tesseract,paddle'] = args;
const base = process.env.BASE || 'http://localhost:5173';
const b = await chromium.launch();
const p = await b.newPage();
p.on('pageerror', (err) => console.log('[pageerror]', err.message));
p.on('console', (m) => { if (m.type() === 'error') console.log('[console]', m.text().slice(0, 300)); });
const qs = new URLSearchParams({ e, ...(s ? { s } : {}) });
if (process.argv.includes('--proxy')) qs.set('proxy', '1');
await p.goto(`${base}/dev/ocrbench.html?${qs}`);
await p.waitForFunction(() => window.__bench?.done, null, { timeout: 1200000, polling: 1000 });
const r = await p.evaluate(() => window.__bench);
await b.close();
if (r.error) console.log('ERROR', r.error);
console.log('load ms', JSON.stringify(r.load));
const tot = {};
console.log('| sample | engine | recall | precision | ms | missed |\n|---|---|---|---|---|---|');
for (const x of r.results) {
  const t = (tot[x.engine] ??= { hits: 0, total: 0, good: 0, lines: 0, ms: 0, n: 0 });
  t.hits += x.hits; t.total += x.total; t.good += x.good; t.lines += x.lines; t.ms += x.ms; t.n++;
  console.log(`| ${x.id} | ${x.engine} | ${x.hits}/${x.total} | ${x.good}/${x.lines} | ${x.ms} | ${x.missed.join(', ')} |`);
}
for (const [k, t] of Object.entries(tot)) {
  console.log(`| **total** | ${k} | **${t.hits}/${t.total} (${Math.round((100 * t.hits) / t.total)}%)** | ${t.good}/${t.lines} | ${Math.round(t.ms / t.n)} avg | |`);
}
if (process.argv.includes('--texts')) for (const x of r.results) console.log(x.id, x.engine, JSON.stringify(x.texts));
