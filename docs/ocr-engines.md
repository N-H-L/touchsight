# OCR engines

TouchSight reads the printed labels on a diagram with one of three on-device OCR
engines. They are tried in a fixed order, and the pipeline reports which one was
used ("ocrEngine" in the analysis result, visible in the browser console):

1. **Indra OCR** (Datalab, v1.1.0) - opt-in from the **"Use Indra OCR"**
   checkbox under Output options. Vendored as plain ONNX (`det.onnx` +
   `rec.onnx` + `meta.json`, a few MB) into `src/models/indra/` by
   `npm run vendor`, and run on onnxruntime-web by `src/js/indra.js`.
2. **PaddleOCR** (PP-OCRv6 det + PP-OCRv5 English rec, RapidOCR's ONNX
   conversions) - the default, run by `src/js/paddle.js`.
3. **Tesseract.js** - the original fallback, used only if PaddleOCR itself
   could not run.

Each stage runs only when the previous one throws or finds no text at all, so
selecting Indra can never leave the pipeline worse than the default chain.

## What is ported (and what is not)

The JavaScript port covers the Latin path of Indra: DB text detection
(`rec.onnx`'s sibling `det.onnx`), CTC recognition, line grouping into words.
The Python package's multi-script recognizers (`rec_cjk.onnx`,
`rec_rtl.onnx`, `rec_world.onnx`), its language-model rescoring
(`lm.npz`), and its orientation/script classifiers (`orient.onnx`,
`script.onnx`) are not ported. Tilted pages, handwriting-heavy pages, and
non-Latin scripts will do better with the default chain or the Python package.

The recognizer's input shape, the detector's channel order, and the blank
index are the places where the reference implementation was ambiguous from the
model files alone; `src/js/indra.js` probes input shapes at load time and
exposes the channel order as a constant (`DET_BGR`). If the Indra engine
returns no boxes while the logs show it loaded, first compare against
`indra-ocr`'s Python output on the same image, then check `DET_BGR`.

## Validation

Before relying on the checkbox, run the repo's sample diagrams through both:

```bash
pip install indra-ocr          # reference implementation
indra_ocr src/samples/heart.png --format json
```

and compare word boxes and texts with the browser's "What the AI saw" view.
The evaluation harness (`npm run eval`, Playwright) records
`window.__touchsight.analysis.ocrEngine`, so an engine-comparison run is a
small addition to `scripts/eval.mjs`.

## Licensing

The models are downloaded from Datalab's official Hugging Face repository
([datalab-to/indra-ocr](https://huggingface.co/datalab-to/indra-ocr)), pinned
to the v1.1.0 commit, with the repository LICENSE copied alongside
(`src/models/indra/LICENSE`). Confirm that the license keeps the weights
redistributable in this GPL-3.0 project (and any derived distribution) before
shipping builds that include them; if it does not, the model folder is
optional and the fallback chain degrades gracefully without it.
