# TouchSight

**Textbook diagram in, tactile graphic out.** TouchSight turns a labeled science diagram into a first-draft tactile graphic designed for swell paper, with braille labels, in under a minute. It runs entirely in the browser: no uploads, no accounts, no server.

**Live demo:** https://n-h-l.github.io/touchsight/ (desktop Chrome or Edge recommended; the first run downloads ~90 MB of models and takes ~20–30 s, later runs ~10–15 s)

Built solo for [Banana Hacks 2026](https://banana-hacks-1111.devpost.com/).

## The problem
Blind and low-vision students learn science from diagrams too. Each diagram has to be redrawn as a *tactile graphic* by a teacher of the visually impaired or a braille transcriber:
- remove clutter
- replace print with braille
- keep lines at least 3 mm apart so fingers can tell them apart
- use only a few distinguishable textures

A science assignment with graphics can take up to ~10 hours to transcribe. A 2023 survey found almost half of these teachers had no training in making tactile graphics. Tracing the picture automatically doesn't work: edge detection turns every print label into raised squiggles and every shading gradient into noise.

## What TouchSight does
1. **Reads the diagram's own labels.** PaddleOCR's text detector and recognizer run in the browser through ONNX Runtime, so they also catch small text and text printed on coloured fills. Tesseract is the fallback.
2. **Follows each leader line to the part it names.** It builds a thin-stroke mask, finds probabilistic Hough segments, assigns them to labels, and chains broken or dotted leaders.
3. **Segments that part.** The tip of each leader (or the area around an in-figure label) becomes a point prompt for **Segment Anything** (SlimSAM). This is *label-guided simplification*: the output keeps exactly the structures the diagram's author thought worth naming.
4. **Redraws the structure for touch.** The diagram's own outlines are traced: sharp boundaries between colour regions (shading gradients are ignored) plus thin drawn strokes. Lines closer than 3 mm are merged and thinned to one centreline, and fragments under 12.5 mm are dropped.
5. **Lays out a tactile page in millimetres,** following the BANA *Guidelines and Standards for Tactile Graphics* (2022):
   - a 1.5 mm silhouette, 1.0 mm part outlines, and 0.6 mm leader lines (always the thinnest line)
   - at most 5 textures, inset 1.5 mm from outlines
   - uncontracted UEB braille drawn as Spec 800 dots
   - full words where they fit, otherwise 2-letter keys on a key page (keys avoid aa/ac/cc/ca and contain dot 3 or 6)
   - 3 mm clearance around braille, with knockouts where a label must sit on the drawing
6. **Repairs OCR slips** (e.g. "Atriym" → "Atrium") against a small science vocabulary. This happens only for words OCR was unsure about, and every correction is shown to the teacher.
7. **Checks the result.** The same automated checks run on TouchSight's output and on naive edge tracing at the same page size.
8. **Lets the teacher fix it.** Edit OCR text, merge split labels, or remove labels. The layout updates instantly.
9. **Shows how it will feel.** A 3D relief view (three.js) renders raised lines and braille dots under a sweeping raking light. The same plate exports as an **STL for 3D printing**.
10. **Exports.** Tactile SVG (pure black, no greys, ready for swell paper), a key page, or print / save as PDF at true page size.

## Results (16 Wikimedia Commons diagrams, same checker for all)
| | TouchSight | Edge tracing | Edge tracing with print text erased |
|---|---|---|---|
| Label recall vs hand-counted labels (10 diagrams, 151 labels) | **148 of 151 (98%)** | n/a | n/a |
| Short fragments (< 12.5 mm, too small to identify by touch) | **14** | 763 | 336 |
| Mean figure area where lines are < 3 mm apart | **1.0%** | 6.4% | 4.8% |
| Braille labels with full 3 mm clearance | 172 of 231 (74%) | n/a | n/a |

Every detected label becomes braille, either as a full word or as a two-letter key. Per-diagram numbers, method and limitations are in [docs/hackathon/EVIDENCE.md](docs/hackathon/EVIDENCE.md) and [docs/hackathon/OCR_BENCH.md](docs/hackathon/OCR_BENCH.md). Reproduce with `npm run serve`, `npm run eval`, then `node scripts/recall.mjs`.

**Limitations.** These are automated checks derived from BANA guidelines, not a substitute for a qualified transcriber. TouchSight has not yet been tested with blind readers or printed on physical swell paper.
- Labels are uncontracted braille.
- Diagrams without print labels (or with only math symbols) get outlines only.
- OCR misses some text on busy fills. Teachers can fix wrong words, but cannot yet add a missed label.

## Why on-device
- **Free for schools:** no API bills.
- **Private:** school materials never leave the computer.
- **Easy to try:** judges and teachers can test it without an account.

The models are small enough (SlimSAM ~40 MB, Tesseract LSTM) to run on a laptop CPU: analysis takes about 8–10 s per diagram once the models are loaded.

## Run locally
```
npm ci
npm run vendor   # copies OpenCV.js, Tesseract.js, transformers.js, ONNX Runtime and SlimSAM weights into app/
npm run serve    # http://localhost:5173
npm run eval     # runs every sample in headless Chromium (needs: npx playwright install chromium)
```

## Code map
- `app/js/ocr.js`: words → lines → labels (multi-line labels merged unless each line owns a leader)
- `app/js/leaders.js`: leader-line detection and chaining
- `app/js/segment.js`: SlimSAM point prompts
- `app/js/pipeline.js`: analysis stage
- `app/js/tactile.js`: millimetre layout, textures, braille placement
- `app/js/braille.js`: UEB Grade 1 encoder and keys
- `app/js/render.js`: SVG
- `app/js/check.js`: guideline checker + Canny baseline
- `app/js/ui.js`: the app

## Credits
- **Models and libraries:**
  - [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) PP-OCRv6 detector + PP-OCRv5 English recognizer (Apache-2.0), via RapidOCR's ONNX conversions
  - [Tesseract.js](https://github.com/naptha/tesseract.js) (Apache-2.0) with the `eng` LSTM model (fallback)
  - [SlimSAM](https://huggingface.co/Xenova/slimsam-77-uniform) (Apache-2.0), a distilled [Segment Anything](https://segment-anything.com/)
  - [transformers.js](https://github.com/huggingface/transformers.js) (Apache-2.0) and ONNX Runtime Web (MIT)
  - [OpenCV.js](https://opencv.org/) (Apache-2.0)
  - [Atkinson Hyperlegible](https://www.brailleinstitute.org/freefont/) font by the Braille Institute (OFL), self-hosted
  - Playwright for evaluation
- **Standards:**
  - BANA *Guidelines and Standards for Tactile Graphics* (2022)
  - ICEB *Rules of Unified English Braille*
  - Library of Congress Spec 800 braille dimensions
  - See [docs/hackathon/TACTILE_SPEC.md](docs/hackathon/TACTILE_SPEC.md).
- **Sample diagrams:** Wikimedia Commons authors under public domain / CC0 / CC BY / CC BY-SA. Full attribution is in [app/samples/CREDITS.md](app/samples/CREDITS.md). Tactile versions of CC BY-SA diagrams are shared under the same license.
- **AI assistance:** this project was built with extensive help from **Claude Code** (Anthropic) for research, code and docs, as permitted by the event rules. The product itself uses only the open models listed above, running locally.

## License
Code: MIT. Sample images keep their original licenses.
