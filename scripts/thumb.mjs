// Devpost thumbnail (3:2): original heart next to its TouchSight tactile page.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const png = readFileSync('app/samples/heart.png').toString('base64');
const svg = readFileSync('app/precomputed/heart.svg', 'utf8').replace(/width="[\d.]+mm" height="[\d.]+mm"/, 'height="100%"');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
await p.setContent(`<body style="margin:0;width:1500px;height:1000px;background:#f6f3ea;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center">
<div style="margin-top:34px;font-size:64px;font-weight:800;color:#111">TouchSight</div>
<div style="font-size:30px;color:#444;margin:4px 0 22px">Textbook diagram in, tactile graphic out, with braille</div>
<div style="display:flex;gap:28px;align-items:center;height:760px">
 <div style="background:#fff;border-radius:18px;padding:18px;height:680px;box-shadow:0 8px 30px rgba(0,0,0,.12)"><img src="data:image/png;base64,${png}" style="height:100%"></div>
 <div style="font-size:70px;color:#c79a00">→</div>
 <div style="background:#fff;border-radius:18px;padding:10px;height:700px;box-shadow:0 8px 30px rgba(0,0,0,.12)">${svg}</div>
</div></body>`);
await p.screenshot({ path: 'docs/hackathon/thumbnail.png' });
await b.close();
