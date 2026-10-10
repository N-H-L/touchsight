# TouchSight

**Textbook diagram in, tactile graphic out.** TouchSight turns a labeled science diagram into a swell-paper-ready tactile graphic with braille labels. It runs entirely in the browser: no uploads, no accounts, no server.

Live demo: https://n-h-l.github.io/touchsight/

Built solo for [Banana Hacks 2026](https://banana-hacks-1111.devpost.com/). The full write-up is in progress.

## Run locally
```
npm ci
npm run vendor   # copies OpenCV.js, Tesseract.js, transformers.js and the SlimSAM weights into app/
npm run serve    # http://localhost:5173
```
