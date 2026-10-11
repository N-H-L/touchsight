## Inspiration
Blind and low-vision students learn biology, chemistry and earth science from the same diagrams as everyone else. They can only use a diagram after a teacher of the visually impaired or a braille transcriber redraws it by hand as a **tactile graphic**: a raised-line version printed on swell paper or embossed, where the print labels are replaced with braille, clutter is removed, and lines are kept at least 3 mm apart so fingers can tell them apart.

It's slow, skilled work. One school district estimates that a science assignment with graphics can take **up to 10 hours** to transcribe, and in a 2023 survey **almost half** of these teachers said they had never been trained to make tactile graphics at all. Simply tracing the picture doesn't work either: an edge detector turns every printed word into a raised squiggle and has no braille.

The theme was image AI, and I wanted it to do something that matters. TouchSight makes the tedious first draft automatically, so the teacher only has to check and adjust it.

## What it does
You upload a labeled diagram (or pick one of the samples) and, in about 10–50 seconds, TouchSight:

1. **Reads the diagram's own labels.** PaddleOCR detects and recognises the printed text, including small text and text on coloured fills. A science vocabulary repairs common OCR slips (for example "Leff Atrium" → "Left Atrium"), and every correction is shown to the teacher.
2. **Follows each leader line to the part it names.** It finds the thin pointer lines, matches each to its label, and joins dotted or broken lines into one.
3. **Segments that part with Segment Anything.** The tip of each leader becomes the prompt, so the model segments exactly the structure the diagram's author chose to label. Labels printed directly on a part are handled by prompting around the text.
4. **Redraws the page for touch.** It traces the original's lines with all print text and old leaders removed. The edges of every labeled part are raised **bold**, so a reader can find the named structures, and other detail stays as finer lines. A *Simplified* style can also merge lines closer than 3 mm.
5. **Lays out real braille.** Labels become uncontracted UEB braille at true Spec 800 dot sizes, laid out in millimetres following the BANA *Guidelines and Standards for Tactile Graphics*: 3 mm clearance, redrawn leader lines, and two-letter keys (listed on a separate key page) when a word doesn't fit.
6. **Checks itself.** A guideline panel measures print left on the page, braille clearance, lines that are too close, and fragments too short to feel, side by side with plain edge tracing.
7. **Lets the teacher stay in control.** Any label can be edited, merged or removed, and the page updates instantly.
8. **Exports and previews.** It exports a pure-black SVG ready for swell paper, a braille key page, or an **STL to 3D-print**. A 3D relief view under a moving light shows how the page will feel.

## How we built it
- **Everything runs in the browser.** PaddleOCR (PP-OCR detector and recognizer) runs on ONNX Runtime Web. SlimSAM, a distilled Segment Anything, runs through transformers.js in a web worker so the page stays responsive. OpenCV.js does leader detection (thin-stroke mask, Hough line segments, chaining) and the image processing. three.js powers the 3D relief and STL export.
- **No server.** There's no backend, no uploads and no API bill, so it's free and private for schools, and judges can try it without an account. It's a static site on GitHub Pages.
- **Rules from a standard.** The layout parameters (line widths, 3 mm clearance, 12.5 mm minimum line length, braille dot sizes) come from the BANA tactile graphics guidelines and the braille dot specification.
- **Measured, not eyeballed.** A Playwright harness runs the real app headlessly on 16 Wikimedia Commons diagrams across biology, earth science, physics and maps. It records every guideline metric for TouchSight and for plain edge tracing, and label recall against 151 hand-counted labels.

## Challenges we ran into
- **Dotted and broken leader lines.** Line detection returns many short pieces, so they had to be chained back into one line and matched to the right label.
- **Labels printed on the drawing.** Text like "Right Atrium" sits on the part itself with no leader, so the app detects in-figure labels and prompts Segment Anything around the text instead.
- **OCR on coloured backgrounds.** Tesseract missed much of the text on coloured fills. Switching to PaddleOCR, plus smarter merging of two-line labels, raised label recall from 85% to 98%.
- **Outlines that look right.** My first outline tracer redrew parts from AI masks, and the result looked blobby and unlike the original. After several redesigns, the default traces the original's own lines and uses the AI masks to decide which edges are bold.
- **Braille takes space.** Braille is about three times wider than print, so long labels need keys and careful placement to keep 3 mm clearance.

## Accomplishments that we're proud of
- **148 of 151** hand-counted labels found (98%) across 10 diagrams, and **232 of 233** detected labels placed as braille.
- Plain edge tracing turns all 233 print labels into raised squiggles. TouchSight removes them and leaves **66** fragments too short to feel, against **763** for plain tracing (14 in the Simplified style).
- Segment Anything, OCR and the full layout run in an ordinary browser, with nothing to install.
- A working end-to-end tool, from photo to swell paper or 3D print, built solo in one weekend.

## What we learned
- Tactile design is mostly about what to leave out. A good tactile graphic is not a copy of the picture.
- Segmentation becomes useful when the diagram itself tells you where to look; leader lines turned out to be the perfect prompts.
- Running every change against the same set of diagrams stopped me from fooling myself about what was actually better.

## What's next for TouchSight
- Testing with blind students and their teachers, and printing on real swell paper. Nothing here has been validated with blind readers yet, and that comes first.
- Contracted (Grade 2) braille, and a way to add a label that OCR missed.
- Smarter label placement, such as margin columns, so fewer labels need keys.
- Earlier research, the University of Washington's Tactile Graphics Assistant (2007), replaced text in figures with braille. TouchSight builds on that idea with leader-to-part tracing, label-prompted segmentation and guideline checks, all in the browser.

**AI disclosure:** TouchSight was built with extensive help from Claude Code (Anthropic) for research, code and documentation. The product itself uses only the open models listed above, running locally in the browser.
