## Inspiration
Blind students learn from the same diagrams as everyone else, but only after a teacher or transcriber redraws each one as a *tactile graphic*: print swapped for braille, clutter removed, lines far enough apart for fingers. A science assignment with graphics can take up to 10 hours to transcribe, and in a 2023 survey almost half of these teachers had never been trained to make tactile graphics. I wanted image AI to do the tedious first draft so teachers keep the judgement calls.

## What it does
Upload a labeled diagram or pick a sample. In about 10–50 seconds TouchSight:
1. **Reads the labels** with PaddleOCR running in the browser (148 of 151 hand-counted labels found on 10 diagrams) and repairs slips like "Leff Atrium" → "Left Atrium".
2. **Follows each leader line to the part it names,** even dotted ones.
3. **Segments that part with Segment Anything,** prompted at the leader's tip.
4. **Redraws the page for touch:** traces the original's lines with the print text removed, raises the edges of every *labeled* part bold so readers can find what was named, and lays out real braille (Spec 800 dot sizes, letter keys when a word won't fit, 3 mm clearance) following the BANA tactile guidelines. A Simplified style merges lines closer than 3 mm.
5. **Checks itself** against those guidelines and lets the teacher fix any label.
6. **Exports** a pure-black SVG for swell paper, a braille key page, or an STL to 3D-print. A 3D relief view shows how it will feel.

## How I built it
Everything runs **in the browser**: PaddleOCR on ONNX Runtime Web, SlimSAM through transformers.js in a worker, OpenCV.js and three.js. No server, uploads or API bill, so it is free and private for schools. A Playwright harness scores the real app on 16 Wikimedia Commons diagrams.

## Results (same checker for every method)
- Plain edge tracing turns all 233 print labels into raised squiggles; TouchSight removes them and places 232 as braille.
- Fragments too short to feel: 66 (Detailed) or 14 (Simplified), vs 763 for edge tracing and 336 for edge tracing with text erased.

## Challenges
Dotted leaders, labels printed on the drawing, OCR on coloured fills, and braille being about three times wider than print.

## Limitations and next steps
These are automated checks, not a qualified transcriber. It has not been tested with blind readers or on physical swell paper; that comes next. Braille is uncontracted, and a label OCR misses can't be added by hand yet. Prior work (UW's Tactile Graphics Assistant, 2007) replaced text with braille; TouchSight adds leader-to-part tracing and label-prompted segmentation.

**AI disclosure:** built with extensive help from Claude Code (Anthropic) for research, code and docs. The product itself uses only the open models listed, running locally.
