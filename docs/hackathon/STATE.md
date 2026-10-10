# STATE

Updated: 2026-10-11 08:45 SGT (Sat Oct 10 20:45 EDT)

**Hard deadline: Sun Oct 11 23:59 EDT = Mon Oct 12 11:59 SGT.** Internal target: submit by Mon 09:00 SGT.
Time check: `python -c "from datetime import *; n=datetime.now(timezone.utc); print(datetime(2026,10,12,3,59,tzinfo=timezone.utc)-n)"`. Git Bash's `TZ=` conversion is unreliable on this machine.

## Stage
**Stage 2: checkpoint 2.** A working product is live and waiting for the user's review.

## Decisions / approvals
- Idea: TouchSight (user, 04:30 SGT).
- Eligibility: the user is 18, enrolled, and registered on Devpost.
- Public repo https://github.com/N-H-L/touchsight is authorized and created. GitHub Pages is deployed via Actions.
- Hosting: static in-browser app so the user's PC can stay off. All models are vendored (no runtime CDN, except the Google Font).
- Commits use the user's git identity from global config (N-H-L, school email).

## Live
- App: https://n-h-l.github.io/touchsight/ (deep link `?sample=heart`)
- Verified live at 08:05 SGT (EVIDENCE.md).

## Done (M0–M3)
- Pipeline:
  - OCR (2-pass) → leader tracing → SlimSAM parts → mm layout (BANA params) → UEB Grade 1 braille + keys → SVG
  - checker vs Canny baseline
- UI:
  - samples, upload, progress steps
  - 4 tabs (tactile / what the AI saw / vs edge tracing / key page)
  - label editor (edit / merge / remove)
  - exports (SVG, key, print/PDF)
  - precomputed fallback
- Eval on 16 samples is in EVIDENCE.md. README has full credits.

## Next actions (after user feedback)
1. Apply the user's feedback.
2. Fixes from the skeptical-judge review (subagent running at 08:45).
3. Improve braille clearance (71% → higher), e.g. try more candidate positions and shorter keys.
4. Optional wow feature (3D relief preview / audio description) if time allows.
5. Devpost write-up (≤500 words) + video script + shot list → user records the video (target Sun evening SGT).
6. Submit by Mon 09:00 SGT. Requires the user: YouTube upload + Devpost submit.

## Skeptical-judge review (subagent, 08:50 SGT): queued fixes, in priority order
1. ~~The baseline renders as faint wisps~~: already fixed in commit after 47c5fd5 (reviewer saw an older deploy). Still to add an Original | Tactile toggle/slider on the Tactile tab.
2. OCR typos reach the braille ("Right Atriym", "Pulmonary ein"). Snap labels to a small science vocabulary (Levenshtein ≤2), and auto-merge stacked lines that share a leader.
3. Add an ablation without SAM (silhouette + braille only) to the eval, so the metrics show what the AI adds. The baseline's 0 braille labels is a strawman.
4. "What the AI saw" tab: draw mask contours, not fills, with numbered badges matching the list. Make the label list taller.
5. Honest claims:
   - README "~10 s" → "~20–30 s first run, ~10 s after load"; make the 90 vs 100 MB figures consistent.
   - "204 of 205" → report against hand-counted labels (label recall).
   - Soften "swell-paper-ready" to "designed for swell paper", and mention the 71% clearance next to the BANA claim.
   - Self-host the font, or drop the "no network" claim.
6. Instant precomputed preview for samples while the live run continues.
7. Wow feature (reviewer and Claude both recommend): 3D relief view + STL export (three.js), ~2–3 h. Fallback: tap-to-speak labels (~1 h).
- Demo samples: volcano (best) and heart (fix "Right Atriym" live on camera). Avoid flower, eye, animal-cell, skin-layers, and water-cycle.

## Commands
- `npm run vendor`: fetch runtimes + models into app/ (gitignored)
- `npm run serve`: local server on :5173
- `node scripts/shot.mjs <id> [tab]`: screenshot the real app (BASE= for live)
- `node scripts/qa.mjs`: interaction QA
- `npm run eval`: full evaluation → eval-out/eval.md + app/precomputed/*.svg
