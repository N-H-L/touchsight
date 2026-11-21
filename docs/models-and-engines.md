# Models and inference engines

This page distinguishes **trained model weights** from **runtime libraries**. The runtime libraries execute algorithms; model files contain learned parameters and vocabularies. They have different sizes, licenses, loading behavior, and failure modes.

The file names below come from the checked-in `scripts/vendor.mjs`, `package.json`, and browser loader modules. The current source/build transition is incomplete: the server and vendor script target `app/`, while source modules are maintained under `src/`; see the [asset-path caveat](getting-started.md#asset-path-check).

## At a glance

| Component | Model / asset | Purpose in TouchSight-NG | When used |
|---|---|---|---|
| OpenCV.js | `@techstark/opencv-js@4.12.0-release.1` browser build | Classical image processing and geometry | Throughout analysis and checking |
| PaddleOCR detector | `PP-OCRv6_det_small.onnx` | Locates text regions in the image | Primary OCR |
| PaddleOCR recognizer | `en_PP-OCRv5_rec_mobile.onnx` | Converts detected text crops into English text | Primary OCR |
| Tesseract.js | Tesseract.js 7 browser worker/core | Independent OCR fallback | Only if PaddleOCR fails |
| Tesseract language data | `eng.traineddata.gz` (4.0.0_best_int) | English LSTM character/language model | Tesseract fallback |
| SlimSAM | `Xenova/slimsam-77-uniform` ONNX files | Segments the part indicated by a point prompt | After labels and anchors are found |
| Transformers.js | `@huggingface/transformers@4.3.0` | Loads and runs SlimSAM in the browser | Segmentation |
| ONNX Runtime Web | `onnxruntime-web` WASM and WebGPU-targeted bundle | Executes ONNX inference in the browser | PaddleOCR and SlimSAM |
| three.js | `three@0.186.1` | 3D relief visualization and STL geometry support | Only when the relief view/export is used |
| Potrace | `esm-potrace-wasm@^0.5.1` package dependency | Optional bitmap-to-vector preprocessing | When Autotrace is enabled before analysis |

## PaddleOCR: primary OCR

OCR (optical character recognition) converts printed words in the source diagram into text plus spatial coordinates. TouchSight-NG needs both: the recognized word and its bounding box are used to group labels and search for leader lines.

PaddleOCR is the primary OCR path. The vendor script downloads two ONNX models converted by RapidOCR:

### PP-OCRv6 detection-small

File: `PP-OCRv6_det_small.onnx`

The detector finds candidate text regions. It does not determine the final text string. The implementation resizes the image for inference, runs a DB-style text-detection model, thresholds the probability map, and post-processes connected regions into quadrilateral boxes. Detection is especially important for small labels, rotated labels, and text placed over coloured diagram fills.

### PP-OCRv5 English recognition-mobile

File: `en_PP-OCRv5_rec_mobile.onnx`

The recognizer reads cropped regions proposed by the detector. It predicts a character sequence using a CTC-style decoding process and the model's character dictionary. The current app uses an English recognizer, so non-English labels and specialist symbols are not a supported target.

The detector and recognizer are complementary: a detector can locate a label without reading it, while a recognizer needs a correctly cropped text region to read. Both are required for the primary OCR path.

### Runtime

`src/js/paddle.js` loads ONNX Runtime Web and creates detector and recognizer sessions with the WASM execution provider. It downloads the two ONNX files from the RapidOCR ModelScope repository configured in `scripts/vendor.mjs`. The app uses a small batch for recognition and converts recognized line boxes into approximate word boxes so the shared OCR post-processing can group words into labels.

**Failure behavior:** if PaddleOCR initialization or recognition throws, `src/js/pipeline.js` logs the error and attempts Tesseract. This fallback is resilience, not an ensemble: the two engines are not routinely voting on each label in the normal path.

## Tesseract.js: fallback OCR

Tesseract is a mature OCR engine. In this project it is the fallback when PaddleOCR is unavailable or fails.

The vendor script copies:

- `tesseract.esm.min.js`, `tesseract.min.js`, and `worker.min.js`: browser-side library and worker code.
- The Tesseract.js Core LSTM WebAssembly builds: the OCR engine runtime.
- `eng.traineddata.gz`: English trained data, version path `4.0.0_best_int`.

The loader configures English, OEM 1 (LSTM-only recognition), and PSM 11 (sparse text). PSM 11 is suitable for diagram labels scattered around an image rather than a page of continuous prose. If fallback is needed, the pipeline runs OCR on the original normalized image and on an adaptive-threshold version, then merges overlapping word detections while keeping the more confident result.

Tesseract and PaddleOCR have different model architectures and error patterns. Keeping Tesseract as a fallback makes the app less dependent on one ONNX runtime path, but it does not guarantee that every missed label will be recovered.

## SlimSAM: label-guided segmentation

Model repository: `Xenova/slimsam-77-uniform`

The vendor script downloads:

- `config.json`
- `preprocessor_config.json`
- `onnx/vision_encoder.onnx`
- `onnx/prompt_encoder_mask_decoder.onnx`

Segment Anything models are promptable segmentation systems. They do not need a fixed class label such as “heart chamber” to return a mask; they need a visual prompt, such as a point inside the region of interest. TouchSight-NG supplies a point estimated from the tip of a leader line or from the area around a label printed directly on the part.

The vision encoder creates an image embedding once. The prompt encoder and mask decoder then use each point prompt to produce candidate masks. TouchSight-NG filters candidates by area and confidence, preferring a tighter mask when its score is close to the best candidate. This is an attempt to select the named component rather than an entire surrounding object.

The current loader uses Transformers.js with local-only model resolution and ONNX Runtime WASM. It explicitly selects `device: 'wasm'`; the code comments say WebGPU is not considered sufficiently tested across the target hardware. The ONNX WASM proxy is enabled for the segmentation loader so inference does not block the UI thread.

## OpenCV.js: classical computer vision

OpenCV.js is a browser build of OpenCV. It is not a trained AI model. It supplies image-processing operations used to make the pipeline deterministic and explainable:

- grayscale conversion and colour-space conversion
- morphology (opening, closing, dilation, black-hat, top-hat)
- thresholding and connected components
- Hough line detection for leader segments
- contour extraction, hole filling, and small-component removal
- Canny edges for the comparison baseline and quality checks

The vendor script copies the pinned npm package build. `src/js/libs.js` first tries the local asset and then has a version-pinned jsDelivr fallback. The fallback downloads library code only; the source image is not sent to the CDN.

## ONNX Runtime Web and Transformers.js

These are execution frameworks, not task-specific model weights.

- **ONNX Runtime Web** executes ONNX graphs in the browser. The project vendors WASM runtime files and uses the WASM execution provider for PaddleOCR and SlimSAM.
- **Transformers.js** provides the model-loading and preprocessing interface used for SlimSAM. The app disables remote model loading and sets a local model directory.

This separation matters when debugging: a model file can be present but still fail because the runtime bundle, WASM binary, preprocessing configuration, or expected model path is wrong.

## three.js: 3D preview, not AI

three.js is a rendering library. It supports the interactive relief preview and STL export. It does not recognize labels or infer diagram parts. The 3D view is a review aid; physical swell-paper output still needs production QA.

## Potrace and Autotrace

Potrace is a bitmap-to-vector tracer: it converts raster shapes into vector paths. It is useful when a raster diagram needs a clean vector representation, but it is not an OCR engine, a semantic segmentation model, or a tactile-layout engine.

The repository's package manifest includes `esm-potrace-wasm`, a browser-oriented WebAssembly package. The optional Autotrace control in `src/index.html` invokes `src/js/autotrace.js`. The vendor script copies the ESM/WASM runtime into `src/vendor/potrace/` and includes the GPL-2.0 notice beside it.

The implemented Autotrace design is an optional upstream preprocessing pass:

1. Preserve the original uploaded raster.
2. If Autotrace is enabled, run Potrace to reconstruct a cleaner representation.
3. Rasterize that representation into an image for analysis.
4. Run OCR, leader detection, foreground/structure analysis, and segmentation on the prepared image.
5. Keep the original available for comparison and for the non-Autotrace path.

That is different from simply exporting Potrace's paths as the tactile graphic. The tactile renderer still needs semantic parts, braille, physical spacing, line hierarchy, and production constraints. Potrace is an optional preprocessing stage, not the tactile renderer. Browser behavior and output quality should be checked against representative samples before production use.

## Download size and caching

The project documentation has previously described the initial model download as roughly 90 MB, including the OCR and segmentation weights and supporting runtime assets. The exact transfer size depends on the selected files, compression, browser cache, and vendor-script revision. The vendor script skips a destination file when it already exists and has nonzero size. Browser caching can also reduce later downloads.

For a reproducible release, record exact model URLs/revisions, checksums, licenses, and measured uncompressed and transferred sizes. The current script pins some dependencies and uses versioned model paths, but it does not yet provide a complete generated model manifest with hashes.

## Licensing and redistribution

The npm dependencies and model repositories can have separate licenses. Do not infer the license of a model from the license of its runtime or conversion tool. Before redistributing a bundled build, review the license and attribution requirements for every library, model weight, conversion, and sample image. In particular, review the Potrace package's GPL-2.0 terms independently from the application's GPL-3.0-or-later license.

## Editable SVG post-processing and quality control

The tactile SVG is an editable vector document sized in millimetres, with named groups for textures, structural line art, outlines, label-clearance knockouts, leader lines, and braille dots. The key-page SVG separates braille from sighted print-reference text. These are vector objects, not a flattened screenshot.

**Inkscape is the recommended reference editor because it is free and open-source (FOSS).** The SVG is standard vector artwork and can also be edited in other SVG-capable tools, including Adobe Illustrator and Affinity Designer. Inkscape is the documented default because the project targets FOSS workflows; it is not a technical requirement.

Use the vector editor for post-processing: compare with the source and analysis overlays, correct paths and false contours, adjust leaders, and inspect braille, label-to-part correspondence, line hierarchy, textures, clearances, and margins. Preserve the page dimensions and mm scale. Save a separate reviewed copy, then produce a physical proof on the intended swell-paper/fuser system.

Vector editing is an optional manual post-processing and QC stage, not automated validation. Edits do not update TouchSight-NG's analysis state or guideline report. Recheck the edited SVG independently, retain the untouched export, and assess the physical proof; visual correctness alone does not establish tactile readability.
