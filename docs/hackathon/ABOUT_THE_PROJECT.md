## Inspiration
Blind students learn from the same diagrams as everyone else, but only after a teacher or transcriber redraws each one as a *tactile graphic*: print swapped for braille, clutter removed, lines far enough apart for fingers. A science assignment with graphics can take up to 10 hours to transcribe, and in a 2023 survey almost half of these teachers had never been trained to make tactile graphics. I wanted image AI to do the tedious first draft so teachers keep the judgement calls.

## What it does
Upload a labeled diagram or pick a sample. In about 10–50 seconds TouchSight:
1. **Reads the labels** with PaddleOCR in the browser and repairs slips like "Leff Atrium" → "Left Atrium".
2. **Follows each leader line to the part it names,** even dotted ones.
3. **Segments that part with Segment Anything,** prompted at the leader's tip.
4. **Redraws the page for touch:** traces the original's lines with the print removed, raises the edges of every labeled part bold so readers can find what was named, and lays out real braille (Spec 800 dot sizes, letter keys when a word won't fit, 3 mm clearance) following the BANA tactile guidelines.
5. **Checks itself** against those guidelines and lets the teacher fix any label.
6. **Exports** a pure-black SVG for swell paper, a braille key page, or an STL to 3D-print, with a 3D relief preview.

## How we built it
Everything runs in the browser: PaddleOCR on ONNX Runtime Web, SlimSAM through transformers.js in a web worker, OpenCV.js for leader tracing and layout, and three.js for the relief view. There's no server, no uploads and no API bill, so it's free and private for schools. It's hosted on GitHub Pages. A Playwright harness runs the real app on 16 Wikimedia Commons diagrams and scores every change.

## Challenges we ran into
- Dotted and broken leader lines: chaining short line segments back into one leader.
- Labels printed on the drawing itself, with no leader: prompting Segment Anything around the text instead.
- OCR on coloured fills: switching from Tesseract to PaddleOCR, plus better multi-line label merging, raised label recall from 85% to 98%.
- Making the outline look like the original while staying readable by touch took several redesigns.
- Braille is about three times wider than print, so long labels need letter keys and careful placement.

## Accomplishments that we're proud of
- 148 of 151 hand-counted labels found (98%) on 10 diagrams, and 232 of 233 detected labels placed as braille.
- Plain edge tracing turns all 233 print labels into raised squiggles. TouchSight removes them and leaves 66 fragments too short to feel, against 763.
- The whole pipeline, Segment Anything included, runs in an ordinary browser with nothing to install.

## What we learned
Tactile design is mostly about what to leave out, and segmentation becomes useful when the diagram itself says where to look. Measuring every change against the same set of diagrams stopped me from fooling myself.

## What's next for TouchSight
Next comes testing with blind students, their teachers and real swell paper. I also want contracted braille, a way to add a label that OCR missed, and smarter label placement so fewer keys are needed. Earlier research (UW's Tactile Graphics Assistant, 2007) replaced text with braille; TouchSight adds leader-to-part tracing and label-prompted segmentation.

**AI disclosure:** built with extensive help from Claude Code (Anthropic) for research, code and docs. The product itself uses only the open models listed, running locally.
