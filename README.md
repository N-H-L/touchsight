# TouchSight

**Textbook diagram in, tactile graphic out.** TouchSight turns a labeled science diagram into a swell-paper-ready tactile graphic with braille labels, in under a minute. It runs entirely in the browser: no uploads, no accounts, no server.

**Live demo:** https://n-h-l.github.io/touchsight/ (desktop Chrome or Edge recommended; the first run downloads ~90 MB of models, which are cached afterwards)

Built solo for [Banana Hacks 2026](https://banana-hacks-1111.devpost.com/).

## The problem
Blind and low-vision students learn science from diagrams too. Each diagram has to be redrawn as a *tactile graphic* by a teacher of the visually impaired or a braille transcriber:
- remove clutter
- replace print with braille
- keep lines at least 3 mm apart so fingers can tell them apart
- use only a few distinguishable textures

A science assignment with graphics can take up to ~10 hours to transcribe. A 2023 survey found almost half of these teachers had no training in making tactile graphics. Tracing the picture automatically doesn't work: edge detection turns every print label into raised squiggles and every shading gradient into noise.

## What TouchSight does
1. **Reads the diagram's own labels.** Tesseract OCR runs twice, once on the original and once on a locally binarized copy, so it also catches text printed on colored fills.
2. **Follows each leader line to the part it names.** It builds a thin-stroke mask, finds probabilistic Hough segments, assigns them to labels, and chains broken or dotted leaders.
3. **Segments that part.** The tip of each leader (or the area around an in-figure label) becomes a point prompt for **Segment Anything** (SlimSAM). This is *label-guided simplification*: the output keeps exactly the structures the diagram's author thought worth naming.
4. **Lays out a tactile page in millimetres,** following the BANA *Guidelines and Standards for Tactile Graphics* (2022):
   - a 1.5 mm silhouette, 1.0 mm part outlines, and 0.6 mm leader lines (always the thinnest line)
   - at most 5 textures, inset 1.5 mm from outlines
   - uncontracted UEB braille drawn as Spec 800 dots
   - full words where they fit, otherwise 2-letter keys on a key page (keys avoid aa/ac/cc/ca and contain dot 3 or 6)
   - 3 mm clearance around braille, with knockouts where a label must sit on the drawing
5. **Checks the result.** The same automated checks run on TouchSight's output and on naive edge tracing at the same page size.
6. **Lets the teacher fix it.** Edit OCR text, merge split labels, or remove labels. The layout updates instantly.
7. **Exports.** Tactile SVG (pure black, no greys, ready for swell paper), a key page, or print / save as PDF at true page size.

## Results (16 Wikimedia Commons diagrams, same checker for both)
| | TouchSight | Edge tracing |
|---|---|---|
| Labels available in braille | 204 of 205 | 0 of 205 |
| Short fragments (< 12.5 mm, too small to identify by touch) | 20 | 763 |
| Mean figure area where lines are < 3 mm apart | 1.4% | 6.4% |
| Braille labels with full 3 mm clearance | 144 of 204 | n/a |

Per-diagram numbers, method and limitations are in [docs/hackathon/EVIDENCE.md](docs/hackathon/EVIDENCE.md). Reproduce with `npm run serve` and `npm run eval`.

**Limitations.** These are automated checks, not a substitute for a qualified transcriber. TouchSight has not yet been tested with blind readers or on physical swell paper.
- Labels are uncontracted braille.
- Diagrams without print labels, or with math-symbol labels, get outlines only.
- OCR misses some text on busy fills.

## Why on-device
- **Free for schools:** no API bills.
- **Private:** school materials never leave the computer.
- **Easy to try:** judges and teachers can test it without an account.

The models are small enough (SlimSAM ~40 MB, Tesseract LSTM) to run on a laptop CPU in about 10 seconds per diagram.

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
  - [Tesseract.js](https://github.com/naptha/tesseract.js) (Apache-2.0) with the `eng` LSTM model
  - [SlimSAM](https://huggingface.co/Xenova/slimsam-77-uniform) (Apache-2.0), a distilled [Segment Anything](https://segment-anything.com/)
  - [transformers.js](https://github.com/huggingface/transformers.js) (Apache-2.0) and ONNX Runtime Web (MIT)
  - [OpenCV.js](https://opencv.org/) (Apache-2.0)
  - [Atkinson Hyperlegible](https://www.brailleinstitute.org/freefont/) font by the Braille Institute (OFL)
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
