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

### Description (paste into "About the project"; about 450 words)

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

---

## Video (ready): `C:\Users\Admin\Videos\touchsight-demo.mp4`
- 2:10, 1920×1080, H.264, no audio (captions on screen). It is a real screen capture of the live site (recorded by `scripts/record.mjs` with headless Chromium). The only edits: captions/title cards are overlaid, and three processing waits are shortened. On-screen captions say "processing shortened".
- Optional: add your own voice in Clipchamp (Windows) by reading the captions. Not required.
- Upload to YouTube with visibility **Public** (not Unlisted, not Private).

**YouTube title:** TouchSight: textbook diagrams to tactile graphics with braille (Banana Hacks 2026)

**YouTube description (paste):**
TouchSight turns a labeled science diagram into a first-draft tactile graphic with braille labels, entirely in the browser (PaddleOCR + Segment Anything + OpenCV.js + three.js). Built solo for Banana Hacks 2026.
Live demo: https://n-h-l.github.io/touchsight/
Code: https://github.com/N-H-L/touchsight
Real screen capture of the live site; processing waits shortened. Built with help from Claude Code (AI disclosure).
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
