# Ideas, precedents, and the recommendation

Written 2026-10-11 ~04:45 SGT. Rules: BRIEF.md. Raw scrape of 139 winners from ~15 major 2024–25 hackathons: scratchpad `precedents/winners.txt` (session-local).

## 1. Precedents (verified Devpost "Winner" badges, checked by subagent)

| Project | Event / prize | Hook |
|---|---|---|
| CoCo — devpost.com/software/coco-5r8sft | HackPrinceton S25, Best Game | Gesture-drawn sketch → Gemini illustration → narrated storyboard. Sketch-first, so the human stays the author. |
| Aros — devpost.com/software/aros-prove-your-images-are-real | TreeHacks 24, ZK prize ($5k) | Secure-Enclave-signed photos + ZK verification (anti-deepfake) |
| U-Plan — devpost.com/software/u-plan | HackHarvard 24, Sustainability | SAM on satellite imagery → heat-island planning |
| AuToTeX — devpost.com/software/autotex | BostonHacks 24, small track prize | Handwritten math → LaTeX. Mostly a VLM wrapper. |
| The Kick is Good — devpost.com/software/the-kick-is-good | HackGT 12, PrizePicks | Classical CV: homography + tracking → 3D ball path |
| Hall of Us — devpost.com/software/hall-of-us | HackGT 12, 2nd in track | Auto-tagged photos → MR museum |
| SynapseAI — devpost.com/software/synapseai | TreeHacks 25, Chroma prize | EEG → real-time generated visuals |
| Tarazoo — devpost.com/software/tarazoo | Hack the North 25, Shopify | Camera checkout + optimizer backend |

- There are no previous Banana Hacks editions; this is the first.
- Google's Nano Banana 48h challenge (Kaggle, Sept 2025) was judged mainly on the video. Individual winners could not be retrieved.
- **Documented:** the prize names and the authors' problem statements. **No judge reasons are published** for any of these.
- **Inference (survivorship bias applies):**
  - The winners pair a specific user with one non-obvious engineering hook.
  - Pure image-generation apps rarely win the top prize.
  - Image AI tends to win as a component of a real workflow.
- **Overused, so avoid:**
  - recycling/trash classifiers
  - outfit stylists
  - fridge→recipe
  - camera narrators for blind users (Iris, VisionNav, BrowseBlind)
  - sign-language translators
  - plant-disease or calorie apps
  - AI headshots or storybooks
  - "redesign my room"
  - deepfake classifiers
  - prompt wrappers

## 2. Tools and costs (Oct 2026)
- **Gemini image API (Nano Banana family):** no free API tier. About $0.03–0.15 per image. `gemini-2.5-flash-image` was shut down Oct 2, 2026. Source: ai.google.dev/gemini-api/docs/pricing.
- **fal.ai:** paid. Nano Banana costs ~$0.04/image. **HF Inference:** no free credits.
- **Local RTX 4080 (16 GB) runs these for free:** SAM 2, Florence-2, Depth-Anything, CLIP/DINOv2, SDXL/Flux-schnell (quantized), Qwen-VL 7B (4-bit), and LoRA/classifier training. → **Prefer a local-GPU pipeline: free, and real engineering rather than a wrapper.**
- **Rosebud AI:** a sponsor logo only. No challenge or prize.

## 3. Shortlist

### Idea 1 — TouchSight: textbook diagram → print-ready tactile graphic (RECOMMENDED)
- **User / pain.** Teachers of visually impaired students (TVIs) and braille transcribers. A science assignment with graphics can take up to ~10 h to transcribe (Jordan School District memo). Manual tactile graphics take hours per figure. Label placement alone is ~23% of the time even with automated tools. Almost half of the TVIs in a 2023 survey had no training in making tactile graphics. Today they redraw by hand in Illustrator/CorelDraw or use a pre-made library.
- **Workflow.** Photo or scan of a diagram → the pipeline finds the meaningful structures and printed labels, removes clutter and print text, simplifies and thickens lines to tactile minimums, assigns distinct textures, and replaces the labels with **braille** labels or a braille key placed without collisions → outputs a swell-paper/embosser-ready SVG, a 3D-printable relief STL, a key page, and a rule-check report.
- **Image AI core:**
  - OCR plus label/leader-line detection (Florence-2)
  - segmentation (SAM 2) guided by the diagram's own labels
  - VLM decides essential vs decorative parts
  - optional fine-tuned "tactile style" model
  - Without the image AI there is no product.
- **Nontrivial:**
  - label-to-part association
  - braille label placement as an optimization
  - a guideline-aware simplification with automated checks (minimum line gap, ≤5 textures, braille cell size)
- **Proof:** the same 10 diagrams through naive edge detection vs TouchSight, scored by the automated rule checker, plus timing (seconds vs hours).
- **Demo moment:** the side-by-side. Edge-detection mush beside a clean, labeled tactile graphic, then the rotating 3D relief.
- **Closest alternatives:**
  - Dot Vista (Microsoft + Dot): AI image → tactile for the Dot Pad refreshable display
  - TactileNet (Carleton): fine-tuned SD research
  - TacPic (2021 research): 3D-printable flashcards
  - UW Tactile Graphics project (research)
  - APH/Curriculum Associates tactile *library*: curated, not a generator
  → **Difference:** free and open, for paper/embosser/3D-print output (the media schools already own), with braille label re-placement and a guideline check report. The subagent found no mainstream image→tactile tool for teachers.
- **MVP:** labeled science diagrams (biology, physics, simple maps) → SVG + braille key + checks + web UI.
- **Stretch:** STL relief, audio description per region, a LoRA "tactile redraw".
- **Effort:** ~14–18 h for me.
- **Biggest risk:** output quality on varied diagrams. **Fallback:** restrict to labeled line diagrams and curate the demo set.
- **Success signal:** for N public-domain diagrams, ours passes X/Y rule checks vs the edge-detection baseline, at under 30 s per diagram.

### Idea 2 — MoveOut Lens: renter deposit evidence from before/after photos (SAFER)
- **User / pain.** Student renters lose deposits over disputed "new" damage. Today they rely on manual photo folders.
- **Workflow:**
  1. Move-in photos.
  2. Move-out capture with a ghost overlay to match the angle.
  3. Dense alignment.
  4. Learned change map (DINOv2 features + a small change head fine-tuned on **synthetic damage pairs we generate with SDXL inpainting**).
  5. SAM masks plus labels ("scuff", "stain", "moved item").
  6. A timestamped PDF report.
- **Tech:** alignment, change detection, a synthetic data pipeline, and a fine-tune. A measurable benchmark is easy: synthetic damage with known ground truth plus ~10 real pairs the user shoots.
- **Demo moment:** a slider over two photos, and an almost invisible scuff lights up.
- **Alternatives (they weaken innovation):**
  - PropCheckAI already has an align overlay plus "AI Compare".
  - Witnessed already distinguishes wear from damage and makes PDF reports.
  → Our difference is only free/on-device plus a published accuracy benchmark.
- **Effort:** ~12–15 h.
- **Biggest risk:** parallax and lighting false positives. **Fallback:** the ghost-overlay capture plus a planar-wall focus.

### Idea 3 — DefectForge: train a visual inspector with zero real defect photos (AMBITIOUS)
- **User / pain.** Small makers and student robotics teams can't collect defect photos.
- **Workflow:** a few "good" photos plus a text description of the defect → masked inpainting generates labeled synthetic defects → a detector is fine-tuned → evaluated on real defects (MVTec AD, CC BY-NC-SA).
- **Strong for Best Fine-tune.** **Weak:**
  - The user is abstract to SWE judges.
  - The prior art is strong: DefectFill (CVPR 2025) and NVIDIA AnomalyGen.
  - The pipeline takes the most compute and time.
- **Effort:** ~16–20 h. **Risk:** the synthetic→real gap shows weak numbers right before the deadline.

## 4. Comparison (planning heuristic, NOT official scores; all criteria equally weighted)

| | Tech | Innovation | Theme | Impact | Demo | Exec. risk |
|---|---|---|---|---|---|---|
| 1 TouchSight | High | High | High | Very high | Medium-high | Medium-high |
| 2 MoveOut Lens | High | Medium-low | Very high | High | Very high | Medium |
| 3 DefectForge | Very high | Medium | Very high | Medium | Medium | High |

Gates: all three pass eligibility (no mandatory tech, all can be built new in the window, demoable online).

## 5. Red team

**TouchSight**
- *Why judges might pass:*
  - They can't feel the output, so it might look like "just edge detection".
  - "Help the blind" can read as a cliché.
- *Answer:*
  - Lead the demo with the edge-detection baseline failing.
  - Show the rule-check report.
  - Frame it as a production tool for teachers, which is not one of the crowded camera narrators.
- *Assumption most likely to fail:* clean label↔part association and simplification on real textbook diagrams.
- *Cheapest test (~1.5 h, first build step):* Florence-2 OCR + SAM 2 on 5 Wikimedia diagrams. Do we get clean text boxes and leader lines? If not, pivot to Idea 2 by ~SGT 08:00.
- *Honesty limit:* no blind users or TVIs can test it this weekend. Claims stay at "meets measurable guideline checks", not "validated by users".

**MoveOut Lens**
- *Why judges might pass:* "spot the difference" feels simple, and commercial apps exist.
- *Assumption most likely to fail:* handheld alignment without false positives.
- *Cheapest test:* 5 phone photo pairs + homography + DINOv2 diff (~1 h).
- Revised view: this is a solid fallback, but weaker on innovation, so it is not the primary.

## 6. Award strategy
- **Primary:** the $500 top project (plus CodeCrafters VIP for top 3).
- **Compatible secondary:** Best Creative Tool (a tool that makes graphics), or Best Fine-tune if the stretch LoRA lands.
- Category prizes are unpublished, so don't chase them at the product's expense.

## 7. Hosting note
- The heavy models run on the local 4080.
- **Live URL:** a free Cloudflare quick tunnel to the local server during judging (Mon 21:00–05:00 SGT), plus a static gallery fallback (GitHub Pages) with precomputed results.
- The alternative is a CPU-only build on a free HF Space. That is slower and adds risk.
