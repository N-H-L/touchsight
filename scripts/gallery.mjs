// Devpost gallery images (1500x1000, 3:2) from the live site.
import { chromium } from 'playwright';
const base = process.env.BASE || 'https://n-h-l.github.io/touchsight';
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
const done = () => p.waitForFunction(() => /Done in/.test(document.querySelector('#status')?.textContent || ''), null, { timeout: 300000 });
await p.goto(`${base}/?sample=heart`); await done(); await p.waitForTimeout(800);
await p.screenshot({ path: 'docs/hackathon/gallery/1-tactile-heart.png' });
await p.click('#tabs button[data-tab="analysis"]'); await p.locator('#labels li').nth(1).hover(); await p.waitForTimeout(800);
await p.screenshot({ path: 'docs/hackathon/gallery/2-what-the-ai-saw.png' });
await p.click('#tabs button[data-tab="compare"]'); await p.mouse.move(5, 5); await p.waitForTimeout(800);
await p.screenshot({ path: 'docs/hackathon/gallery/3-vs-edge-tracing.png' });
await p.click('#tabs button[data-tab="relief"]'); await p.waitForTimeout(6000);
await p.screenshot({ path: 'docs/hackathon/gallery/4-3d-relief.png' });
await p.click('#tabs button[data-tab="tactile"]');
await p.goto(`${base}/?sample=volcano`); await done(); await p.waitForTimeout(1200);
await p.screenshot({ path: 'docs/hackathon/gallery/5-tactile-volcano.png' });
await b.close();
