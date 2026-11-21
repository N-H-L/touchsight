# Pipeline stages and theory

TouchSight-NG is a hybrid computer-vision pipeline. OCR and segmentation use trained neural networks; OpenCV operations and project-specific algorithms connect their results and convert them into tactile geometry.

## End-to-end pipeline

```mermaid
flowchart TD
  A[Input: PNG, JPG, WebP] --> B[Decode and normalize]
  B --> I0{Use Indra OCR checked?}
  I0 -->|Yes| I1[Indra detection and recognition]
  I1 -->|error or no text| C{PaddleOCR available?}
  I0 -->|No| C
  C -->|Yes| D[PaddleOCR detection and recognition]
  C -->|No / error| E[Tesseract fallback]
  D --> F[Normalize word boxes]
  E --> F
  I1 --> F
  F --> G[Filter low-confidence / implausible words]
  G --> H[Group words into text lines]
  H --> I[Merge stacked lines into semantic labels]
  I --> J[Science-vocabulary correction, shown for review]
  J --> K[Identify labels on the drawing]
  K --> L[Thin-stroke extraction]
  L --> M[Probabilistic Hough line segments]
  M --> N[Assign segments to labels and chain broken leaders]
  N --> O[Leader endpoint / in-figure anchor]
  B --> P[Foreground mask and structural line analysis]
  O --> Q[Point prompts]
  P --> Q
  Q --> R[SlimSAM image embedding and mask candidates]
  R --> S[Mask filtering and selection]
  P --> T[Detailed or Simplified line-art extraction]
  S --> U[Label-guided line hierarchy]
  T --> U
  J --> V[Millimetre tactile layout]
  U --> V
  V --> W[Braille, keys, textures, knockouts]
  W --> X[Automated guideline checks]
  X --> Y[Transcriber review and correction]
  Y --> Z[Editable layered SVG / key page / print-PDF / STL]
  Z --> AA[Optional Inkscape or other SVG editor: manual correction and QC]
  AA --> AB[Physical proof and tactile QA]
```

## 1. Input normalization

The UI accepts PNG, JPEG/JPG, and WebP. It rejects files over 15 MB and scales the longest image side to at most 1,400 pixels before analysis. The image is drawn over a white canvas, so transparent pixels are composited onto white. This bounds memory and inference time while retaining detail for common textbook diagrams.

The original image is retained in the UI for comparison. Analysis operates on the normalized raster.

## 2. OCR: find printed labels

### Engine chain

The engines are tried in a fixed order, and only a failure or an empty result
moves the pipeline down the chain:

1. **Indra OCR** (Datalab, v1.1.0), only when the "Use Indra OCR" checkbox is
   set; experimental, Latin-script only.
2. **PaddleOCR**, the default.
3. **Tesseract.js**, if the ONNX path itself cannot run.

The purpose is resilience, not ensembling: engines are not voting on the
same label. Which engine answered is recorded in the analysis result
("ocrEngine") so evaluation runs can compare them. See
[OCR engines](ocr-engines.md).

### PaddleOCR is the default

The pipeline attempts PaddleOCR first. Its two ONNX models have separate jobs:

- **Text detector:** PP-OCRv6 detection-small predicts regions likely to contain text. The implementation uses a DB-style detector and post-processes probability maps into candidate text boxes.
- **English recognizer:** PP-OCRv5 English recognition-mobile reads cropped text regions. It uses a CTC-style character sequence output and the character dictionary embedded in the ONNX model metadata.

The app loads both models through ONNX Runtime Web using the WASM execution provider. The detector proposes line/region boxes; recognition reads the crops. The current implementation normalizes recognized lines into approximate word boxes based on character counts. Those boxes are regrouped by the general OCR code.

### Tesseract is the fallback

If PaddleOCR cannot load or throws during recognition, the pipeline falls back to Tesseract.js. It uses English traineddata, LSTM-only OCR engine mode (OEM 1), and page segmentation mode 11 (sparse text), suitable for scattered diagram labels rather than full paragraphs.

The fallback makes a second pass on an adaptive-threshold/binarized image and merges overlapping word boxes, retaining the more confident recognition. This can recover text that is difficult to read against a coloured fill.

### OCR post-processing

Word boxes are filtered using confidence and geometry rules. Nearby words on a shared baseline become lines. Stacked lines may be merged into one multi-line label unless separate leaders indicate that they are separate labels. Science-vocabulary corrections can repair likely slips; the UI exposes corrections for human review.

OCR does not establish whether a label is scientifically correct or whether it points to the intended part. Those are later association and review tasks.

## 3. Leader-line detection

Leader lines connect printed labels to diagram parts. They are not the same as the outlines of the parts.

The current method:

1. Converts the image to grayscale.
2. Uses morphological black-hat and top-hat operations to highlight thin dark-on-light and light-on-dark strokes.
3. Removes OCR text boxes from this mask so letters are less likely to be mistaken for leaders.
4. Uses probabilistic Hough transform to propose straight line segments.
5. Scores candidate segments by distance from a label, direction away from the label, and length.
6. Chains nearby, approximately collinear segments to reconstruct broken or dotted leaders.
7. Uses the far endpoint as an approximate point on the named part.

```mermaid
flowchart TD
  A[OCR label box] --> C[Candidate line segments]
  B[Thin-stroke mask] --> C
  C --> D[Score by proximity and direction]
  D --> E[Assign best segment]
  E --> F[Chain collinear gaps]
  F --> G[Leader tip]
  G --> H[Segmentation point prompt]
```

This is a geometric heuristic, not a learned relationship model. Crossings, arrowheads, curved leaders, or crowded diagrams can produce incorrect endpoints. The review overlay is important.

## 4. Foreground and structural line analysis

The foreground stage estimates which pixels belong to the diagram rather than the page background. The implementation estimates a background colour from border pixels, thresholds colour distance, removes text boxes, applies morphological opening/closing, fills holes, and removes small components.

The structural line stage is separate from leader detection. It seeks meaningful internal boundaries:

- Smooths and downsamples the image.
- Converts colour to Lab space.
- Clusters drawing colours with k-means.
- Merges small regions into neighbouring regions to suppress shading speckle.
- Extracts boundaries between colour regions when there is a real colour step.
- Includes thin drawn strokes that are darker or more saturated than their surroundings.
- Excludes text and short decorative marks where possible.

Leader lines communicate label-to-part relationships; structural lines describe the parts themselves.

## 5. Segment named parts with SlimSAM

SlimSAM is a compact, distilled Segment Anything model. The app computes an image embedding once, then uses point prompts derived from leader tips or points near labels printed inside the drawing.

For each prompt, the model returns multiple candidate masks and confidence scores. The code rejects masks outside configured area fractions. Among candidates whose score is within 0.06 of the best score, it prefers the smaller mask because a label is more likely to name a specific component than an entire surrounding object. The selected mask is intersected with a dilated foreground mask so it does not expand into the page background.

This heuristic constrains a general-purpose segmentation model to diagram parts, but it does not guarantee semantic correctness.

## 6. Convert visual structure to tactile structure

Two line-art styles are available:

- **Detailed:** retains more of the source drawing's structure. Text and leader lines are removed from the figure tracing where possible. Boundaries associated with named-part masks receive stronger emphasis.
- **Simplified:** emphasizes boundaries between flat colour regions and thin drawn strokes while suppressing shading and small specks. Nearby lines are merged/thinned more aggressively.

The tracing sensitivity control changes contour/foreground recovery. It does not disable the tactile layout's physical checks.

## 7. Lay out braille and textures

The layout engine works in millimetres for the selected page size. It places uncontracted UEB Grade 1 braille, optional two-letter keys, and up to five textures. It applies line hierarchy, texture insets, braille clearance, and knockouts. See [Tactile layout and BANA guidelines](guidelines.md).

## 8. Check and review

The checker measures selected geometric properties such as short fragments, narrow gaps, and braille clearance. It also compares the output with a Canny edge-tracing baseline. These are diagnostics, not a pass/fail determination of tactile usability.

The transcriber must compare every label and part relationship against the source, inspect the tactile graphic and 3D relief, and perform applicable production QA. See [Review workflow](review-workflow.md).

## Potrace: optional preprocessing

TouchSight-NG includes an optional **Autotrace** control that uses the locally vendored `esm-potrace-wasm` runtime. It is an opt-in preprocessing step: when enabled, the browser passes the source image through Potrace, renders the resulting SVG back to an image at the original pixel dimensions, and sends that prepared raster through the normal analysis pipeline. OCR, leader detection, foreground and line-art analysis, and segmentation then operate on the prepared image.

Autotrace is not the default path. With the control disabled, analysis uses the original image. The original source image is retained for comparison, and the prepared image is used for the analysis and downstream tactile layout. If Potrace initialization or reconstruction fails, the run reports the error and restores the previous application state rather than silently treating the failed result as valid.

Potrace does not generate the final tactile graphic. The normal layout and rendering stages still create the semantic parts, braille, physical spacing, line hierarchy, and production-oriented SVG. Autotrace can change or simplify image details, so compare its results with the original and review labels, boundaries, and tactile meaning before export. See [Models and inference engines](models-and-engines.md#potrace-and-autotrace).

## Editable SVG post-processing and quality control

The tactile SVG is an editable vector document sized in millimetres, with named groups for textures, structural line art, outlines, label-clearance knockouts, leader lines, and braille dots. The key-page SVG separates braille from sighted print-reference text. These are vector objects, not a flattened screenshot.

**Inkscape is the recommended reference editor because it is free and open-source (FOSS).** The SVG is standard vector artwork and can also be edited in other SVG-capable tools, including Adobe Illustrator and Affinity Designer. Inkscape is the documented default because the project targets FOSS workflows; it is not a technical requirement.

Use the vector editor for post-processing: compare with the source and analysis overlays, correct paths and false contours, adjust leaders, and inspect braille, label-to-part correspondence, line hierarchy, textures, clearances, and margins. Preserve the page dimensions and mm scale. Save a separate reviewed copy, then produce a physical proof on the intended swell-paper/fuser system.

Vector editing is an optional manual post-processing and QC stage, not automated validation. Edits do not update TouchSight-NG's analysis state or guideline report. Recheck the edited SVG independently, retain the untouched export, and assess the physical proof; visual correctness alone does not establish tactile readability.
