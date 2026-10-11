// Devpost thumbnails (3:2, 1500x1000): big logo + wordmark, light and dark versions.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const font = (w) => `data:font/woff2;base64,${readFileSync(`app/fonts/atkinson-${w}.woff2`).toString('base64')}`;
const logo = (tile, dot, size) => `<svg width="${size}" height="${size}" viewBox="0 0 32 32"><defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="0.35" stdDeviation="0.35" flood-opacity=".35"/></filter></defs><rect width="32" height="32" rx="8" fill="${tile}"/><g fill="${dot}" filter="url(#s)"><circle cx="11" cy="9" r="2.6"/><circle cx="11" cy="16" r="2.6"/><circle cx="21" cy="16" r="2.6"/><circle cx="21" cy="23" r="2.6"/></g></svg>`;
const page = ({ bg, fg, sub, tile, dot, grid }) => `<html><head><style>
@font-face{font-family:A;src:url(${font(400)})format('woff2');font-weight:400}
@font-face{font-family:A;src:url(${font(700)})format('woff2');font-weight:700}
body{margin:0;width:1500px;height:1000px;background:${bg};font-family:A,sans-serif;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}
.dots{position:absolute;inset:0;background-image:radial-gradient(${grid} 2.2px,transparent 2.6px);background-size:34px 34px;opacity:.55;-webkit-mask-image:radial-gradient(ellipse at center,transparent 38%,#000 85%);mask-image:radial-gradient(ellipse at center,transparent 38%,#000 85%)}
.wrap{position:relative;display:flex;flex-direction:column;align-items:center}
.logo{filter:drop-shadow(0 24px 48px rgba(0,0,0,.28));margin-bottom:46px}
h1{margin:0;font-size:132px;font-weight:700;letter-spacing:-3px;color:${fg};line-height:1}
p{margin:22px 0 0;font-size:40px;color:${sub};letter-spacing:.2px}
.br{margin-top:30px;font-size:44px;color:#f2c230;letter-spacing:10px}
</style></head><body><div class="dots"></div><div class="wrap"><div class="logo">${logo(tile, dot, 360)}</div><h1>TouchSight</h1><p>Textbook diagram in, tactile graphic out</p><div class="br">⠞⠕⠥⠉⠓⠎⠊⠛⠓⠞</div></div></body></html>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
await p.setContent(page({ bg: '#f3f0e8', fg: '#1b1a17', sub: '#55524a', tile: '#1b1a17', dot: '#f2c230', grid: '#cfc8b6' }));
await p.waitForTimeout(300); await p.screenshot({ path: 'docs/hackathon/thumbnail.png' });
await p.setContent(page({ bg: '#1b1a17', fg: '#f7f4ec', sub: '#b9b3a4', tile: '#f2c230', dot: '#1b1a17', grid: '#3a3832' }));
await p.waitForTimeout(300); await p.screenshot({ path: 'docs/hackathon/thumbnail-dark.png' });
await b.close();
