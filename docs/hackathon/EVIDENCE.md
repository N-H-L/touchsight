# EVIDENCE

This file records only claims backed by an actual test or measurement, with the commit or artifact that was checked.

| Date (SGT) | Claim | How verified | Commit/artifact |
|---|---|---|---|
| 2026-10-11 04:15 | RTX 4080 16 GB available; CUDA wheels exist for Python 3.14 | `nvidia-smi`; download.pytorch.org cu128 index | — |
| 2026-10-11 06:00 | OCR + leader tracing + SlimSAM run fully in-browser (headless Chromium, WASM, no GPU) | `node scripts/lab.mjs heart volcano` | 99cb32f |
| 2026-10-11 08:05 | Live site https://n-h-l.github.io/touchsight/ runs the heart sample end to end in a fresh headless Chromium: 19.2 s including model download | `BASE=https://n-h-l.github.io/touchsight node scripts/shot.mjs heart` | Pages run 38090885517 (commit 1a8c498) |
| 2026-10-11 08:00 | Guideline-check comparison on all 16 samples (table below) | `npm run serve` + `node scripts/eval.mjs` | 47c5fd5 (metrics unchanged by later UI-only edits) |
| 2026-10-11 07:40 | Re-run after in-figure-label fix, vocabulary OCR repair and phrase merge. Heart now 11 of 14 labels with correct leaders; "Right Atriym"→"Right Atrium" and "ein"→"vein" auto-corrected | `node scripts/lab.mjs heart volcano`, `npm run eval` | 51dc1b4 |
| 2026-10-11 08:20 | Merge control joins split OCR labels ("Pulmonary" + "Artery" → "Pulmonary Artery") | `node scripts/qa.mjs` | 47c5fd5 + baseline-display fix |

## Guideline-check evaluation (16 Wikimedia Commons diagrams), re-run 2026-10-11 ~07:40 SGT, commit 51dc1b4

Method: the real app runs in headless Chromium (WASM, no GPU) on each sample. The same checker (`app/js/check.js`) measures three things:
- TouchSight's layout
- **edge**: Canny edges of the original, scaled to the same Letter page and thickened to a 0.8 mm raisable line
- **edge−text**: the same tracing with every OCR-detected print label erased. This is a stronger baseline that isolates what label-guided segmentation and simplification add beyond deleting text.

"Run time" = OCR + SAM embedding + SAM part decoding, excluding first-load model download. "Labels found" shows "of N" where the true label count was hand-counted (heart 14, volcano 13).

| Sample | Cat. | Labels found | Braille labels | Print-label spots still marked (TS / edge) | Lines <3 mm, % of figure (TS / edge / edge−text) | Short fragments (TS / edge / edge−text) | Braille clear 3 mm | Run time (s) |
|---|---|---|---|---|---|---|---|---|
| animal-cell | bio | 20 | 20 | 0 / 20 | 1.7 / 5.3 / 4.2 | 2 / 52 / 46 | 12/20 | 9.9 |
| heart | bio | 11 of 14 | 11 | 2 / 11 | 2 / 8.6 / 7.2 | 0 / 4 / 0 | 11/11 | 8.2 |
| flower | bio | 16 | 16 | 0 / 16 | 0.8 / 5 / 3.8 | 0 / 20 / 0 | 10/16 | 8.5 |
| eye | bio | 18 | 18 | 6 / 18 | 2.6 / 8.8 / 6.3 | 1 / 13 / 3 | 15/18 | 10.5 |
| ear | bio | 13 | 13 | 4 / 13 | 1.2 / 9.3 / 6.4 | 1 / 105 / 6 | 11/13 | 8.1 |
| mitochondrion | bio | 8 | 8 | 0 / 8 | 0.7 / 4.9 / 4.2 | 0 / 60 / 36 | 8/8 | 6.7 |
| tooth | bio | 11 | 11 | 1 / 11 | 0.5 / 11.1 / 10.7 | 1 / 69 / 52 | 11/11 | 8.4 |
| earth-layers | earth | 12 | 12 | 1 / 12 | 0.8 / 4.3 / 1.4 | 0 / 102 / 5 | 9/12 | 7.8 |
| volcano | earth | 12 of 13 | 12 | 0 / 12 | 1.6 / 4 / 2.5 | 0 / 101 / 9 | 12/12 | 7.9 |
| ohms-law-circuit | physics | 0 | 0 | 0 / 0 | 0.4 / 1.9 / 1.9 | 0 / 2 / 2 | 0/0 | 4.9 |
| pulley-lever | physics | 0 | 0 | 0 / 0 | 0 / 2.8 / 2.8 | 0 / 12 / 12 | 0/0 | 4.9 |
| australia-states | map | 18 | 18 | 4 / 18 | 0.8 / 4.6 / 3.7 | 4 / 37 / 38 | 12/18 | 10.5 |
| solar-system | chart | 0 | 0 | 0 / 0 | 0 / 3.2 / 3.2 | 0 / 27 / 27 | 0/0 | 5.0 |
| plant-cell | stress | 20 | 20 | 2 / 20 | 0.8 / 7.8 / 5.6 | 1 / 18 / 10 | 17/20 | 10.1 |
| water-cycle-usgs | stress | 17 | 17 | 11 / 17 | 3.5 / 12.7 / 9.8 | 1 / 81 / 53 | 9/17 | 9.2 |
| skin-layers | stress | 18 | 18 | 13 / 18 | 4.3 / 8.4 / 6 | 0 / 60 / 30 | 13/18 | 9.8 |

Totals over 16 samples: print labels left as raised text 44 (TouchSight) vs 194 (edge tracing) of 194; short fragments 11 vs 763; short fragments vs text-erased tracing 11 vs 329; mean narrow-gap area 1.4% vs 6.4% (text-erased tracing 5.0%); braille labels with 3 mm clearance 150 of 194.

### Honest reading of these numbers
- **Print-label spots still covered by raised marks.** TouchSight never draws print text. Its non-zero counts are leader lines, outlines or textures that pass through where a print label used to be. The baseline count is real traced text.
- **Lines closer than 3 mm** is approximated with a morphological closing at 3 mm. It is a proxy for BANA's "3 mm between distinct lines", not a perfect measure.
- **Braille clearance:** 150 of 194 placed labels (77%) keep ≥3 mm from all lines and textures. The remaining labels sit on knockouts or crowded areas. This is an open improvement area.
- **Coverage:**
  - OCR finds no labels on 3 samples (ohms-law-circuit: single-letter math symbols; pulley-lever: math symbols; solar-system: white rotated text on black). Those outputs contain outlines only.
  - Some in-figure labels on colored fills are missed (e.g. heart: Left/Right Atrium/Ventricle).
  - Some OCR text needs teacher correction ("Pulmonary ein", "Right Atriym").
- **Not validated with blind readers or TVIs, and no physical swell-paper print was tested.** The claims stay at "meets these automated checks".
