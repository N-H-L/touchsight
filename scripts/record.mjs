// Records the captioned demo video of the live site (a real, unedited screen capture;
// captions and title cards are overlaid on the page). Models are warmed up first in
// the same browser profile so the recorded runs show normal (cached) speed.
//   BASE=https://n-h-l.github.io/touchsight node scripts/record.mjs
import { chromium } from 'playwright';
import { mkdirSync, rmSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.BASE || 'https://n-h-l.github.io/touchsight';
const size = { width: 1600, height: 900 };
const profile = join(process.cwd(), 'eval-out', 'rec-profile');
const outDir = join(process.cwd(), 'eval-out', 'video');
const done = (p) => p.waitForFunction(() => /Done in|went wrong/.test(document.querySelector('#status')?.textContent || ''), null, { timeout: 300000 });

// 1) Warm-up (not recorded): download and cache every model.
{
  const ctx = await chromium.launchPersistentContext(profile, { viewport: size });
  const p = await ctx.newPage();
  await p.goto(`${base}/?sample=heart`); await done(p);
  await p.goto(`${base}/?sample=volcano`); await done(p);
  await ctx.close();
}

// 2) The recording.
rmSync(outDir, { recursive: true, force: true }); mkdirSync(outDir, { recursive: true });
const ctx = await chromium.launchPersistentContext(profile, { viewport: size, recordVideo: { dir: outDir, size } });
const tv0 = Date.now(); // ~ video time zero
const p = ctx.pages()[0] ?? await ctx.newPage();
// Long waits (model inference, layout) are cut in post: keep the first `keep` s and last 1 s.
const cuts = [];
const slow = async (fn, keep = 3) => { const a = (Date.now() - tv0) / 1000; await fn(); const b = (Date.now() - tv0) / 1000; if (b - a > keep + 2) cuts.push([+(a + keep).toFixed(2), +(b - 1).toFixed(2)]); };
const settle = () => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))));
await p.addInitScript(() => {
  const css = `#cap{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);max-width:1080px;background:rgba(17,17,17,.88);color:#fff;font:600 21px/1.35 'Atkinson Hyperlegible',system-ui,sans-serif;padding:12px 20px;border-radius:14px;z-index:99999;text-align:center;box-shadow:0 6px 24px rgba(0,0,0,.25);transition:opacity .25s}
  #cap:empty{opacity:0}
  #card{position:fixed;inset:0;background:#f6f3ea;z-index:99998;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px;font-family:'Atkinson Hyperlegible',system-ui,sans-serif;color:#111;transition:opacity .4s}
  #card h1{font-size:64px;margin:0 0 10px} #card h2{font-size:30px;font-weight:600;margin:0 0 26px;color:#333} #card p{font-size:26px;line-height:1.45;max-width:980px;margin:8px 0} #card .s{font-size:20px;color:#555;margin-top:26px} #card b{background:#f6d77a;padding:0 6px;border-radius:6px}`;
  window.__cap = (t) => { let c = document.getElementById('cap'); if (!c) { const st = document.createElement('style'); st.textContent = css; document.head.append(st); c = document.createElement('div'); c.id = 'cap'; document.body.append(c); } c.innerHTML = t || ''; };
  window.__card = (html) => { window.__cap(''); let c = document.getElementById('card'); if (!html) { c?.remove(); return; } if (!c) { c = document.createElement('div'); c.id = 'card'; document.body.append(c); } c.innerHTML = html; };
});
const cap = (t) => p.evaluate((t) => window.__cap(t), t);
const card = (h) => p.evaluate((h) => window.__card(h), h);
const wait = (s) => p.waitForTimeout(s * 1000);
const tab = (t) => p.click(`#tabs button[data-tab="${t}"]`);
const mode = (m) => p.click(`#viewmode button[data-mode="${m}"]`);
const t0 = Date.now(); const mark = (s) => console.log(((Date.now() - t0) / 1000).toFixed(1).padStart(6), s);

await p.goto(base + '/');
await p.waitForTimeout(800);
mark('title');
await card('<h1>TouchSight</h1><h2>Textbook diagram in, tactile graphic out</h2><p class="s">Banana Hacks 2026 · solo entry · runs entirely in your browser</p>');
await wait(5);
mark('problem');
await card('<p>Blind students learn science from the same diagrams as everyone else.</p><p>But first a teacher has to <b>redraw each one by hand</b> as a raised-line <i>tactile graphic</i>: print swapped for braille, lines spaced for fingers.</p><p>One science assignment with graphics can take <b>up to 10 hours</b> to transcribe.</p><p class="s">Sources: Jordan School District (2024); British Journal of Visual Impairment survey (2023)</p>');
await wait(10);
await card('');
mark('empty');
await cap('TouchSight does the first draft in seconds. Nothing is uploaded: every model runs on this device.');
await wait(4.5);
mark('run heart');
await cap('Pick a labeled diagram. PaddleOCR reads the labels, leader lines are traced to their tips, and Segment Anything segments each named part. <span style="opacity:.7">(~25 s of processing shortened in this video)</span>');
await slow(async () => { await p.click('.sample[data-id="heart"]'); await done(p); }, 6);
await wait(0.8);
mark('original');
await mode('original');
await cap('The original: colour, shading and print text that fingers cannot read.');
await wait(4.5);
mark('tactile');
await mode('tactile');
await cap('The tactile page: print removed, every label in braille, leaders redrawn, 3 mm clearance around the braille.');
await wait(6);
mark('hover labels');
await cap('Bold lines are the edges of the parts the labels name, found by Segment Anything from each leader tip. Fine lines keep the original detail.');
for (const i of [0, 2, 6, 9]) { await p.locator('#labels li').nth(i).hover(); await wait(1.6); }
mark('overlay');
await mode('overlay');
await cap('Overlay: the raised lines and braille sit exactly on the original drawing.');
await wait(5);
await mode('tactile');
mark('analysis');
await tab('analysis');
await cap('What the AI saw: each label, the leader it owns, and the part it segmented.');
for (const i of [1, 3, 6, 10, 12]) { await p.locator('#labels li').nth(i).hover(); await wait(1.5); }
await tab('tactile');
mark('fix label');
const li = p.locator('#labels li').nth(4);
await li.scrollIntoViewIfNeeded();
await cap('OCR slips are repaired automatically ("Leff Atrium" → "Left Atrium"), and the teacher can edit any label: the braille updates instantly.');
await li.hover(); await wait(3);
const inp = p.locator('#labels li').nth(1).locator('input');
await inp.scrollIntoViewIfNeeded();
await inp.click(); await p.keyboard.press('End'); await p.keyboard.type(' (main artery)', { delay: 70 });
await slow(async () => { await p.keyboard.press('Tab'); await wait(0.3); await settle(); }, 1);
await wait(3.5);
mark('compare');
await slow(async () => { await tab('compare'); await settle(); }, 1);
await cap('Plain edge tracing turns every printed word into raised squiggles, and has no braille.');
await wait(5.5);
mark('rules');
await p.locator('#rules').scrollIntoViewIfNeeded();
await cap('Every result is checked against BANA tactile-graphics guidelines, side by side with edge tracing.');
await wait(5.5);
mark('key');
await tab('key');
await cap('Long labels get two-letter braille keys, listed on a key page.');
await wait(4);
mark('relief');
await cap('How it will feel: a 3D relief under raking light. Export an SVG for swell paper, or an STL to 3D print.');
await slow(async () => { await tab('relief'); await settle(); await wait(0.5); await settle(); }, 1);
await wait(2.5);
await wait(6.5);
mark('volcano');
await tab('tactile');
await cap('It works across subjects: here, an earth-science diagram. <span style="opacity:.7">(processing shortened)</span>');
await slow(async () => { await p.click('.sample[data-id="volcano"]'); await done(p); }, 3);
await wait(5.5);
mark('built');
await card('<h2>How it was built</h2><p><b>Inspiration:</b> brainstormed Image-AI ideas and picked a real accessibility gap: tactile graphics are slow to make by hand.</p><p><b>Design:</b> rules taken from the BANA <i>Guidelines and Standards for Tactile Graphics</i>; the outline style was reworked after reviewing results to stay faithful to the original.</p><p><b>Resources:</b> PaddleOCR, Segment Anything (SlimSAM), OpenCV.js, three.js, 16 Wikimedia Commons diagrams, and a Playwright test harness that scores every change.</p>');
await wait(10);
mark('end');
await card('<h2>Results</h2><p>On 16 Wikimedia diagrams: <b>98%</b> of hand-counted labels found · <b>232 of 233</b> labels placed in braille · <b>66</b> too-short fragments vs <b>763</b> for edge tracing</p><p>PaddleOCR · Segment Anything (SlimSAM) · OpenCV.js · three.js — all in the browser, free and private for schools</p><p class="s">Not yet tested with blind readers or on swell paper: that is next.<br>Try it: n-h-l.github.io/touchsight · Code: github.com/N-H-L/touchsight<br>Built with help from Claude Code (AI disclosure)</p>');
await wait(8);
mark('stop');
await ctx.close();
const f = readdirSync(outDir).find((x) => x.endsWith('.webm'));
renameSync(join(outDir, f), join(outDir, 'touchsight-demo.webm'));
writeFileSync(join(outDir, 'cuts.json'), JSON.stringify(cuts));
console.log('cuts', JSON.stringify(cuts));
console.log('saved', join(outDir, 'touchsight-demo.webm'));
