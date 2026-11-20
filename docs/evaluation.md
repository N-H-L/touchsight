# Evaluation and benchmarks

## Harness

`scripts/eval.mjs` runs the real app in headless Chromium over every sample in `src/samples/samples.json`, records the guideline-check metrics for TouchSight-NG versus the edge-tracing baseline, and writes `eval-out/eval.json` and `eval-out/eval.md`. `scripts/recall.mjs` then scores detected labels against hand-counted ground truth (`src/samples/labels_truth.json`) with fuzzy matching (normalized Levenshtein similarity >= 0.8).

```bash
npm ci
npm run vendor
npx playwright install chromium
npm run serve &        # http://localhost:5173
npm run eval           # writes eval-out/eval.json, eval.md
node scripts/recall.mjs
```

Additional harnesses: `scripts/ocrbench.mjs` (label recall for Tesseract vs PaddleOCR), `scripts/lab.mjs` (per-stage overlays and JSON), `scripts/qa.mjs` and `scripts/edge.mjs` (interaction and edge-case QA), `scripts/shot*.mjs` (screenshots).

## Results: 16 Wikimedia Commons diagrams, same checker throughout

| Metric | Detailed (default) | Simplified | Edge tracing | Edge tracing, text erased |
|---|---|---|---|---|
| Label recall vs hand-counted labels (10 diagrams, 151 labels) | **148 of 151 (98%)** | same | n/a | n/a |
| Labels placed in braille | **232 of 233** | same | none | none |
| Print text traced as raised marks | **none** (erased before tracing) | none | all 233 labels | none |
| Short fragments (< 12.5 mm) | 66 | **14** | 763 | 336 |
| Mean figure area where lines < 3 mm apart | 3.5% | **1.0%** | 6.4% | 4.8% |
| Braille labels with full 3 mm clearance | 165 of 232 (71%) | 172 of 231 (74%) | n/a | n/a |

Detailed keeps the original's look; Simplified follows BANA spacing more strictly; teachers pick per diagram. The last column is the strongest simple baseline: the Detailed style starts from that tracing and adds braille labels, redrawn leaders, speck removal and the label-guided line hierarchy (66 fragments vs 336).

## Performance

PaddleOCR detector + recognizer (~18 MB) and SlimSAM (~40 MB) run on laptop CPUs through WebAssembly. Measured on a desktop (i9-14900KF, Chrome headless): **10-30 s per diagram** once models are cached. The first run downloads about 90 MB of models.

## Practice

Every change to tracing, segmentation or layout should be scored with the harness before merging. The numbers above are snapshots; rerun `npm run eval` to compare against a change.
