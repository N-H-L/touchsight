# Evaluation and benchmarks

## What the current evaluation measures

The evaluation harness runs the browser application against repository sample diagrams and records selected geometric guideline metrics. A separate recall script compares recognized labels with hand-counted ground truth. This is useful for regression testing; it is not a formal usability study.

## Run the harness

Requirements: Node.js 24+, installed npm dependencies, generated runtime assets, and Playwright Chromium.

```bash
npm ci
npm run vendor
npx playwright install chromium
npm run serve
```

In another terminal:

```bash
npm run eval
node scripts/recall.mjs
```

The scripts write evaluation output under `eval-out/`. Other tools include `scripts/ocrbench.mjs` (Tesseract vs PaddleOCR label recall), `scripts/lab.mjs` (per-stage overlays and JSON), `scripts/qa.mjs` and `scripts/edge.mjs` (interaction and edge-case QA), and screenshot scripts.

**Setup note:** vendor output paths and browser-loader paths are inconsistent in the inspected source. Resolve that mismatch before interpreting a failed clean-checkout run as a model-quality failure.

## Snapshot results

The current documentation snapshot reports results on 16 Wikimedia Commons diagrams:

| Metric | Detailed | Simplified | Canny edge baseline | Canny, text erased |
|---|---:|---:|---:|---:|
| Label recall (10 diagrams, 151 hand-counted labels) | 148/151 (98%) | same | n/a | n/a |
| Labels placed in braille | 232/233 | same | none | none |
| Print text traced as raised marks | 0 | 0 | all 233 labels | 0 |
| Short fragments under 12.5 mm | 66 | 14 | 763 | 336 |
| Mean figure area with lines under 3 mm apart | 3.5% | 1.0% | 6.4% | 4.8% |
| Braille labels with full 3 mm clearance | 165/232 (71%) | 172/231 (74%) | n/a | n/a |

These are historical snapshots. Re-run the harness after code or model changes; do not assume they describe an untested branch or new build.

## OCR engine comparison

The repository includes `scripts/ocrbench.mjs` to compare label recall between PaddleOCR and Tesseract. The intended path is PaddleOCR first, Tesseract fallback. Changes to detector thresholds, recognizer models, image preprocessing, or fallback behavior should be measured against the same hand-counted labels.

## Performance and model size

Earlier project measurements report roughly 10–30 seconds per diagram on an i9-14900KF desktop running Chromium, once model assets are cached. The documentation has described first-run model downloads as approximately 90 MB. Actual time and transfer size vary with browser, cache state, network, image dimensions, and asset compression; measure on representative target hardware.

## What is not measured

The automated harness does not establish tactile readability, semantic correctness of every label-to-part association, texture discrimination on physical swell paper, transcription time savings, or compatibility with every printer and production workflow. Those require transcriber review, physical production tests, and structured evaluation with tactile readers.

## Regression practice

For changes to OCR, leader detection, segmentation, tracing, or layout:

1. Run the full evaluation on the same sample set.
2. Compare label recall and false positives.
3. Inspect overlays for leader endpoint and mask errors.
4. Compare Detailed and Simplified geometry metrics.
5. Review braille placement and clearances.
6. Record browser, hardware, model versions, and cache state.
7. Keep before/after examples for diagrams where behavior changed.
