# Submission kit: TouchSight

Live: https://n-h-l.github.io/touchsight/ · Repo: https://github.com/N-H-L/touchsight
**Deadline: Sun Oct 11, 11:59 PM EDT = Mon Oct 12, 11:59 AM SGT.** Aim to submit by Mon 9 AM SGT at the latest.

---

## Devpost fields

**Project name:** TouchSight

**Tagline (≤200 chars):** Turn any labeled textbook diagram into a tactile graphic with braille labels, in under a minute, entirely in your browser.

**Built with:** javascript, tesseract.js, segment-anything (slimsam), transformers.js, onnx-runtime-web, opencv.js, three.js, github-pages, playwright

**Try it out:**
- https://n-h-l.github.io/touchsight/
- https://github.com/N-H-L/touchsight

### Description (paste into "About the project"; under 500 words)

## Inspiration
Blind students learn biology from the same diagrams as everyone else, but only after a teacher redraws each one as a *tactile graphic*: clutter removed, print swapped for braille, lines at least 3 mm apart. A science assignment with graphics can take up to 10 hours to transcribe, and almost half of these teachers report no training in making tactile graphics. We wanted image AI to do the tedious 90% so teachers keep the judgement calls.

## What it does
Upload a labeled diagram or pick a sample. In 10–30 seconds TouchSight:
1. **Reads the diagram's own labels.** OCR, with slips like "Atriym" → "Atrium" repaired.
2. **Follows every leader line to the part it names.** This works even when the leader is dotted.
3. **Segments that part with Segment Anything,** using the leader tip as the prompt. This *label-guided simplification* keeps exactly what the author thought worth naming and drops shading and decoration.
4. **Lays out a page in real millimetres** following BANA tactile guidelines: bold outlines, at most 5 textures instead of colours, Spec-800 braille dots, letter keys when a word won't fit, and 3 mm clearance.
5. **Checks itself** with guideline measurements and lets the teacher fix any label.
6. **Exports** a pure-black SVG for swell paper, a braille key page, or an **STL to 3D-print**. A 3D relief view shows how it will feel.

## How we built it
Everything runs **in the browser**: Tesseract.js, SlimSAM via transformers.js/ONNX Runtime, OpenCV.js and three.js. There's no server, no uploads and no API bill, so it is free and private for schools. A Playwright harness scores the real app on 16 Wikimedia Commons diagrams.

## Results (same checker for every method)
- **Fragments too short to feel (<12.5 mm):** 11, vs 763 for edge tracing, or 329 for edge tracing with the print text erased first.
- **Figure area where lines crowd closer than 3 mm:** 1.4% vs 6.4%.
- **Labels:** every label found becomes braille, and 77% of them keep full 3 mm clearance.

## Challenges and lessons
- Dotted leader lines.
- Labels printed *on* the drawing.
- OCR on coloured fills.
- Braille being ~3× wider than print.

Tactile design is mostly about what to leave out, and segmentation becomes useful when the diagram itself says where to look.

## Limitations and what's next
These are automated checks, not a replacement for a qualified transcriber. We haven't yet tested with blind readers or on physical swell paper, and that comes next. Labels are uncontracted braille, and OCR misses some labels that can't be added by hand yet. Next: contracted UEB, click-to-add parts, and generative redraws of unlabeled photos.

**AI disclosure:** built with extensive help from Claude Code (Anthropic) for research, code and docs. The product itself uses only the open models listed, running locally.

---

## Video (≤3:00, aim for 2:30–2:50)

**Record:**
- Windows: **Win + Alt + R** (Xbox Game Bar) records the active window. Or use OBS.
- Use Chrome, full screen (F11), zoom 100%, on the live site.
- Run every sample once **before** recording so the models are cached and each run takes ~10–15 s.
- Record the voiceover separately if that's easier, then combine in Clipchamp (built into Windows).
- **Upload:** YouTube, visibility **Public**. Check that the length is under 3:00.

| Time | Screen | Say (roughly) |
|---|---|---|
| 0:00–0:15 | The original heart diagram (Original view) | "This is a heart diagram from a biology class. A blind student can't use it, until a teacher spends hours redrawing it by hand as a tactile graphic." |
| 0:15–0:30 | Empty state, then click **Try it on a heart diagram**; the spinner runs | "TouchSight does that first draft in seconds, entirely in the browser. Nothing is uploaded, so it's free and private for schools." |
| 0:30–0:55 | **What the AI saw** tab; hover labels 1→4 in the list so each part lights up | "First it reads the diagram's own labels. Then it follows every leader line to its tip, and uses that tip to prompt Segment Anything, so it segments exactly the parts the author named. In-figure labels like Right Atrium are handled too." |
| 0:55–1:20 | **Tactile graphic** tab; switch **Overlay** → **Tactile** | "Then it redraws for touch, following the braille authority's guidelines: bold outlines, textures instead of colours, real braille with letter keys when a word doesn't fit, and three millimetres of space so fingers can tell things apart." |
| 1:20–1:35 | Right rail: point at an auto-corrected label, then edit one label's text and show the braille updating | "OCR slips are fixed automatically, and the teacher stays in control: edit any label and the braille updates instantly." |
| 1:35–1:55 | **vs. edge tracing** tab, then the Guideline check table | "Compare with just tracing the picture: every word becomes raised blobs. Across 16 diagrams, TouchSight left 11 fragments too small to feel; tracing left 763." |
| 1:55–2:20 | **3D relief** tab, light sweeping; drag to tilt | "Here's how it will feel. The same file exports for swell paper, or as an STL to 3D print." |
| 2:20–2:35 | Click the **Volcano** sample, show its result quickly | "It works across biology and earth-science diagrams." |
| 2:35–2:50 | README or the Tactile view | "Next we want to test it with blind students and their teachers. TouchSight: diagrams everyone can read." |

---

## Your checklist (things only you can do)
1. [ ] Watch the live site once and tell Claude about anything wrong (optional).
2. [ ] Record the video with the script above. Upload to YouTube as **Public**. Copy the link.
3. [ ] Devpost: open the hackathon, then **Enter a submission / Create project**:
   - name, tagline, description (paste from above)
   - "Built with" tags
   - try-it links (live site + GitHub)
   - YouTube link
   - team: just you
4. [ ] Upload a thumbnail image. Claude can produce one: `eval-out/qa-heart-relief.png` or a fresh screenshot.
5. [ ] Answer any eligibility questions truthfully (age 18, student) and **Submit**. The rules say website submissions are "preferred", so also check bananahacks.tech for a submission form.
6. [ ] Tell Claude when it's submitted so the docs record it.
