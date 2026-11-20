# TouchSight-NG

**Textbook diagram in, tactile graphic out.** TouchSight-NG turns a labeled science diagram into a first-draft tactile graphic designed for swell paper, with braille labels, in under a minute. It runs entirely in the browser: no uploads, no accounts, no server.

This is a working, maintained tool in daily use by a braille transcriber, not a hackathon demo. It was prototyped at a hackathon and has since been reworked and hardened against real transcription work: preparing science and geography diagrams for students who read by touch, and iterating on the pipeline whenever a real diagram exposes a rough edge.

- **Live app:** https://mrhunsaker.github.io/touchsight-NG/app/
- **Documentation:** https://mrhunsaker.github.io/touchsight-NG/ (built from [docs/](docs/index.md))

## The problem

Blind and low-vision students learn science from diagrams too. Each diagram has to be redrawn as a *tactile graphic*: clutter removed, print replaced with braille, lines at least 3 mm apart so fingers can tell them apart, only a few distinguishable textures. A science assignment with graphics can take up to 10 hours to transcribe ([Jordan School District, 2024](https://jam.jordandistrict.org/2024/10/03/transcription-services-for-the-visually-impaired/)), and a 2023 survey found almost half of the teachers making tactile graphics had never been trained to do so ([British Journal of Visual Impairment](https://experts.arizona.edu/en/publications/creating-tactile-graphics-in-school-settings-a-survey-of-training/)).

Tracing the picture automatically does not work: edge detection turns every printed label into raised squiggles and every shading gradient into noise. TouchSight-NG reads the labels and leader lines first, segments the parts the labels name, and only then redraws the structure for touch.

## What it does

1. **Reads the diagram's own labels.** PaddleOCR's detector and recognizer run in the browser through ONNX Runtime; Tesseract is the fallback.
2. **Follows each leader line to the part it names**, including broken and dotted leaders.
3. **Segments that part** with SlimSAM (a distilled Segment Anything) prompted by the leader tips.
4. **Redraws the structure for touch** in a Detailed or Simplified outline style, with a label-guided line hierarchy (bold 1.5 mm edges for named parts, fine 0.8 mm detail).
5. **Lays out a tactile page in millimetres** per the BANA *Guidelines and Standards for Tactile Graphics* (2022): textures (at most 5), uncontracted UEB braille to Spec 800 dot dimensions, full words or two-letter keys on a key page, 3 mm clearance around braille.
6. **Repairs OCR slips** (`Atriym` to `Atrium`, `Leff Atrium` to `Left Atrium`) against a science vocabulary, with every correction shown to the teacher.
7. **Checks the result** with automated BANA-derived checks, side by side with an edge-tracing baseline.
8. **Lets the teacher fix it.** Edit, merge or remove labels; the layout updates instantly.
9. **Shows how it will feel.** A 3D relief view under raking light, plus an STL export for 3D printing.
10. **Exports.** Tactile SVG (pure black, ready for swell paper), key page, or print / PDF at true page size.

Full walkthroughs live in the [documentation](docs/index.md): [getting started](docs/getting-started.md), [review workflow](docs/review-workflow.md), [printing](docs/printing.md), [architecture](docs/architecture.md), [pipeline](docs/pipeline.md), [guidelines](docs/guidelines.md), [module reference](docs/modules.md), [evaluation](docs/evaluation.md), [deployment](docs/deployment.md).

## Results (16 Wikimedia Commons diagrams, same checker throughout)

| Metric | Detailed (default) | Simplified | Edge tracing | Edge tracing, text erased |
|---|---|---|---|---|
| Label recall vs hand-counted labels (10 diagrams, 151 labels) | **148 of 151 (98%)** | same | n/a | n/a |
| Labels placed in braille | **all but 1 of 233** | same | none | none |
| Print text traced as raised marks | **none** | none | all 233 labels | none |
| Short fragments (< 12.5 mm) | 66 | **14** | 763 | 336 |
| Mean figure area where lines < 3 mm apart | 3.5% | **1.0%** | 6.4% | 4.8% |
| Braille labels with full 3 mm clearance | 165 of 232 (71%) | 172 of 231 (74%) | n/a | n/a |

Method, per-diagram numbers and reproduction steps are in [docs/evaluation.md](docs/evaluation.md).

**Limitations.** These are automated checks derived from BANA guidelines, not a substitute for a qualified transcriber. Not yet formally tested with blind readers or printed on physical swell paper. Labels are uncontracted braille. Diagrams without printed labels (or only math symbols) get outlines only. OCR misses some text on busy fills; teachers can fix wrong words but cannot yet add a missed label.

## Why on-device

- **Free for schools:** no API bills.
- **Private:** school materials never leave the computer.
- **Easy to try:** no account; open the URL and run a sample.

The models are small enough (PaddleOCR ~18 MB, SlimSAM ~40 MB) to run on a laptop CPU through WebAssembly. Measured on a desktop (i9-14900KF, Chrome headless): 10-30 s per diagram once the models are cached.

## Run locally

```bash
npm ci
npm run vendor   # fetches OpenCV.js, Tesseract.js, transformers.js, ONNX Runtime, three.js, SlimSAM and PaddleOCR weights into generated dirs
npm run serve    # http://localhost:5173
npm run eval     # runs every sample in headless Chromium (needs: npx playwright install chromium)
```

## Code map

```
src/           the application: index.html, css/, js/ (the pipeline modules), samples/, precomputed/
scripts/       Node.js tooling: vendor, dev server, Playwright evaluation and QA harnesses
docs/          MkDocs documentation, published to GitHub Pages
```

Key modules under `src/js/`: `paddle.js` (PaddleOCR on ONNX Runtime), `ocr.js` (labels), `leaders.js` (leader lines), `segment.js` (SlimSAM), `lineart.js` (Simplified tracing), `tactile.js` (millimetre layout), `braille.js` (UEB Grade 1), `render.js` (SVG), `check.js` (BANA-derived checker + Canny baseline), `relief.js` (3D relief + STL), `ui.js` (the app). Details in [docs/modules.md](docs/modules.md).

## Contributing

Contributions are welcome, especially from anyone using TouchSight-NG in real transcription work: what broke, what was slow, what the checks missed. See [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_STYLE.md](CODE_STYLE.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), [SECURITY.md](SECURITY.md), and [CHANGES.md](CHANGES.md) for recent changes.

## Credits

- **Models and libraries:**
  - [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) PP-OCRv6 detector + PP-OCRv5 English recognizer (Apache-2.0), via RapidOCR's ONNX conversions
  - [Tesseract.js](https://github.com/naptha/tesseract.js) (Apache-2.0) with the `eng` LSTM model (fallback)
  - [SlimSAM](https://huggingface.co/Xenova/slimsam-77-uniform) (Apache-2.0), a distilled [Segment Anything](https://segment-anything.com/)
  - [transformers.js](https://github.com/huggingface/transformers.js) (Apache-2.0) and ONNX Runtime Web (MIT)
  - [OpenCV.js](https://opencv.org/) (Apache-2.0)
  - [three.js](https://threejs.org/) (MIT) for the 3D relief view
  - [Atkinson Hyperlegible](https://www.brailleinstitute.org/freefont/) font by the Braille Institute (OFL), self-hosted
  - [ESM Potrace](https://github.com/tomayac/esm-potrace-wasm) (GPL 2)
  - Playwright for evaluation
- **Standards:** BANA *Guidelines and Standards for Tactile Graphics* (2022); ICEB *Rules of Unified English Braille*; Library of Congress Spec 800 braille dimensions. See [docs/guidelines.md](docs/guidelines.md).

## Prior work

The University of Washington [Tactile Graphics Assistant](https://tactilegraphics.cs.washington.edu/) (Jayant et al., ASSETS 2007) automated text removal and braille replacement for textbook figures. TouchSight-NG adds leader-line tracing to the part each label names, Segment Anything prompted by those leaders, and BANA-derived layout and checks, all in the browser.

## License

Code: GPL 3.0. Sample images keep their original licenses; the precomputed SVGs in `src/precomputed/` keep their source diagram's license (see the note there).
