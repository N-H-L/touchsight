# OCR label-recall benchmark

Ground truth: `app/samples/labels_truth.json` (151 printed labels across 10 samples, hand-transcribed; multi-line labels joined with one space).

**Metric.** Recall = truth labels matched one-to-one by a detected line, or by a vertical stack of up to 4 adjacent detected lines, with normalized Levenshtein similarity ≥ 0.8 (case-insensitive). Precision = detected lines whose text fuzzy-matches (partial ratio ≥ 80) part of some truth label.

**Important:** the sample PNGs are RGBA with transparent backgrounds. They must be composited on white first (the app already does this in `ui.js`). Without that step, black text on transparent pixels disappears and RapidOCR recall drops to about 30%.

## Step 1: Python feasibility (RapidOCR 3.10.0, onnxruntime 1.31 CPU, native, multithreaded)

| sample | truth | v6 det small + v6 rec small | v6 det small + **en v5 rec mobile** | v6 det tiny + v6 rec tiny |
|---|---|---|---|---|
| heart | 14 | 14 | 14 | 11 (misses Left Atrium, Left/Right Ventricle) |
| volcano | 12 | 12 | 12 | 12 |
| animal-cell | 22 | 22 | 22 | 22 |
| flower | 17 | 17 | 17 | 17 |
| mitochondrion | 9 | 9 | 9 | 9 |
| ear | 13 | 13 | 13 | 13 |
| tooth | 9 | 9 | 9 | 9 |
| earth-layers | 13 | 13 | 13 | 13 |
| eye | 19 | 19 | 19 | 18 (misses Lens) |
| plant-cell | 23 | 23 | 23 | 23 |
| **total recall** | 151 | **151 (100%)** | **151 (100%)** | 147 (97%) |
| precision (lines) | | 194/196 | 193/194 | 190/190 |
| time / image | | ~1.8 s | ~1.7 s | ~1.1 s |

The tiny det model misses exactly the labels printed on coloured fills, so we chose **det small**.

## Models (RapidOCR ONNX conversions of PaddleOCR, Apache-2.0)
| role | file | size | URL |
|---|---|---|---|
| det | PP-OCRv6_det_small.onnx (DB, multilingual) | 9.9 MB | https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.10.0/onnx/PP-OCRv6/det/PP-OCRv6_det_small.onnx |
| rec (chosen) | en_PP-OCRv5_rec_mobile.onnx (CTC, 438 classes) | 7.9 MB | https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.10.0/onnx/PP-OCRv5/rec/en_PP-OCRv5_rec_mobile.onnx |
| rec (alt) | PP-OCRv6_rec_small.onnx (18,710 classes, CJK+Latin) | 21.2 MB | …/onnx/PP-OCRv6/rec/PP-OCRv6_rec_small.onnx |

- **Dictionary:** embedded in the ONNX `metadata_props` under the key `character`, one character per line (437 entries for the en model). Decoding uses `['blank', ...dict, ' ']`, greedy CTC: argmax, collapse repeats, drop blanks.
- **Det preprocessing (RapidOCR):** `limit_type=min`, `limit_side_len=736`. Images are resized to multiples of 32 and normalized as `(x/255 - 0.5)/0.5`, in BGR order. Post-processing: thresh 0.3, box_thresh 0.5, unclip 1.6, dilation on.
- **Rec input:** height 48, aspect-preserving width (batch padded to the widest; the base is 320), normalized as `(x/255 - 0.5)/0.5`. Crops with h/w ≥ 1.5 are rotated 90°, which is how vertical "Auricle" gets read.
- RapidOCR also runs a 0.6 MB angle classifier. None of these diagrams need it.

## Step 2: in the browser (headless Chromium, onnxruntime-web WASM, 1 thread, `node scripts/ocrbench.mjs`)

- `tesseract`: the OCR stage of `pipeline.js`, reproduced exactly: an original pass plus an adaptive-binarized pass, then `mergeWordSets` → `filterWords` → `correctWord` → `wordsToLines`.
- `paddle`: `detectText()` words → `filterWords` → `wordsToLines`. This is what the pipeline would see.
- `paddle-raw`: `detectText(..., {level:'line'})` with no filtering.

| sample | Tesseract recall | Paddle recall | Paddle-raw recall | Tesseract ms | Paddle ms |
|---|---|---|---|---|---|
| heart | 11/14 (misses Left Atrium, Left/Right Ventricle) | **14/14** | 14/14 | 698 | 1993 |
| volcano | 12/12 | 12/12 | 12/12 | 446 | 1223 |
| animal-cell | 22/22 | 22/22 | 22/22 | 687 | 1757 |
| flower | 16/17 (anther) | **17/17** | 17/17 | 325 | 1260 |
| mitochondrion | 9/9 | 9/9 | 9/9 | 355 | 1080 |
| ear | 12/13 (Auricle, vertical) | 12/13 (Auricle: `filterWords` drops tall boxes) | 13/13 | 492 | 1641 |
| tooth | 9/9 | 9/9 | 9/9 | 956 | 1304 |
| earth-layers | 11/13 (small "2900 km", "5100 km") | **13/13** | 13/13 | 401 | 1173 |
| eye | 19/19 | 19/19 | 19/19 | 868 | 2205 |
| plant-cell | 23/23 | 23/23 | 23/23 | 735 | 2207 |
| **total** | **144/151 (95%)** | **150/151 (99%)** | **151/151 (100%)** | 596 avg | ~1600 avg |
| precision (lines) | 186/188 | 192/193 | 193/194 | | |

- Model load times: Paddle 0.6 s (17.8 MB, cached after the first load) and Tesseract 0.4 s.
- With `loadPaddle({proxy:true})`, inference runs in a worker and takes about 20% longer (heart 2.5 s).
- Paddle word boxes are inset by 17% of the line height. Without the inset, the padded DB boxes made `wordsToLines` merge neighbouring labels ("Ribosome cristae", "pistil stigma") and recall fell to 144/151.
