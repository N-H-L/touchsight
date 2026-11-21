# Module reference

This page maps the current browser application source under `src/js/`. It describes the implementation in the inspected main-branch source; planned features are called out separately rather than listed as active modules.

## Application orchestration

### `ui.js`

Owns browser UI state, image input, tabs, review rail, export actions, and the deep-link sample parameter. It decodes and normalizes the image, invokes `analyze()`, builds the tactile layout, runs checks, and updates the views.

### `pipeline.js`

Coordinates the analysis stage: loads OpenCV.js, SlimSAM, and attempts PaddleOCR initialization; runs PaddleOCR with Tesseract fallback; filters and groups OCR words into labels; applies vocabulary corrections; detects label/leader relationships; builds foreground and structural line representations; computes SlimSAM image embeddings; and segments label anchors.

## Recognition and geometry

### `paddle.js`

Loads PP-OCRv6 detection-small and PP-OCRv5 English recognition-mobile ONNX models using ONNX Runtime Web. The detector proposes text regions; the recognizer reads their content. The implementation uses the WASM execution provider, crops candidate quadrilaterals, batches recognition, and can return line or word-level records. Word boxes are approximated from line boxes using character counts.

### `ocr.js`

Normalizes OCR output into words, filters implausible tokens using confidence and size, groups words into baselines, and merges stacked lines into labels. It uses leader associations and a small science vocabulary to avoid incorrectly merging separate labels.

### `leaders.js`

Creates a thin-stroke mask using morphological black-hat/top-hat operations, finds line segments with probabilistic Hough transform, assigns candidate segments to text lines, and chains nearby collinear segments to estimate leader tips.

### `lineart.js`

Builds structural line art from colour-region boundaries and thin strokes. It uses image smoothing, Lab colour space, k-means clustering, component-size filtering, and edge tests to suppress shading gradients and small decorative marks.

### `segment.js`

Uses Transformers.js and SlimSAM. It computes one image embedding, applies point prompts for each label, evaluates candidate masks by score and area, and returns a mask for each label where possible.

### `libs.js`

Provides lazy loaders for OpenCV.js, Tesseract.js, Transformers.js, and ONNX Runtime WASM. It configures local model paths and disables remote model resolution for Transformers.js. OpenCV has a pinned CDN fallback if the local bundle is missing.

## Tactile output and quality

### `tracing-config.js`

Centralizes tracing-sensitivity settings shared by the UI and analysis pipeline.

### `tactile.js`

Builds a page layout in physical units, places braille labels and keys, assigns textures, and applies spacing/clearance and knockout rules.

### `braille.js`

Encodes uncontracted UEB Grade 1 and generates two-letter label keys.

### `render.js`

Renders the tactile page and key page as SVG, including line geometry, texture patterns, braille dots, and preview-only presentation elements.

### `check.js`

Measures selected layout properties and computes a Canny edge-tracing baseline for comparison. The checker does not establish tactile readability.

### `relief.js`

Uses three.js to display a 3D relief preview and generate an STL plate model.

## Planned / not currently wired into the main pipeline

- **Potrace Autotrace:** the package dependency is present, and integration is being developed separately in [PR #4](https://github.com/mrhunsaker/touchsight-NG/pull/4). The inspected `pipeline.js` does not yet call it.
- **Inkscape-ready editable SVG:** planned as a separate export specification and implementation phase after Potrace verification and PR #4 merge. The existing tactile SVG remains the production-oriented export.
- **Larger vision-language or segmentation models:** discussed as research directions in [Advanced model options](advanced-model-options.md); none are enabled in the current app.
