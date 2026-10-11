// Dev: render app/dev/la.html for some samples and screenshot it.
import { chromium } from 'playwright';
const ids = process.argv[2] || 'heart', o = process.argv[3] || '{}', tag = process.argv[4] || '';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 2500, height: 600 } });
p.on('console', (m) => console.log('[c]', m.text().slice(0, 200)));
p.on('pageerror', (e) => console.log('[err]', e.message));
await p.goto(`http://localhost:5173/dev/la.html?ids=${ids}&o=${encodeURIComponent(o)}`);
await p.waitForFunction(() => document.title === 'done', null, { timeout: 120000 });
await p.screenshot({ path: `eval-out/la-${ids.split(',')[0]}${tag}.png`, fullPage: true });
await b.close();
