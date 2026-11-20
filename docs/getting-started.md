# Getting started

## Run it locally

TouchSight-NG is a static site with on-device models; there is nothing to install beyond Node.js (24 or newer).

```bash
npm ci
npm run vendor   # fetches OpenCV.js, Tesseract.js, transformers.js, ONNX Runtime Web, three.js, SlimSAM and PaddleOCR weights into src/
npm run serve    # http://localhost:5173
```

The first run downloads roughly 90 MB of models; the browser caches them afterwards. Measured on a desktop CPU (i9-14900KF, Chromium, WebAssembly): 10-30 s per diagram once the models are cached.

The hosted copy lives at [`https://mrhunsaker.github.io/touchsight-NG/app/`](https://mrhunsaker.github.io/touchsight-NG/app/). This documentation site itself is at [`https://mrhunsaker.github.io/touchsight-NG/`](https://mrhunsaker.github.io/touchsight-NG/).

## Input

- Upload a PNG, JPG or WebP diagram, or drop it onto the drop zone.
- Or pick one of the built-in samples (heart diagram, volcano, plant cell, and more).
- The pipeline is tuned for **labeled diagrams with leader lines**: biology, earth science, simple physics.

## Output options (left rail)

| Option | Choices | Notes |
|---|---|---|
| Paper | Letter 8.5x11, Tabloid 11x17, Braille 11.5x11 | Page size in millimetres; layout adapts. |
| Outline style | Detailed, Simplified | Detailed keeps the original's look; Simplified enforces 3 mm spacing more strictly. |
| Tracing sensitivity | 0-100 | Higher recovers lighter contours; tactile spacing is still enforced. |
| Title | free text | Rendered in braille at the top of the page. |
| Textures | on/off | Up to 5 distinct textures fill labeled parts. |
| Letter keys | on/off | Force two-letter keys with a key page instead of full braille. |

## Reviewing the result

The app shows five tabs: **Tactile graphic**, **What the AI saw**, **vs. edge tracing**, **Key page**, and **3D relief**. The right rail lists every detected label with its braille, its placement status, and the automated guideline check. See [The teacher review workflow](review-workflow.md).

## Exports

- **Download tactile SVG**: pure black, ready for photocopying onto swell paper.
- **Key page**: the braille key legend when keys are in use.
- **Print / PDF**: prints at true page size (Letter, Tabloid, or braille page).
- From the 3D relief tab: **STL** for 3D printing the plate.

## Privacy

Everything runs in your browser. OCR (PaddleOCR, Tesseract fallback), segmentation (SlimSAM), layout and checks never contact a server. School materials never leave the computer. The only third-party load is a version-pinned OpenCV.js script for development setups where the vendored copy has not been generated; image data is never sent to it.
