# EVIDENCE

This file records only claims backed by an actual test or measurement, with the commit or artifact that was checked.

| Date (SGT) | Claim | How verified | Commit/artifact |
|---|---|---|---|
| 2026-10-11 04:15 | RTX 4080 16 GB available; CUDA wheels exist for Python 3.14 | `nvidia-smi`; download.pytorch.org cu128 index | — |
| 2026-10-11 06:00 | OCR + leader tracing + SlimSAM run fully in-browser (headless Chromium, WASM, no GPU) | `node scripts/lab.mjs heart volcano` | 99cb32f |
| 2026-10-11 08:05 | Live site https://n-h-l.github.io/touchsight/ runs the heart sample end to end in a fresh headless Chromium: 19.2 s including model download | `BASE=https://n-h-l.github.io/touchsight node scripts/shot.mjs heart` | Pages run 38090885517 (commit 1a8c498) |
| 2026-10-11 08:00 | Guideline-check comparison on all 16 samples (table below) | `npm run serve` + `node scripts/eval.mjs` | 47c5fd5 (metrics unchanged by later UI-only edits) |
| 2026-10-11 07:40 | Re-run after in-figure-label fix, vocabulary OCR repair and phrase merge. Heart now 11 of 14 labels with correct leaders; "Right Atriym"→"Right Atrium" and "ein"→"vein" auto-corrected | `node scripts/lab.mjs heart volcano`, `npm run eval` | 51dc1b4 |
| 2026-10-11 07:50 | Live site (after redesign + 3D): heart runs end to end; label list, legend, overlay and analysis tabs render; 3D relief renders (SwiftShader); STL export 24.6 MB in <1 s | `BASE=https://n-h-l.github.io/touchsight node scripts/qa.mjs heart` and `scripts/shot3d.mjs heart` | live deploy of "Trim write-up" commit |
| 2026-10-11 08:20 | Merge control joins split OCR labels ("Pulmonary" + "Artery" → "Pulmonary Artery") | `node scripts/qa.mjs` | 47c5fd5 + baseline-display fix |

## Guideline-check evaluation (16 Wikimedia Commons diagrams), re-run 2026-10-11 ~13:00 SGT

Pipeline at this point: PaddleOCR labels, line-art outlines (merged at 3 mm, thinned, 12.5 mm minimum), SAM-part textures. Baselines: **edge** = Canny of the original at the same page scale, thickened to 0.8 mm; **edge−text** = the same with OCR'd label boxes erased.

| Sample | Cat. | Labels found | Braille labels | Print-label spots still marked (TS / edge) | Lines <3 mm, % of figure (TS / edge / edge−text) | Short fragments (TS / edge / edge−text) | Braille clear 3 mm | Run time (s) |
|---|---|---|---|---|---|---|---|---|
| animal-cell | bio | 22 | 22 | 0 / 22 | 1.2 / 5.3 / 4.2 | 0 / 52 / 46 | 14/22 | 21.6 |
| heart | bio | 14 of 14 | 14 | 0 / 14 | 1.4 / 8.6 / 6.6 | 0 / 4 / 1 | 11/14 | 19.5 |
| flower | bio | 17 | 17 | 0 / 17 | 1 / 5 / 3.8 | 1 / 20 / 4 | 11/17 | 18.0 |
| eye | bio | 22 | 22 | 2 / 22 | 1.5 / 8.8 / 6.3 | 3 / 13 / 8 | 17/22 | 24.7 |
| ear | bio | 13 | 13 | 0 / 13 | 1.2 / 9.3 / 6.3 | 1 / 105 / 1 | 11/13 | 17.3 |
| mitochondrion | bio | 9 | 9 | 0 / 9 | 0.7 / 4.9 / 4.2 | 1 / 60 / 38 | 6/9 | 14.4 |
| tooth | bio | 11 | 11 | 0 / 11 | 0.8 / 11.1 / 10.7 | 2 / 69 / 53 | 11/11 | 16.1 |
| earth-layers | earth | 13 | 13 | 1 / 13 | 0.3 / 4.3 / 1.3 | 0 / 102 / 12 | 11/13 | 16.4 |
| volcano | earth | 12 of 13 | 12 | 0 / 12 | 0.7 / 4 / 2.5 | 1 / 101 / 11 | 12/12 | 17.0 |
| ohms-law-circuit | physics | 0 | 0 | 0 / 0 | 0.4 / 1.9 / 1.9 | 0 / 2 / 2 | 0/0 | 10.9 |
| pulley-lever | physics | 3 | 3 | 0 / 3 | 1.4 / 2.8 / 2.7 | 0 / 12 / 6 | 3/3 | 12.3 |
| australia-states | map | 29 | 28 | 7 / 29 | 0.8 / 4.6 / 3.6 | 1 / 37 / 36 | 13/28 | 30.3 |
| solar-system | chart | 2 | 2 | 0 / 2 | 0.2 / 3.2 / 3.1 | 0 / 27 / 31 | 2/2 | 10.9 |
| plant-cell | stress | 24 | 24 | 0 / 24 | 2.6 / 7.8 / 5.7 | 2 / 18 / 9 | 16/24 | 23.7 |
| water-cycle-usgs | stress | 19 | 19 | 0 / 19 | 0.6 / 12.7 / 8 | 2 / 81 / 53 | 16/19 | 20.2 |
| skin-layers | stress | 23 | 22 | 1 / 23 | 1.8 / 8.4 / 5.6 | 0 / 60 / 25 | 18/22 | 21.8 |

Totals over 16 samples: print labels left as raised text 11 (TouchSight) vs 233 (edge tracing) of 233; short fragments 14 vs 763; short fragments vs text-erased tracing 14 vs 336; mean narrow-gap area 1.0% vs 6.4% (text-erased tracing 4.8%); braille labels with 3 mm clearance 172 of 231.

### Detailed outline style (default since 11 Oct evening)
The table above is the Simplified style.

| Sample | Cat. | Labels found | Braille labels | Print-label spots still marked (TS / edge) | Lines <3 mm, % of figure (TS / edge / edge−text) | Short fragments (TS / edge / edge−text) | Braille clear 3 mm | Run time (s) |
|---|---|---|---|---|---|---|---|---|
| animal-cell | bio | 22 | 22 | 0 / 22 | 4 / 5.3 / 4.2 | 14 / 52 / 46 | 13/22 | 12.1 |
| heart | bio | 14 of 14 | 14 | 0 / 14 | 6 / 8.6 / 6.6 | 2 / 4 / 1 | 11/14 | 11.1 |
| flower | bio | 17 | 17 | 0 / 17 | 3.4 / 5 / 3.8 | 1 / 20 / 4 | 11/17 | 10.2 |
| eye | bio | 22 | 22 | 2 / 22 | 5.9 / 8.8 / 6.3 | 7 / 13 / 8 | 15/22 | 13.7 |
| ear | bio | 13 | 13 | 0 / 13 | 5.4 / 9.3 / 6.3 | 3 / 105 / 1 | 11/13 | 9.8 |
| mitochondrion | bio | 9 | 9 | 0 / 9 | 3.3 / 4.9 / 4.2 | 15 / 60 / 38 | 6/9 | 8.2 |
| tooth | bio | 11 | 11 | 0 / 11 | 9.5 / 11.1 / 10.7 | 10 / 69 / 53 | 11/11 | 9.0 |
| earth-layers | earth | 13 | 13 | 1 / 13 | 1 / 4.3 / 1.3 | 4 / 102 / 12 | 11/13 | 9.2 |
| volcano | earth | 12 of 13 | 12 | 0 / 12 | 2.1 / 4 / 2.5 | 4 / 101 / 11 | 12/12 | 8.9 |
| ohms-law-circuit | physics | 0 | 0 | 0 / 0 | 0.6 / 1.9 / 1.9 | 1 / 2 / 2 | 0/0 | 5.7 |
| pulley-lever | physics | 3 | 3 | 0 / 3 | 2 / 2.8 / 2.7 | 5 / 12 / 6 | 3/3 | 7.1 |
| australia-states | map | 29 | 28 | 7 / 29 | 1.9 / 4.6 / 3.6 | 2 / 37 / 36 | 11/28 | 16.3 |
| solar-system | chart | 2 | 2 | 0 / 2 | 2.8 / 3.2 / 3.1 | 17 / 27 / 31 | 2/2 | 6.5 |
| plant-cell | stress | 24 | 24 | 0 / 24 | 6.5 / 7.8 / 5.7 | 6 / 18 / 9 | 17/24 | 12.9 |
| water-cycle-usgs | stress | 19 | 19 | 0 / 19 | 6.5 / 12.7 / 8 | 19 / 81 / 53 | 14/19 | 11.1 |
| skin-layers | stress | 23 | 23 | 1 / 23 | 6.3 / 8.4 / 5.6 | 9 / 60 / 25 | 20/23 | 13.6 |

Totals over 16 samples: print labels left as raised text 11 (TouchSight) vs 233 (edge tracing) of 233; short fragments 119 vs 763; short fragments vs text-erased tracing 119 vs 336; mean narrow-gap area 4.2% vs 6.4% (text-erased tracing 4.8%); braille labels with 3 mm clearance 168 of 232.

### Label recall vs hand-counted ground truth (app/samples/labels_truth.json)
| Sample | True labels | Found (matched) | Recall | Extra detections | Missed |
|---|---|---|---|---|---|
| animal-cell | 22 | 22 | 100% | 0 |  |
| heart | 14 | 14 | 100% | 0 |  |
| flower | 17 | 17 | 100% | 0 |  |
| eye | 19 | 18 | 95% | 4 | Suspensory ligament of lens |
| ear | 13 | 13 | 100% | 0 |  |
| mitochondrion | 9 | 9 | 100% | 0 |  |
| tooth | 9 | 8 | 89% | 3 | Pulp chamber (blood vessels & nerves) |
| earth-layers | 13 | 13 | 100% | 0 |  |
| volcano | 12 | 12 | 100% | 0 |  |
| plant-cell | 23 | 22 | 96% | 2 | Filamentous cytoskeleton |

Overall recall: 148 of 151 (98%)

### Honest reading of these numbers
- **Print-label spots still covered by raised marks.** TouchSight never draws print text. Its non-zero counts are leader lines, outlines or textures that pass through where a print label used to be. The baseline count is real traced text.
- **Lines closer than 3 mm** is approximated with a morphological closing at 3 mm. It is a proxy for BANA's "3 mm between distinct lines", not a perfect measure.
- **Braille clearance:** 172 of 231 placed labels (74%) keep ≥3 mm from all lines and textures (textures now off by default). The rest sit on knockouts or in crowded areas; this is the main open improvement.
- **Outlines (11 Oct, after user feedback):** the outline tracer now uses colour-region boundaries (k-means, specks merged, kept only where colour steps sharply so shading bands drop out) plus thin drawn strokes. Part textures snap to those regions and are off by default because users read them as clutter.
- **Coverage:**
  - OCR finds no labels on 3 samples (ohms-law-circuit: single-letter math symbols; pulley-lever: math symbols; solar-system: white rotated text on black). Those outputs contain outlines only.
  - Some in-figure labels on colored fills are missed (e.g. heart: Left/Right Atrium/Ventricle).
  - Some OCR text needs teacher correction ("Pulmonary ein", "Right Atriym").
- **Not validated with blind readers or TVIs, and no physical swell-paper print was tested.** The claims stay at "meets these automated checks".
