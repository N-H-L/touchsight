# EVIDENCE

This file records only claims backed by an actual test or measurement, with the commit or artifact that was checked.

| Date (SGT) | Claim | How verified | Commit/artifact |
|---|---|---|---|
| 2026-10-11 04:15 | RTX 4080 16 GB available; CUDA wheels exist for Python 3.14 | `nvidia-smi`; download.pytorch.org cu128 index | — |
| 2026-10-11 06:00 | OCR + leader tracing + SlimSAM run fully in-browser (headless Chromium, WASM, no GPU) | `node scripts/lab.mjs heart volcano` | 99cb32f |
| 2026-10-11 08:05 | Live site https://n-h-l.github.io/touchsight/ runs the heart sample end to end in a fresh headless Chromium: 19.2 s including model download | `BASE=https://n-h-l.github.io/touchsight node scripts/shot.mjs heart` | Pages run 38090885517 (commit 1a8c498) |
| 2026-10-11 08:00 | Guideline-check comparison on all 16 samples (table below) | `npm run serve` + `node scripts/eval.mjs` | 47c5fd5 (metrics unchanged by later UI-only edits) |
| 2026-10-11 08:20 | Merge control joins split OCR labels ("Pulmonary" + "Artery" → "Pulmonary Artery") | `node scripts/qa.mjs` | 47c5fd5 + baseline-display fix |

## Guideline-check evaluation (16 Wikimedia Commons diagrams)

Method: the real app runs in headless Chromium (WASM, no GPU) on each sample. The same checker (`app/js/check.js`) measures TouchSight's layout and a naive baseline: Canny edges of the original, scaled to the same Letter page and thickened to a 0.8 mm raisable line. "Run time" = OCR + SAM embedding + SAM part decoding, excluding first-load model download.

| Sample | Cat. | Labels found | Braille labels | Print text left (TS / edge) | Lines <3 mm, % of figure (TS / edge) | Short fragments (TS / edge) | Braille clear 3 mm | Run time (s) |
|---|---|---|---|---|---|---|---|---|
| animal-cell | bio | 20 | 20 | 1 / 20 | 1.8 / 5.3 | 1 / 52 | 13/20 | 8.6 |
| heart | bio | 12 | 12 | 0 / 12 | 1.9 / 8.6 | 0 / 4 | 11/12 | 7.5 |
| flower | bio | 16 | 16 | 0 / 16 | 0.9 / 5 | 1 / 20 | 12/16 | 7.4 |
| eye | bio | 20 | 20 | 6 / 20 | 2.6 / 8.8 | 5 / 13 | 13/20 | 9.1 |
| ear | bio | 13 | 13 | 0 / 13 | 1.6 / 9.3 | 1 / 105 | 10/13 | 7.3 |
| mitochondrion | bio | 8 | 8 | 0 / 8 | 0.7 / 4.9 | 1 / 60 | 7/8 | 6.3 |
| tooth | bio | 11 | 11 | 1 / 11 | 0.5 / 11.1 | 1 / 69 | 11/11 | 7.4 |
| earth-layers | earth | 12 | 12 | 1 / 12 | 0.9 / 4.3 | 0 / 102 | 9/12 | 7.0 |
| volcano | earth | 12 | 12 | 0 / 12 | 1.8 / 4 | 0 / 101 | 12/12 | 7.0 |
| ohms-law-circuit | physics | 0 | 0 | 0 / 0 | 0.4 / 1.9 | 0 / 2 | 0/0 | 4.7 |
| pulley-lever | physics | 0 | 0 | 0 / 0 | 0 / 2.8 | 0 / 12 | 0/0 | 4.8 |
| australia-states | map | 18 | 18 | 5 / 18 | 0.8 / 4.6 | 3 / 37 | 10/18 | 8.7 |
| solar-system | chart | 0 | 0 | 0 / 0 | 0 / 3.2 | 0 / 27 | 0/0 | 4.8 |
| plant-cell | stress | 20 | 20 | 1 / 20 | 0.9 / 7.8 | 1 / 18 | 15/20 | 8.6 |
| water-cycle-usgs | stress | 20 | 19 | 8 / 20 | 3.3 / 12.7 | 5 / 81 | 9/19 | 8.6 |
| skin-layers | stress | 23 | 23 | 13 / 23 | 4.7 / 8.4 | 1 / 60 | 12/23 | 10.4 |

Totals over 16 samples: print labels left as raised text 36 (TouchSight) vs 205 (edge tracing) of 205; short fragments 20 vs 763; mean narrow-gap area 1.4% vs 6.4%; braille labels with 3 mm clearance 144 of 204.

### Honest reading of these numbers
- **Print-label spots still covered by raised marks.** TouchSight never draws print text. Its non-zero counts are leader lines, outlines or textures that pass through where a print label used to be. The baseline count is real traced text.
- **Lines closer than 3 mm** is approximated with a morphological closing at 3 mm. It is a proxy for BANA's "3 mm between distinct lines", not a perfect measure.
- **Braille clearance:** 144 of 204 placed labels (71%) keep ≥3 mm from all lines and textures. The remaining labels sit on knockouts or crowded areas. This is an open improvement area.
- **Coverage:**
  - OCR finds no labels on 3 samples (ohms-law-circuit: single-letter math symbols; pulley-lever: math symbols; solar-system: white rotated text on black). Those outputs contain outlines only.
  - Some in-figure labels on colored fills are missed (e.g. heart: Left/Right Atrium/Ventricle).
  - Some OCR text needs teacher correction ("Pulmonary ein", "Right Atriym").
- **Not validated with blind readers or TVIs, and no physical swell-paper print was tested.** The claims stay at "meets these automated checks".
