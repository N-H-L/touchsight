# Architecture

## Everything on-device

TouchSight-NG is a browser-only application. There is no backend: the site is static files, and all compute (OCR, leader-line tracing, segmentation, layout, checking, rendering, 3D) happens in the user's browser via WebAssembly. This is a deliberate requirement:

- **Free for schools**: no API bills, no subscriptions.
- **Private**: school materials never leave the computer.
- **Easy to try**: no accounts; open the URL and go.

Models are small enough for laptop CPUs: PaddleOCR detector + recognizer (~18 MB), SlimSAM (~40 MB), Tesseract eng. They are vendored into the deployed site by `npm run vendor`, so there are no runtime CDN dependencies (with a pinned, data-free OpenCV.js fallback for dev setups).

## Source layout

```
src/                the application (served as-is; generated vendor/ and model dirs are not committed)
  index.html        the single-page app shell
  css/app.css       styling
  js/               ES modules (see below)
  samples/          16 Wikimedia Commons sample diagrams, samples.json, labels_truth.json
  precomputed/      fallback tactile SVGs computed earlier with the same pipeline
  fonts/            Atkinson Hyperlegible (OFL), self-hosted
scripts/            Node.js tooling: vendor, dev server, Playwright evaluation
docs/               this documentation (MkDocs); published to GitHub Pages
```

## Module map

| Module | Responsibility |
|---|---|
| `src/js/ui.js` | The app: state, views, tabs, review rail, exports, deep links (`?sample=...`) |
| `src/js/pipeline.js` | The analysis stage: orchestrates the steps below |
| `src/js/paddle.js` | PaddleOCR detector + recognizer on ONNX Runtime Web (WASM) |
| `src/js/ocr.js` | Words to lines to labels; multi-line labels merged unless each line owns a leader |
| `src/js/leaders.js` | Leader-line detection and chaining (broken or dotted leaders) |
| `src/js/segment.js` | SlimSAM point prompts and mask selection |
| `src/js/libs.js` | Lazy loaders for OpenCV.js, Tesseract.js, transformers.js + ONNX Runtime |
| `src/js/lineart.js` | Colour-region outline tracer (Simplified style) |
| `src/js/tracing-config.js` | Shared tracing sensitivity configuration |
| `src/js/tactile.js` | Millimetre layout, textures, braille placement |
| `src/js/braille.js` | UEB Grade 1 encoder and two-letter keys |
| `src/js/render.js` | SVG rendering (tactile page, key page, textures) |
| `src/js/check.js` | Automated guideline checker + Canny edge-tracing baseline |
| `src/js/vocab.js` | Science vocabulary used to repair OCR slips |
| `src/js/relief.js` | 3D relief view (three.js) and STL export |

## Key design decisions

- **WASM everywhere.** The SlimSAM embed runs on the CPU instead of WebGPU: it costs a few seconds and works on every student and judge machine, not just modern GPUs. ONNX inference runs in a worker so the page stays responsive.
- **Labels drive everything.** A diagram's own labels, not generic saliency, decide which parts are segmented and which edges are bold. That is what keeps text out of the tracing.
- **Millimetres, not pixels.** The layout stage works in physical units against BANA spacing rules, so the printed page behaves like the preview.
- **Checkable output.** The same checker measures both the tool's output and the naive baseline, so every change is scored.
