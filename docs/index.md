# TouchSight-NG

**Textbook diagram in, tactile graphic out.** TouchSight-NG turns a labeled science diagram into a first-draft tactile graphic designed for swell paper, with braille labels. The application runs locally in the browser: no uploads, no accounts, no application server. GitHub Pages hosts this documentation only; it does not host the application.

TouchSight-NG is a working tool in daily use by a braille transcriber, not a demo. It began as a hackathon build and is now maintained and refined against real transcription work: preparing science and geography diagrams for students who read by touch.

## Who it is for

- **Braille transcribers and teachers of the visually impaired (TVIs)** who need first drafts of tactile graphics that follow the BANA *Guidelines and Standards for Tactile Graphics* (2022).
- **Educators** who want material ready for review and final cleanup rather than a blank starting point.
- **Anyone** producing tactile diagrams who prefers a private, offline-capable tool.

## Why it exists

Each textbook diagram has to be redrawn by hand as a *tactile graphic*: clutter removed, print replaced with braille, lines spaced at least 3 mm apart so fingers can tell them apart, only a few distinguishable textures. A science assignment with graphics can take up to 10 hours to transcribe ([Jordan School District, 2024](https://jam.jordandistrict.org/2024/10/03/transcription-services-for-the-visually-impaired/)), and a 2023 survey found almost half of the teachers making tactile graphics had never been trained to do so ([British Journal of Visual Impairment](https://experts.arizona.edu/en/publications/creating-tactile-graphics-in-school-settings-a-survey-of-training/)).

Naive tracing does not work: edge detection turns every printed label into raised squiggles and every shading gradient into noise. TouchSight-NG reads the labels, follows the leader lines, segments the parts the labels name, and redraws the result for touch.

## What it produces

- A **tactile page in millimetres** with a bold/fine line hierarchy, optional textures, and UEB Grade 1 (uncontracted) braille labels
- A **key page** when labels do not fit in full braille
- A **3D relief preview** of how the page will feel, plus an **STL export** for 3D printing
- A **tactile SVG** (pure black, no greys) ready for swell paper, or print / PDF at true page size
- An automated **guideline check**, shown side by side with a naive edge-tracing baseline

In evaluation on 16 Wikimedia Commons diagrams, TouchSight-NG found 148 of 151 hand-counted labels (98%), placed all but 1 of 233 detected labels in braille, and left 66 fragments below the 12.5 mm touch threshold versus 763 for plain edge tracing. See [Evaluation and benchmarks](evaluation.md).

## Learn the theory and technology

- [Architecture](architecture.md): why the system combines OCR, geometric computer vision, and segmentation.
- [Pipeline stages](pipeline.md): how each stage works and how errors propagate.
- [Models and inference engines](models-and-engines.md): the exact OCR and segmentation model files, runtime libraries, and their purposes.
- [Advanced AI model options](advanced-model-options.md): larger models that could improve grounding, segmentation, and diagram reasoning. These are research options, not implemented features.

## Where to go next

- [Getting started](getting-started.md): run the tool and produce your first page.
- [The teacher review workflow](review-workflow.md): fixing labels, merging, removing.
- [Printing and swell paper](printing.md): from SVG to fuser.
- [Pipeline stages](pipeline.md) and [Architecture](architecture.md): how it works inside.
- [Models and inference engines](models-and-engines.md): downloaded assets and model responsibilities.
- [Advanced model options](advanced-model-options.md): future research directions, not currently implemented.
- [Contributing](contributing.md) if you want to help.

## Status and honest limits

These are automated checks derived from BANA guidelines, not a substitute for a qualified transcriber. TouchSight-NG has not yet been formally tested with blind readers or printed on physical swell paper. Labels are uncontracted UEB. Diagrams without printed labels (or with only math symbols) get outlines only. OCR misses some text on busy fills; the teacher can edit wrong words but cannot yet add a missed label.
