# Pipeline stages

Running a diagram goes through these stages, shown in the app's loading card.

## 1. Read the printed labels (OCR)

PaddleOCR's text detector and English recognizer run on ONNX Runtime Web (WASM). They catch small text and text printed on coloured fills far better than Tesseract, which remains as a fallback. Detected line boxes are split into word boxes proportionally to character counts; `ocr.js` then regroups words into lines and labels, merging multi-line labels unless each line owns its own leader line.

## 2. Trace leader lines

A thin-stroke mask isolates hairlines. Probabilistic Hough segments are found, assigned to labels, and chained: broken or dotted leaders that point to the same part are joined. The **tip** of the winning leader approximates the part the label names. Labels that sit on the figure (no leader) become anchors directly.

## 3. Segment the named parts

Each leader tip (or anchor) becomes a **point prompt for SlimSAM**, a distilled Segment Anything. Candidates outside plausible area bounds are rejected, and among the mask quality slots the tighter one is preferred when SAM is nearly as confident, because a label names a specific part, not the whole object.

## 4. Redraw the structure for touch

Two outline styles:

- **Detailed (default)**: every edge of the original is traced, with print text and leader lines removed and specks under 4 mm dropped. **Label-guided line hierarchy**: edges bounding a labeled part's mask are raised bold (1.5 mm); the rest is a fine 0.8 mm line.
- **Simplified**: sharp boundaries between colour regions (shading ignored) plus thin drawn strokes. Lines closer than 3 mm merge and thin to one centreline; fragments under 12.5 mm are dropped.

The tracing sensitivity slider trades contour recovery for detail; tactile spacing and braille clearance are always enforced regardless of the setting.

## 5. Lay out the tactile page

A millimetre-scale layout per [Tactile layout and BANA guidelines](guidelines.md): line widths, up to 5 textures inset 1.5 mm from outlines, uncontracted UEB braille to Spec 800 dot dimensions, full words where they fit otherwise two-letter keys (keys avoid aa/ac/cc/ca and carry dot 3 or 6), 3 mm clearance around braille with knockouts where a label must sit on the drawing.

## 6. Repair OCR slips

Detected text is checked against a science vocabulary and a list of known terms (for example anatomy terms). Plausible slips (`Atriym`, `Leff Atrium`) are corrected and **the corrections are shown to the teacher**, who can adjust anything.

## 7. Check the result

The checker in `check.js` measures the tool's own output and the Canny edge-tracing baseline at the same page size. Results appear in the app and in the evaluation harness. See [Evaluation and benchmarks](evaluation.md).
