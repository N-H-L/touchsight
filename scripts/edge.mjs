// Edge-case QA against a deployment: empty state, corrupt upload, unlabeled image,
// option changes, downloads, phone layout. BASE=... node scripts/edge.mjs
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const base = process.env.BASE || 'http://localhost:5173';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
const status = () => p.textContent('#status');
const waitDone = () => p.waitForFunction(() => /Done in|went wrong|Could not|Please choose|over 15 MB/.test(document.querySelector('#status')?.textContent || ''), null, { timeout: 300000 });
await p.goto(base + '/');
await p.waitForTimeout(1500);
await p.screenshot({ path: 'eval-out/edge-empty.png' });
console.log('1 empty state visible:', await p.isVisible('#empty'));
// 2) corrupt file with an image MIME type
writeFileSync('eval-out/corrupt.png', 'this is not an image');
await p.setInputFiles('#file', 'eval-out/corrupt.png');
await waitDone(); console.log('2 corrupt:', await status());
// 3) wrong type
writeFileSync('eval-out/notes.txt', 'hello');
await p.setInputFiles('#file', { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') });
await p.waitForTimeout(300); console.log('3 wrong type:', await status());
// 4) an unlabeled picture (a gradient blob, no text)
const g = await b.newPage({ viewport: { width: 800, height: 600 } });
await g.setContent('<body style="margin:0;background:#fff"><div style="margin:100px auto;width:500px;height:380px;border-radius:50%;background:radial-gradient(#f88,#a22)"></div></body>');
await g.screenshot({ path: 'eval-out/blob.png' }); await g.close();
await p.setInputFiles('#file', 'eval-out/blob.png');
await waitDone(); console.log('4 unlabeled:', await status());
await p.screenshot({ path: 'eval-out/edge-blob.png' });
// 5) heart via the empty-state button path is covered by ?sample; run the sample button
await p.click('.sample >> nth=0');
await waitDone(); console.log('5 heart:', await status());
// 6) options
for (const [sel, val] of [['#opt-style', 'simple'], ['#opt-page', 'tabloid'], ['#opt-page', 'braille'], ['#opt-style', 'detailed'], ['#opt-page', 'letter']]) {
  await p.selectOption(sel, val); await p.waitForTimeout(1500);
}
await p.check('#opt-textures'); await p.waitForTimeout(1500); await p.uncheck('#opt-textures'); await p.waitForTimeout(1500);
await p.check('#opt-keys'); await p.waitForTimeout(1500); await p.uncheck('#opt-keys'); await p.waitForTimeout(1500);
await p.fill('#opt-title', 'Heart test'); await p.dispatchEvent('#opt-title', 'change'); await p.waitForTimeout(1500);
console.log('6 options ok, svg present:', await p.$$eval('#tactile svg', (x) => x.length));
// 7) downloads
for (const id of ['#dl-svg', '#dl-key']) {
  const [d] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }).catch(() => null), p.click(id)]);
  console.log('7 download', id, d ? d.suggestedFilename() : 'NONE');
}
await p.click('#tabs button[data-tab="relief"]'); await p.waitForTimeout(4000);
const [stl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }).catch(() => null), p.click('#dl-stl')]);
console.log('7 download stl', stl ? stl.suggestedFilename() : 'NONE');
// 8) label edit + remove
await p.click('#tabs button[data-tab="tactile"]');
const n0 = await p.$$eval('#labels li', (x) => x.length);
await p.locator('#labels li').nth(0).locator('button[title*="emove"], button.rm, button:has-text("✕")').first().click().catch((e) => console.log('rm fail', e.message));
await p.waitForTimeout(1500);
console.log('8 labels before/after remove:', n0, await p.$$eval('#labels li', (x) => x.length));
// 9) phone
const m = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
m.on('pageerror', (e) => errs.push('mobile: ' + e.message));
await m.goto(base + '/?sample=heart');
await m.waitForFunction(() => /Done in|went wrong/.test(document.querySelector('#status')?.textContent || ''), null, { timeout: 300000 });
console.log('9 mobile:', await m.textContent('#status'));
console.log('9 horizontal overflow px:', await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));
await m.screenshot({ path: 'eval-out/edge-mobile.png' });
await m.screenshot({ path: 'eval-out/edge-mobile-full.png', fullPage: true });
console.log('page errors:', JSON.stringify(errs));
await b.close();
