# Getting started

## Run it locally

TouchSight-NG is a static browser application with on-device models. The application is **not hosted on GitHub Pages**; GitHub Pages hosts this project's documentation only. Run the application locally:

Requirements: Node.js 24 or newer.

```bash
npm ci
npm run vendor   # fetches browser libraries and model assets into src/
npm run serve    # http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173). The first vendor setup downloads the required model and library assets; the browser caches model assets after they are loaded.

The documentation site is hosted at [https://mrhunsaker.github.io/touchsight-NG/](https://mrhunsaker.github.io/touchsight-NG/). That site does not contain a hosted copy of the application.

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

The app shows five tabs: **Tactile graphic**, **What the AI saw**, **vs. edge tracing**, **Key page**, and **3D relief**. The right rail lists every detected label with its braille, its placement status, and the automated guideline check. See [The transcriber review workflow](review-workflow.md).

## Exports

- **Download tactile SVG**: pure black, ready for photocopying onto swell paper.
- **Key page**: the braille key legend when keys are in use.
- **Print / PDF**: prints at true page size (Letter, Tabloid, or braille page).
- From the 3D relief tab: **STL** for 3D printing the plate.

## Privacy

Image analysis runs in your browser. OCR, segmentation, layout and checks do not send source diagrams to an application backend. The only third-party load is a version-pinned OpenCV.js script for development setups where the vendored copy has not been generated; image data is never sent to it.
