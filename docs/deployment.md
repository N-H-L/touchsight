# Deployment (GitHub Pages)

The site publishes on every push to `main` via `.github/workflows/pages.yml` using the official GitHub Pages deploy action.

## Published layout

The Pages site hosts **both** the documentation and the application:

- Documentation (MkDocs, Material theme) at `/`:
  [`https://mrhunsaker.github.io/touchsight-NG/`](https://mrhunsaker.github.io/touchsight-NG/)
- The application itself (the `src/` directory, with vendored libraries and models) at `/app/`:
  [`https://mrhunsaker.github.io/touchsight-NG/app/`](https://mrhunsaker.github.io/touchsight-NG/app/)

## Build steps

1. `npm ci --ignore-scripts`
2. `npm run vendor` - downloads OpenCV.js, Tesseract.js, transformers.js, ONNX Runtime Web, three.js, SlimSAM and PaddleOCR weights into generated directories
3. `rm -rf src/dev` - developer-only pages are excluded from the deployment
4. `pip install -r requirements-docs.txt` then `mkdocs build --site-dir _site`
5. Copy `src/` into `_site/app/`, add `.nojekyll`
6. Upload and deploy the artifact

## Adding documentation

Edit the Markdown files in `docs/` and, if needed, add the page to `nav` in `mkdocs.yml`. To preview:

```bash
pip install -r requirements-docs.txt
mkdocs serve     # http://localhost:8000
```

## Notes

- The app is entirely static after the vendor step; there is no server-side component to host.
- Models are fetched at build time from Hugging Face and a ModelScope mirror, then served from the site itself. End users never fetch from third parties at runtime (apart from the pinned, data-free OpenCV.js dev fallback).
