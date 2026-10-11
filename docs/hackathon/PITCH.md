# Pitch and ownership notes (for you, not for submission)

## The 30-second version (say it in your own words)
"Blind students learn science from the same diagrams as everyone else, but a teacher has to redraw each one by hand as a raised-line tactile graphic, and one assignment can take up to 10 hours. TouchSight does the first draft in the browser: it reads the diagram's labels, follows each label's line to the part it names, uses Segment Anything to find that part, and lays out a page with braille labels following the official tactile-graphics guidelines. The teacher checks it, fixes any label, and prints it on swell paper or 3D-prints it."

## What you should be able to explain
| Topic | Plain answer |
|---|---|
| **Who is it for?** | Teachers of blind students and braille transcribers. Students get the result. |
| **What problem?** | Redrawing diagrams by hand is slow. Plain edge tracing doesn't work: words become bumps, and there's no braille. |
| **The core workflow** | Upload or pick a diagram → OCR reads the labels → leader lines are traced → Segment Anything segments each named part → the page is laid out in millimetres with braille → guideline checks → teacher review → export (SVG, key page, STL). |
| **Where the image AI is** | PaddleOCR (text detection + recognition) and Segment Anything (SlimSAM). SAM's masks decide which lines become **bold**: the edges of the parts the labels name. The textures option also uses them, and the "What the AI saw" tab shows them. |
| **Why in the browser?** | Free for schools (no API bill), private (school materials stay on the computer), and judges can try it without an account. Cost: the first run downloads ~90 MB, and each diagram takes 10–50 s. |
| **Two outline styles** | Detailed (default) looks like the original. Simplified merges lines closer than 3 mm, which is stricter for fingers. You chose Detailed as the default after comparing them. |
| **Strongest evidence** | On 16 Wikimedia diagrams: 148 of 151 hand-counted labels found (98%); 232 of 233 detected labels placed in braille; 66 too-short fragments vs 763 for plain edge tracing (14 in Simplified). |
| **Honest limits** | Not tested with blind readers or on real swell paper. Braille is uncontracted (Grade 1). A label OCR misses can't be added by hand yet. Busy diagrams use many 2-letter keys. |
| **What you decided** | The idea (TouchSight, out of the shortlist), solo entry, hosting as a static site so your PC doesn't stay on, the UI feedback (smoother site, loading spinner, grey label pills, fix the Right Atrium leader), the outline direction (trace the original faithfully, then the Detailed style as default), and textures off by default. |
| **What Claude Code did** | Research, the code, the evaluation scripts, the docs and the captioned video recording, all directed and reviewed by you. This is disclosed in the README and the write-up. |

## Likely judge questions
1. **"Isn't this just OCR plus edge detection?"** The edges come from the original, but the AI decides what matters. Labels are read and their leader lines followed to the exact part, then SAM segments that part, and those edges are raised bold. The labels become positioned braille with keys and clearance. The "What the AI saw" tab shows each label, its leader and its mask.
2. **"Why not just use a vision-language model?"** It would need a server and an API bill, and it can't return millimetre-accurate geometry. Small specialised models run free and privately in the browser.
3. **"How do you know it's good?"** A Playwright harness runs the real app on 16 diagrams and measures the same guideline checks for TouchSight and for edge tracing. Label recall is checked against 151 hand-counted labels. It's in EVIDENCE.md, and anyone can reproduce it with `npm run eval`.
4. **"Has a blind person used it?"** Not yet. That's the next step, and the docs say so.
5. **"What's hard technically?"** Dotted leader lines (chaining broken Hough segments), labels printed on the drawing (no leader, so prompt SAM around the text), OCR on coloured fills (switched from Tesseract to PaddleOCR: 85% → 98% recall), and fitting braille, which is about three times wider than print.
6. **"Prior work?"** UW's Tactile Graphics Assistant (2007) did text-to-braille replacement for figures. TouchSight adds leader-to-part tracing, label-prompted segmentation and BANA-based checks, all in a browser.
7. **"Why 3 mm / 12.5 mm?"** Those numbers come from the BANA tactile-graphics guidelines (TACTILE_SPEC.md): fingers can't separate lines closer than about 3 mm, and very short lines aren't recognisable.
8. **"What would you do next?"** Test with teachers and students, contracted braille, click-to-add a missed label, and smarter label placement (margin columns) to reduce keys.

## Rehearsal questions for you (answer out loud before recording or a live demo)
1. In one sentence, who is TouchSight for, and what does it save them?
2. If a judge asks what Segment Anything does in TouchSight, what do you say?
3. What's the difference between Detailed and Simplified, and why is Detailed the default?
4. Name one real limitation, without being defensive.
5. A judge's diagram has no labels. What happens? (Answer: outlines only, with a message saying no printed labels were found.)
