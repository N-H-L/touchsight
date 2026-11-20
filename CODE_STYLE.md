# Code Style

TouchSight-NG is a browser-first, dependency-light ES module codebase. Follow the style of the existing files.

## Language and modules

- Plain modern JavaScript (ES2022). No build step, no bundler, no TypeScript; static pages + ES modules only.
- One module per concern under `src/js/`. Each module imports only what it needs and keeps DOM touchpoints out of pure-logic modules (`tactile.js`, `braille.js`, `check.js` are DOM-free; `ui.js` owns the DOM).
- Shared constants live next to their consumer or in a dedicated module (see `tracing-config.js`).

## Formatting

- **No semicolons** at statement ends (the codebase avoids line starts that would need leading semicolons).
- **Single quotes** for strings; template literals for interpolation.
- **2-space indentation**, LF line endings, UTF-8, final newline.
- Maximum line length is loosely ~100 characters; prefer breaking after commas and ?/: in ternaries.

## Naming

- `camelCase` for functions/variables, `PascalCase` for classes and module-level singletons, `UPPER_SNAKE_CASE` for constants (`DET_THRESH`, `REC_H`).
- Names describe the domain (label, leader, mask, layout, plate), not the implementation.

## Comments

- Comments explain **why**, not what: thresholds with their provenance (BANA, Spec 800), non-obvious algorithms (DB unclip, CTC decode, mask-selection heuristic), browser quirks (OpenCV thenable, asyncify WASM), and units (millimetres vs pixels) are all worth a comment.
- A short header comment at the top of each module summarizing its role is the norm.

## Errors and robustness

- Fail fast on invalid input with descriptive errors (`throw new Error('...')`).
- Lazy singletons for engine loading (`xPromise ??= (async () => ...)`) and explicit cleanup of OpenCV `Mat` objects (`mat.delete()`) to avoid WASM leaks.
- No `console.log` in application code; `console.warn/error` is acceptable for degradation paths.

## UI and accessibility

- Interactive elements need labels and ARIA attributes; status changes flow through `#status` and `aria-live` regions.
- Preview-only cosmetics (grey label pills) must never affect the exported SVG: exports stay pure black.

## Testing

- Anything that changes tracing, segmentation or layout must run through the Playwright harnesses: `npm run eval`, then `node scripts/recall.mjs`; include before/after numbers in the PR.
- Keep evaluation scripts hittable: `scripts/qa.mjs`, `scripts/edge.mjs` for interaction and edge cases.

## Documentation

- User-facing behaviour changes update the relevant page in `docs/` (pipeline, guidelines, module reference, evaluation).
- Changelog entries in `CHANGES.md` follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
