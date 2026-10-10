# STATE

Updated: 2026-10-11 07:50 SGT (Sat Oct 10 19:50 EDT). Earlier timestamps in this file were estimates and ran ~1.5 h fast.

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

## Next actions
1. 3D relief preview + STL export (three.js), new tab. Cut if it is not working by ~11:00 SGT.
2. Devpost write-up (≤500 words, docs/hackathon/SUBMISSION.md) + video script/shot list.
3. Final QA on the live site; re-run eval if the pipeline changes.
4. The user records the video, uploads it to YouTube (public), and submits on Devpost. Target: Sun evening SGT. Hard deadline Mon 11:59 SGT.

## Commands
- `npm run vendor`: fetch runtimes + models into app/ (gitignored)
- `npm run serve`: local server on :5173
- `node scripts/shot.mjs <id> [tab]`: screenshot the real app (BASE= for live)
- `node scripts/qa.mjs`: interaction QA
- `npm run eval`: full evaluation → eval-out/eval.md + app/precomputed/*.svg
