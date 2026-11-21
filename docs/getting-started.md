# Getting started

This guide covers a local developer setup. GitHub Pages hosts the documentation only; it does not host the TouchSight-NG application.

## Requirements

- Node.js 24 or newer (npm is included with Node.js).
- A current desktop browser with WebAssembly support. WebGL is needed for the 3D relief preview.
- Internet access for initial dependency and model-asset setup.
- Enough memory for in-browser image processing and neural-network inference.

## Get the source and install dependencies

```bash
git clone https://github.com/mrhunsaker/touchsight-NG.git
cd touchsight-NG
npm ci
```

`npm ci` installs exact dependency versions recorded in `package-lock.json`. It does not by itself download model weights.

## Prepare browser libraries and model files

```bash
npm run vendor
```

The vendor script is intended to prepare local browser assets: OpenCV.js, Tesseract.js and English traineddata, Transformers.js, ONNX Runtime Web, three.js, SlimSAM weights, and PaddleOCR ONNX weights. The model files are downloaded into generated local folders and then served by the local app. See [Models and inference engines](models-and-engines.md) for the file inventory and each component's role.

### Asset path check

The server and vendor script target `src/`, matching the tracked application source. Run the commands above and confirm the browser console reports successful local asset loading.

## Start the local application

```bash
npm run serve
```

Open the local address printed by the server (the current script defaults to `http://localhost:5173`). Keep the terminal running while using the app.

## Process a diagram

1. Choose a built-in sample or upload a PNG, JPG/JPEG, or WebP image.
2. The app normalizes the image and loads its on-device engines.
3. OCR finds printed labels. PaddleOCR is primary; Tesseract is the fallback.
4. Leader-line detection attempts to associate labels with parts.
5. SlimSAM segments parts using point prompts derived from those associations.
6. The app creates a tactile layout and runs geometric checks.
7. Review and correct labels and diagram structure before exporting.

Input files larger than 15 MB are rejected by the current UI. The app scales the longest side to at most 1,400 pixels for analysis.

## Review and export

Use the review rail to correct OCR text, merge split labels, or remove incorrect detections. Inspect the **Tactile graphic**, **What the AI saw**, and **vs. edge tracing** views. Check braille, part boundaries, line spacing, textures, and the key page. The relief tab requires WebGL.

Current exports include the tactile SVG, key page SVG, print/PDF through the browser print dialog, and STL from the relief view. See [Review workflow](review-workflow.md), [Guidelines](guidelines.md), and [Printing](printing.md).

## Evaluation and development checks

Install Playwright's Chromium browser if needed:

```bash
npx playwright install chromium
npm run serve
```

In a second terminal:

```bash
npm run eval
node scripts/recall.mjs
```

The harness records metrics for the sample set and compares TouchSight-NG with a Canny edge-tracing baseline. See [Evaluation and benchmarks](evaluation.md).

## Troubleshooting

| Symptom | Likely cause / action |
|---|---|
| Models fail to load | Check generated asset paths, network access during vendor setup, and browser console errors. |
| PaddleOCR fails | The pipeline attempts Tesseract fallback; inspect console output to identify the underlying failure. |
| SlimSAM fails | Confirm both ONNX files and the Transformers.js/ONNX Runtime WASM files are present at the paths expected by the loaders. |
| Slow first run | Initial model downloads and WASM initialization are expected; subsequent browser caching may help. |
| 3D view is blank | Check WebGL support and browser/GPU settings; tactile SVG export does not require WebGL. |
| Upload rejected | Use PNG, JPG/JPEG, or WebP under the 15 MB UI limit. |

## Privacy and network behavior

Image inference runs in the browser. The current design does not upload source diagrams to an application backend. Initial setup downloads public libraries and model files; after those assets are local, inference uses local browser assets. OpenCV has a pinned jsDelivr fallback in `libs.js` for setups where its vendored copy is unavailable. That request fetches library code, not user image pixels.

## Editable SVG post-processing and quality control

The tactile SVG export is a vector document with physical dimensions in millimetres. It contains separate, named SVG groups for the page background, textures, structural line art, outlines, label-clearance knockouts, leader lines, and braille dots. The key-page SVG also separates braille from sighted print-reference text. Paths, circles, and text remain vector objects rather than a flattened screenshot.

**Inkscape is the recommended reference editor because it is free and open-source (FOSS).** The exported SVG is standard vector artwork; other SVG-capable editors—including Adobe Illustrator and Affinity Designer—can also be used. TouchSight-NG targets FOSS workflows, so Inkscape is the editor used in these instructions, not a technical requirement.

Recommended post-processing sequence:

1. Export the editable tactile SVG and, when present, the key-page SVG.
2. Open the SVG in Inkscape. Use the Objects/Layers panel to inspect and isolate the named groups.
3. Compare the artwork with the source diagram and the TouchSight-NG analysis views. Correct path geometry, remove false contours, reconnect broken boundaries, and adjust leader placement where necessary.
4. Check label-to-part correspondence, braille spelling and dot patterns, line hierarchy, texture distinction, clearances, and page margins. Do not assume that a visually attractive edit is tactilely legible.
5. Preserve the physical page dimensions and millimetre scale. Avoid scaling individual objects in ways that alter specified braille or line dimensions.
6. Save a separate reviewed SVG, then produce a physical proof on the target printer/swell-paper/fuser system. Inspect the raised output and obtain tactile-reader feedback where possible.

The vector editor is a post-processing and QC option, not an automated validation step. Editing SVG geometry does not update TouchSight-NG's analysis state or its automated guideline report. Re-run or independently perform checks after edits, and retain the unmodified export so changes can be compared or reverted.
