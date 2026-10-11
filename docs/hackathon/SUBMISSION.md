# Submission kit: TouchSight

Live: https://n-h-l.github.io/touchsight/ · Repo: https://github.com/N-H-L/touchsight
**Deadline: Sun Oct 11, 11:59 PM EDT = Mon Oct 12, 11:59 AM SGT.** Aim to submit by Mon 9 AM SGT at the latest.

---

## Devpost fields

**Project name:** TouchSight

**Tagline (≤200 chars):** Turn any labeled textbook diagram into a tactile graphic with braille labels, in under a minute, entirely in your browser.

**Built with:** javascript, paddleocr, onnx-runtime-web, segment-anything (slimsam), transformers.js, opencv.js, three.js, tesseract.js, github-pages, playwright

**Try it out:**
- https://n-h-l.github.io/touchsight/
- https://github.com/N-H-L/touchsight

### Description (paste into "About the project"; Devpost template headings; under 500 words; also in ABOUT_THE_PROJECT.md)

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

---

## Video (ready): `C:\Users\Admin\Videos\touchsight-demo.mp4`
- 2:10, 1920×1080, H.264, no audio (captions on screen). It is a real screen capture of the live site (recorded by `scripts/record.mjs` with headless Chromium). The only edits: captions/title cards are overlaid, and three processing waits are shortened. On-screen captions say "processing shortened".
- **You chose to record your own voiceover version: follow [VIDEO_SCRIPT.md](VIDEO_SCRIPT.md).** The captioned video is the backup.
- Upload to YouTube with visibility **Public** (not Unlisted, not Private).

**YouTube title:** TouchSight: textbook diagrams to tactile graphics with braille (Banana Hacks 2026)

**YouTube description (paste):**
TouchSight turns a labeled science diagram into a first-draft tactile graphic with braille labels, entirely in the browser (PaddleOCR + Segment Anything + OpenCV.js + three.js). Built solo for Banana Hacks 2026.
Live demo: https://n-h-l.github.io/touchsight/
Code: https://github.com/N-H-L/touchsight
Screen recording of the live site. Built with help from Claude Code (AI disclosure).
Diagrams: "Diagram of the human heart" by Wapcaplet (CC BY-SA 3.0) and the volcano diagram from Wikimedia Commons; full credits in app/samples/CREDITS.md in the repo.

| Time (approx.) | Scene |
|---|---|
| 0:00–0:15 | Title card, then the problem card (10-hour transcription, sources) |
| 0:15–0:30 | Empty state, then the heart sample runs (loading steps visible) |
| 0:30–0:45 | Original vs Tactile; caption explains the bold edges of named parts while labels are hovered |
| 0:45–1:00 | Overlay; "What the AI saw" with segmented parts |
| 1:00–1:12 | Auto-corrected "Leff Atrium" → "Left Atrium"; editing a label updates the braille |
| 1:12–1:30 | vs. edge tracing; Guideline check; Key page |
| 1:30–1:40 | 3D relief under raking light (SVG / STL export) |
| 1:40–1:50 | Volcano sample |
| 1:50–2:10 | "How it was built" card (inspiration, design, resources), then the results card with limitations and links |

**Thumbnail:** `docs/hackathon/thumbnail.png` (1500×1000). The heart is by Wapcaplet (CC BY-SA 3.0).

---

## Your checklist (things only you can do)
1. [ ] Watch `C:\Users\Admin\Videos\touchsight-demo.mp4` once.
2. [ ] Upload it to YouTube as **Public**, using the title and description above. Copy the link.
3. [ ] Devpost: open https://banana-hacks-1111.devpost.com/ and use **Join hackathon / Enter a submission**:
   - name **TouchSight**, the tagline, "Built with" tags
   - description: paste everything from "## Inspiration" to the AI disclosure
   - links: live site + GitHub
   - YouTube link
   - thumbnail `docs/hackathon/thumbnail.png`
   - team: just you
4. [ ] Answer the eligibility questions truthfully (18, enrolled student) and press **Submit** before **Mon 12 Oct, 11:59 SGT** (aim for 09:00).
5. [ ] Check Discord / bananahacks.tech for any separate submission form, and use the same text if there is one.
6. [ ] Tell Claude when it's submitted.
