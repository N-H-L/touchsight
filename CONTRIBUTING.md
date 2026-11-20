# Contributing to TouchSight-NG

Thanks for helping make tactile graphics faster to produce. This project is maintained alongside real transcription work, so contributions that reflect actual use are especially valuable: diagrams the pipeline fails on, checks that miss real problems, exports that misprint.

## Reporting issues

- **Bugs:** open an issue with the diagram (or link to an equivalent), the browser and OS, and the status text the app showed. Console errors help too.
- **Accessibility feedback:** if you teach or transcribe and something does not work for your workflow, that is a bug. File it.
- **Feature requests:** describe the transcription task, not just the feature.

Please search existing issues before opening a new one.

## Development setup

```bash
npm ci
npm run vendor   # downloads browser builds and model weights (generated dirs, not committed)
npx playwright install chromium   # for the evaluation harness
npm run serve    # http://localhost:5173
```

## Before opening a pull request

1. **Score the change.** If it touches OCR, leader tracing, segmentation, layout or checking, run:
   ```bash
   npm run serve &
   npm run eval
   node scripts/recall.mjs
   ```
   and include the before/after numbers in the PR description.
2. **Follow the style** in [CODE_STYLE.md](CODE_STYLE.md) (no semicolons, single quotes, 2-space indent, why-comments, DOM-free logic modules).
3. **Update docs** in `docs/` when behaviour changes, and add a `CHANGES.md` entry under a new `Unreleased` heading if the change is user-visible.
4. Keep PRs focused: one behaviour or fix per PR.

## Pull request process

- Fork, create a topical branch (`fix/leader-chain`, `feat/stl-scale`), commit with clear messages.
- Open the PR against `main` with a short description and, where useful, screenshots (tactile view, relief view) or evaluation output.
- New sample diagrams are welcome if their license permits redistribution; include the credit in `src/samples/CREDITS.md`.

## Licensing

By contributing, you agree that your contributions are licensed under the GPL-3.0-or-later (the repository's license).

## Questions

Open a discussion or an issue; for private matters (including security), see [SECURITY.md](SECURITY.md).
