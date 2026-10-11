# STATE

Updated: 2026-10-11 ~18:30 SGT.

**Hard deadline: Sun Oct 11 23:59 EDT = Mon Oct 12 11:59 SGT.** Internal target: submit by Mon 09:00 SGT.
Time check: `python -c "from datetime import *; n=datetime.now(timezone.utc); print(datetime(2026,10,12,3,59,tzinfo=timezone.utc)-n)"`. Git Bash's `TZ=` conversion is unreliable on this machine.

## Stage
Stage 2+: applying user feedback (received ~06:55 SGT). The live site is updated continuously.

## User feedback (06:55 SGT) and status
- [x] Smoother site + loading icon: full-screen app shell, braille-dot spinner overlay, page responsive (SAM runs in a worker)
- [x] No blank spaces: 3-column app filling the viewport; empty state in the centre; "How it works" on the right until a result exists
- [x] Grey pill behind labels on screen (white pill knockout in the print version, since grey would swell on capsule paper)
- [x] Wrong leader (Right Atrium): in-figure labels now get no leader (the earlier fix had silently not applied)
- [x] "Spots" explained: pattern legend card + Tactile / Overlay / Original view switch
- [x] Review fixes: vocabulary OCR repair, phrase merge, numbered outline analysis view, text-erased baseline, label recall, honest README, self-hosted font

## Feedback round 2 (user ~08:00 SGT: "buggy, outlines not distinct, many missing labels"), done by ~13:10 SGT
- [x] PaddleOCR det+rec in the browser (subagent, merged). Label recall went from 85% to 98% (148/151 hand-counted). Tesseract is the lazy fallback.
- [x] Outlines rebuilt from the diagram's own lines + colour boundaries, merged at 3 mm, thinned to centrelines, 12.5 mm minimum. Short fragments: 15 vs 336 (text-erased tracing).
- [x] Column-aware multi-line label merging + vocabulary.
- [x] Live verified (heart: 14/14 labels).
- Note: sessions crashed repeatedly (~4 h lost). Commit after every step.

## Feedback round 3 (user: heart interior "random patterns", "trace the outlines, don't recreate")
- [x] New outline tracer app/js/lineart.js: k-means colour regions -> sharp-step boundaries only (shading dropped) + thin dark/saturated strokes; text erased, short strokes dropped. Dev harness: scripts/la.mjs + app/dev/la.html; scripts/tsvg.mjs renders the page large.
- [x] Textures snap to colour regions and are OFF by default (checkbox to enable).
- [x] Eval: clearance 172/231 (74%), fragments 14, narrow gap 1.0%, recall 148/151. Live verified.

## Feedback round 4 (user preferred the faithful edge-traced look, plus braille)
- [x] Outline style option: Detailed (default) = Canny edges, text + leaders erased, specks <4 mm dropped, 0.8 mm lines; Simplified = lineart.js tracer with 3 mm merge. Eval for both in EVIDENCE/README. Live verified.

## Stage 3 finish (11 Oct ~16:10-18:30 SGT)
- [x] Devpost rechecked 16:10 SGT: no updates; deadline Oct 12 12:00am EDT; 497 participants.
- [x] Independent judge review (subagent). Fixed: SAM now shapes the default output (bold named-part edges); "Leff Atrium" phrase repair; no green ticks on empty pages; no-label hint; docs reconciled; sources, prior work and three.js credit added; precomputed licence note; write-up 467 words.
- [x] Not fixed (accepted): many 2-letter keys on dense diagrams; Detailed has more close lines than Simplified (documented).
- [x] Edge-case QA on live (scripts/edge.mjs): all pass, 0 page errors.
- [x] Video: C:/Users/Admin/Videos/touchsight-demo.mp4 (2:10, 1080p, captions, waits shortened and disclosed), made with scripts/record.mjs + ffmpeg (imageio-ffmpeg in the scratch venv).
- [x] Thumbnail: docs/hackathon/thumbnail.png. Pitch notes: docs/hackathon/PITCH.md.

## Next actions
1. User: watch the video, upload it to YouTube as Public, then submit on Devpost (SUBMISSION.md checklist) by Mon 09:00 SGT (hard deadline 11:59).
2. After submission: record the Devpost URL here.

## Commands
- `npm run vendor`: fetch runtimes + models into app/ (gitignored)
- `npm run serve`: local server on :5173
- `node scripts/shot.mjs <id> [tab]`: screenshot the real app (BASE= for live)
- `node scripts/qa.mjs`: interaction QA
- `npm run eval`: full evaluation → eval-out/eval.md + app/precomputed/*.svg

- `node scripts/recall.mjs`: label recall vs app/samples/labels_truth.json (run after eval)
