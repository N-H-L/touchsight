# TouchSight: notes for judges

- **Live demo:** https://n-h-l.github.io/touchsight/ (desktop Chrome or Edge; the first run downloads ~90 MB of models, then 10–50 s per diagram; nothing is uploaded)
- **Source:** https://github.com/N-H-L/touchsight (this zip is a snapshot of it)
- **Quick try:** open the live demo, click **Human heart**, then look at the tabs *Tactile graphic*, *What the AI saw*, *vs. edge tracing*, *Key page* and *3D relief*. Or upload your own labeled diagram (PNG/JPG).
- **Where things are:** `README.md` (overview, results, credits, AI disclosure); `docs/hackathon/EVIDENCE.md` (every measurement, how it was run, limits); `app/js/` (the app; `pipeline.js` is the analysis, `tactile.js` the layout).
- **Run locally:** `npm ci`, `npm run vendor` (downloads OpenCV.js, ONNX Runtime, PaddleOCR and SlimSAM weights), `npm run serve`, then open http://localhost:5173. `npm run eval` reruns the 16-diagram evaluation (needs `npx playwright install chromium`).
- **AI disclosure:** built with extensive help from Claude Code (Anthropic). The product itself uses only open models running locally in the browser.
