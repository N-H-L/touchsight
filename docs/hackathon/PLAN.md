# PLAN — TouchSight

The user approved this direction on 2026-10-11 ~04:30 SGT ("touchsight is good"). The user is eligible (18, enrolled, registered on Devpost). The public repo under N-H-L is authorized. The user asked to avoid leaving their PC on, so it will be a fully static, in-browser app on GitHub Pages.

## Product contract
- **User:** a teacher of visually impaired students (TVI) or a braille transcriber who must turn a printed textbook diagram into a tactile graphic.
- **Problem:** manual tactile graphics take hours per figure. Label placement alone is ~23% of the time even with automated tools. Many TVIs have no training in making tactile graphics. See IDEAS.md for sources.
- **Journey:**
  1. Open the site.
  2. Upload or pick a diagram.
  3. In about 10–30 s TouchSight shows: detected labels → the parts they point to → a tactile layout (simplified outlines, textures, braille labels, braille key).
  4. The teacher fixes OCR text, removes a part, or re-runs.
  5. The teacher downloads a print-ready SVG/PDF for swell paper and a key page, and sees a guideline check report.
- **Target award:** the $500 top project. Secondary: Best Creative Tool.
- **Distinctive capability:** *label-guided simplification*:
  1. OCR finds the print labels.
  2. Leader-line tracing finds what each label points to.
  3. Segment Anything extracts those parts.
  4. Only the meaningful structure is kept, then re-labeled in UEB braille with collision-aware placement, at BANA physical sizes.
- **Baseline:** naive edge detection (Canny) at the same physical scale, which is what a non-specialist would get from "trace the image". Both go through the same automated BANA-derived rule checker.
- **Acceptance criteria:**
  - All processing is on-device. There are no network calls except loading the site and its models.
  - On ≥6 of the demo diagrams it produces an SVG that is (a) free of print text, (b) braille-labeled with a key, and (c) scored by the checker.
  - The output beats the baseline on the checker metrics.
  - The live URL works in desktop Chrome and Edge without a GPU.
  - The demo path takes <60 s per diagram on a laptop CPU.
- **In scope:** labeled science diagrams (bio, earth science, simple physics, maps).
- **Optional:** 3D relief STL, an audio description, click-to-add parts.
- **Future:** contracted UEB (liblouis), unlabeled photos (generative redraw), multi-page splitting, embosser formats (PIAF/Tiger), user testing with TVIs.

## Architecture (all client-side, static)
- `app/js/libs.js` loads the engines:
  - OpenCV.js (geometry)
  - Tesseract.js (OCR)
  - transformers.js + SlimSAM (segmentation)
  - All assets are vendored into `app/vendor` and `app/models` by `scripts/vendor.mjs`, with no CDNs at runtime.
- Pipeline modules:
  - `ocr.js`: words → lines → labels
  - `leaders.js`: thin-stroke mask → Hough segments → leader assignment and chaining
  - `segment.js`: SAM point prompts
  - `tactile.js`: simplification, textures, layout at mm scale
  - `braille.js`: UEB Grade 1
  - `place.js`: label placement
  - `render.js`: SVG
  - `check.js`: rule checker
- UI: `app/index.html` + `app/js/ui.js`.
- **Why on-device:** zero cost for schools, privacy for school materials, judges can test without accounts, and the user's PC doesn't need to stay on.
- **Eval:** `scripts/eval.mjs` (Playwright headless Chromium) runs the real browser pipeline on `app/samples/*` and writes `eval-out/` metrics. Results are recorded in EVIDENCE.md.
- **Deploy:** a GitHub Actions workflow runs `npm ci && npm run vendor` and publishes `app/` to GitHub Pages.

## Milestones (SGT, Sun Oct 11 → Mon Oct 12)
| # | Target | Output | Status |
|---|---|---|---|
| M0 | 06:00 | Feasibility: OCR + leaders + SAM in headless Chromium, ~10 s/diagram | DONE |
| M1 | 09:30 | Tactile renderer v1: SVG with outlines, textures, braille labels, key | |
| M2 | 11:30 | Rule checker + Canny baseline + eval over the samples | |
| M3 | 14:00 | Polished UI, public repo, Pages deploy → **checkpoint 2 for user review** | |
| M4 | 18:00 | Fixes from feedback, edit tools, PDF/print, README, write-up draft | |
| M5 | 21:00 | Video script + shot list. User records the video (their evening) | |
| M6 | Mon 09:00 | **Submitted** (buffer to the 11:59 hard deadline) | |

## Cut order (first to cut)
1. 3D STL
2. Audio description
3. Click-to-add parts
4. PDF export (SVG prints fine)
5. Texture variety beyond 3

Never cut: the live URL, braille labels + key, the checker vs baseline, README credits.

## Demo sequence (video ≤3 min)
1. Problem: hours per figure, and why it matters.
2. Upload the heart diagram.
3. Watch the stages: labels found → leader tips → parts.
4. Tactile output with braille.
5. Side-by-side with edge detection, with the checker scores.
6. Download for swell paper.
7. Privacy and cost: runs offline in the browser.
8. Limits and next steps.

Fallback: precomputed results are shipped for the samples, in case a judge's browser cannot run the models.
