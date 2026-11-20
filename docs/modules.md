# Module reference

A short reference for each ES module under `src/js/`. Each module is self-contained and imports only what it needs.

## ui.js
App shell and state. Owns the DOM, the tab system, the review rail, export buttons, deep links (`?sample=heart`), and `window.__touchsight` (read by the Playwright evaluation harness).

## pipeline.js
The analysis stage: loads engines, runs OCR, leader tracing, segmentation, builds label records and exposes timings per stage.

## paddle.js
Standalone PaddleOCR on ONNX Runtime Web: DB text detection with unclip, quad cropping, CTC recognition with batching (height 48, batch 6, score 0.5), including vertical text (two 90-degree reads). Reads the recognizer's character dictionary from ONNX metadata.

## ocr.js
Turns words into lines and labels. Multi-line labels are merged unless each line owns a leader line.

## leaders.js
Leader-line detection: thin-stroke mask, probabilistic Hough segments, assignment to labels, chaining of broken and dotted leaders, tip extraction.

## segment.js
SlimSAM point prompting: image embedding once per diagram, per-part `segmentPoint` with area bounds and tightest-confident-mask selection.

## libs.js
Lazy loaders with progress callbacks: OpenCV.js (vendored, pinned CDN fallback without data), Tesseract.js worker (PSM 11, sparse text), transformers.js + ONNX Runtime WASM configured for local model paths.

## lineart.js
Colour-region outline tracing for the Simplified style: sharp colour-region boundaries, shading ignored, thin drawn strokes included.

## tracing-config.js
Shared tracing sensitivity configuration so UI and pipeline agree.

## tactile.js
The heart of the output: builds the page layout in millimetres for the chosen paper size and style, places braille and keys, assigns textures, applies knockouts and clearance rules.

## braille.js
UEB Grade 1 (uncontracted) encoder, Unicode braille output, two-letter key generation (avoids aa/ac/cc/ca, requires dot 3 or 6).

## render.js
Renders the tactile page and key page as SVG: pure black, Spec 800 dots, texture patterns, optional preview helpers (label pills, highlight, underlay image).

## check.js
Guideline checker measuring print-text traces, short fragments, narrow-gap area and braille clearance, plus the Canny edge-tracing baseline used for comparison.

## vocab.js
Science vocabulary for OCR slip repair and the known-terms list; drives the visible corrections in the review rail.

## relief.js
three.js relief preview with a sweeping raking light, and the STL plate export for 3D printing.
