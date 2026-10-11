## Inspiration
Blind students learn from the same diagrams as everyone else, but only after a teacher redraws each one as a *tactile graphic*: print swapped for braille, clutter removed, lines spaced for fingers. One science assignment with graphics can take up to 10 hours to transcribe, and in a 2023 survey almost half of these teachers had never been trained to make tactile graphics. I wanted image AI to do the tedious first draft.

## What it does
Upload a labeled diagram or pick a sample. In 10–50 seconds TouchSight:
1. **Reads the labels** with PaddleOCR and repairs slips like "Leff Atrium" → "Left Atrium".
2. **Follows each leader line to the part it names,** even dotted ones.
3. **Segments that part with Segment Anything,** prompted at the leader's tip.
4. **Redraws the page for touch:** the original's lines with print removed, labeled parts' edges raised bold, and real braille labels with 3 mm clearance, following the BANA tactile guidelines.
5. **Checks itself** against those guidelines and lets the teacher fix any label.
6. **Exports** an SVG for swell paper, a braille key page, or an STL to 3D-print.

## How we built it
Everything runs in the browser: PaddleOCR on ONNX Runtime Web, SlimSAM through transformers.js in a web worker, OpenCV.js and three.js, hosted on GitHub Pages. No server, uploads or API bill, so it's free and private for schools. A Playwright harness scores the real app on 16 Wikimedia Commons diagrams after every change.

## Challenges we ran into
- Dotted and broken leader lines.
- Labels printed on the drawing with no leader.
- OCR on coloured fills: switching from Tesseract to PaddleOCR, with better label merging, raised recall from 85% to 98%.
- Making outlines look like the original yet stay readable by touch took several redesigns.
- Braille is about three times wider than print.

## Accomplishments that we're proud of
- 148 of 151 hand-counted labels found; 232 of 233 detected labels placed in braille.
- Plain edge tracing turns every print label into raised squiggles; TouchSight removes them and leaves 66 too-short fragments against 763.
- Segment Anything and OCR run in an ordinary browser, nothing to install.

## What we learned
Tactile design is mostly about what to leave out, and segmentation becomes useful when the diagram itself says where to look. Measuring every change on the same diagrams kept me honest.

## What's next for TouchSight
Testing with blind students, teachers and real swell paper; contracted braille; adding labels OCR missed; smarter placement so fewer keys are needed. Earlier research (UW's Tactile Graphics Assistant, 2007) replaced text with braille; TouchSight adds leader-to-part tracing and label-prompted segmentation.

**AI disclosure:** built with extensive help from Claude Code (Anthropic) for research, code and docs. The product uses only the open models listed, running locally.
