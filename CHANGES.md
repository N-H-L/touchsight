# Changelog

All notable changes to TouchSight-NG are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses calendar-style versions (`YYYY.M.D-stage`).

## [Unreleased]

### Added
- Optional Indra OCR engine (Datalab, v1.1.0): detector and recognizer ONNX
  models vendored from the official Hugging Face repository (pinned commit)
  and run in the browser on onnxruntime-web. Opt-in via a "Use Indra OCR"
  checkbox; on error or empty output the pipeline falls back to PaddleOCR
  and then Tesseract, so the default behavior is unchanged.
- `src/js/indra.js`: the engine port (DB text detection, batched CTC
  recognition, load-time input-shape probing, documented detector channel
  order and vocabulary handling).
- `docs/ocr-engines.md`: engine chain documentation, port architecture,
  validation recipe against the `indra-ocr` Python reference, and licensing
  notes; plus cross-references throughout the documentation and a changelog
  entry.

## [2026.11.20-beta] - 2026-11-20

### Added
- `docs/`: MkDocs (Material) documentation covering the tool for transcribers, the pipeline, the BANA-derived layout rules, the module reference, the evaluation harness and deployment. Published at the GitHub Pages root, with the app at `/app/`.
- Community files: `CONTRIBUTING.md`, `CODE_STYLE.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, pull request and issue templates.
- `.github/workflows/pages.yml` now publishes the documentation site at `/` and the app at `/app/`.
- One-time restructure workflow that renames `app/` to `src/` and updates all path references.

### Changed
- Repository layout: the application moves from `app/` to `src/` so the repository and the Pages site are cleaner; scripts (serve, vendor, eval, recall, thumb) and `.gitignore` updated accordingly.
- README rewritten to reflect TouchSight-NG as a maintained, in-use tool by a transcriber rather than a hackathon entry.
- `package.json` homepage corrected to `https://mrhunsaker.github.io/touchsight-NG/`.

## [2026.11.20] - 2026-11-20

### Added
- PaddleOCR (text detector + English recognizer) on ONNX Runtime Web as the primary OCR, with Tesseract as fallback.
- Leader-line tracing and chaining; SlimSAM point-prompted segmentation per labeled part.
- Label-guided line hierarchy in the Detailed outline style (bold named-part edges, fine detail).
- Simplified outline style with BANA 3 mm spacing, centreline thinning and short-fragment removal.
- Millimetre layout: textures (max 5), UEB Grade 1 braille at Spec 800 dot dimensions, two-letter keys with key page, 3 mm braille clearance with knockouts.
- OCR slip repair against a science vocabulary, always shown to the teacher.
- Guideline checker measuring print-text traces, short fragments, narrow-gap area and braille clearance, with a Canny edge-tracing baseline.
- 3D relief preview (three.js) with STL export for 3D printing.
- Playwright evaluation harness (`npm run eval`, `scripts/recall.mjs`, `scripts/ocrbench.mjs`) over 16 Wikimedia Commons sample diagrams.

### Notes
- Results snapshot in the README (98% label recall, all but 1 of 233 labels placed in braille, 66 short fragments vs 763 for edge tracing).
- Not yet formally tested with blind readers or printed on physical swell paper.
