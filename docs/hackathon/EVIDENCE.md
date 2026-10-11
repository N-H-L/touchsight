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
| animal-cell | bio | 22 | 22 | 0 / 22 | 1.6 / 5.3 / 4.2 | 0 / 52 / 46 | 13/22 | 12.0 |
| heart | bio | 14 of 14 | 14 | 2 / 14 | 1.9 / 8.6 / 6.6 | 0 / 4 / 1 | 10/14 | 11.1 |
| flower | bio | 17 | 17 | 0 / 17 | 1.2 / 5 / 3.8 | 1 / 20 / 4 | 11/17 | 9.9 |
| eye | bio | 22 | 22 | 6 / 22 | 1.6 / 8.8 / 6.3 | 4 / 13 / 8 | 13/22 | 13.7 |
| ear | bio | 13 | 13 | 4 / 13 | 1.1 / 9.3 / 6.3 | 1 / 105 / 1 | 9/13 | 11.3 |
| mitochondrion | bio | 9 | 9 | 0 / 9 | 1.2 / 4.9 / 4.2 | 1 / 60 / 38 | 6/9 | 8.1 |
| tooth | bio | 11 | 11 | 0 / 11 | 0.8 / 11.1 / 10.7 | 2 / 69 / 53 | 11/11 | 9.4 |
| earth-layers | earth | 13 | 13 | 2 / 13 | 0.4 / 4.3 / 1.3 | 0 / 102 / 12 | 10/13 | 11.3 |
| volcano | earth | 12 of 13 | 12 | 0 / 12 | 0.8 / 4 / 2.5 | 1 / 101 / 11 | 12/12 | 9.1 |
| ohms-law-circuit | physics | 0 | 0 | 0 / 0 | 0.1 / 1.9 / 1.9 | 0 / 2 / 2 | 0/0 | 5.8 |
| pulley-lever | physics | 3 | 3 | 1 / 3 | 1.6 / 2.8 / 2.7 | 0 / 12 / 6 | 3/3 | 7.1 |
| australia-states | map | 29 | 28 | 11 / 29 | 1 / 4.6 / 3.6 | 2 / 37 / 36 | 10/28 | 15.9 |
| solar-system | chart | 2 | 2 | 0 / 2 | 1.2 / 3.2 / 3.1 | 0 / 27 / 31 | 2/2 | 6.4 |
| plant-cell | stress | 24 | 24 | 0 / 24 | 2.7 / 7.8 / 5.7 | 2 / 18 / 9 | 17/24 | 12.8 |
| water-cycle-usgs | stress | 19 | 19 | 11 / 19 | 0.9 / 12.7 / 8 | 1 / 81 / 53 | 9/19 | 10.9 |
| skin-layers | stress | 23 | 19 | 17 / 23 | 1.9 / 8.4 / 5.6 | 0 / 60 / 25 | 4/19 | 12.3 |

Totals over 16 samples: print labels left as raised text 54 (TouchSight) vs 233 (edge tracing) of 233; short fragments 15 vs 763; short fragments vs text-erased tracing 15 vs 336; mean narrow-gap area 1.2% vs 6.4% (text-erased tracing 4.8%); braille labels with 3 mm clearance 140 of 228.

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
- **Braille clearance:** 140 of 228 placed labels (61%) keep ≥3 mm from all lines and textures. More labels and fuller outlines made this harder; it is the main open improvement. The remaining labels sit on knockouts or crowded areas. This is an open improvement area.
- **Coverage:**
  - OCR finds no labels on 3 samples (ohms-law-circuit: single-letter math symbols; pulley-lever: math symbols; solar-system: white rotated text on black). Those outputs contain outlines only.
  - Some in-figure labels on colored fills are missed (e.g. heart: Left/Right Atrium/Ventricle).
  - Some OCR text needs teacher correction ("Pulmonary ein", "Right Atriym").
- **Not validated with blind readers or TVIs, and no physical swell-paper print was tested.** The claims stay at "meets these automated checks".
