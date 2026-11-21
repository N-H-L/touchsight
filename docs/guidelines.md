# Tactile layout and BANA guidelines

TouchSight-NG's layout stage implements a checkable subset of the BANA *Guidelines and Standards for Tactile Graphics* (2022), along with braille dimensions referenced from Library of Congress Spec 800 and uncontracted Unified English Braille (UEB). This page documents the values currently described by the project; it is not a replacement for consulting the full standards or a qualified transcriber.

## Why tactile translation differs from visual tracing

A visual diagram can use colour, subtle shading, small labels, thin leader lines, and closely spaced contours. A tactile graphic has finite spatial resolution: raised features that are too close can merge under a finger, while tiny fragments may be impossible to identify. The design therefore needs hierarchy and selective simplification.

TouchSight-NG attempts to preserve named-part boundaries, suppress print text and visual noise, and replace colour distinctions with line weights and a limited texture vocabulary.

## Line hierarchy

| Element | Current nominal weight |
|---|---:|
| Silhouette and named-part edges (Detailed style) | 1.5 mm |
| Detail lines | 0.8–1.0 mm |
| Leader lines | 0.6 mm |

A hierarchy is useful only if it survives the selected production process. Verify line prominence on a physical proof; the nominal SVG width is not a guarantee of identical raised height.

## Textures

- At most **five distinguishable textures** are assigned.
- A texture fills the part it identifies and is inset **1.5 mm** from the outline.
- Textures are optional. The default presentation relies on bold/fine line hierarchy.
- Colour is not a tactile distinction. Texture assignments should be consistent and explained in a key or legend where needed.

Avoid texture patterns so dense that they obscure braille, boundaries, or nearby features. Inspect the physical proof to determine whether patterns remain distinguishable.

## Braille

- The current encoder produces **uncontracted UEB Grade 1**.
- Dot geometry follows Library of Congress **Spec 800** dimensions.
- Full words are used where they fit; otherwise the layout can use two-letter keys and a key page.
- The key generator avoids the ambiguous pairs aa/ac/cc/ca and requires dot 3 or dot 6.
- The layout targets **3 mm clearance** around braille labels, with knockouts when a label must sit over drawing geometry.
- A page title in braille is optional.

Always proofread the braille against the corrected print label. OCR correctness and braille encoding correctness are separate concerns.

## Spacing and simplification

- Lines closer than **3 mm** are merged/thinned to a centreline in Simplified style.
- Simplified style removes short fragments below **12.5 mm**.
- Detailed style preserves more of the source structure and reports residual narrow gaps and fragments for transcriber review.

These are project implementation thresholds. They should be reviewed against the current applicable BANA guidance and the actual output device, not treated as a universal substitute for professional judgment.

## What the automated checker measures

`src/js/check.js` evaluates the generated output and a Canny edge-tracing baseline at the same page size. The reported measures include:

- print-label locations still represented as raised marks
- short fragments below 12.5 mm
- mean figure area where lines are closer than 3 mm
- braille labels with full 3 mm clearance

The checker is geometric. It does not test whether a blind reader can identify a shape, whether the label-to-part association is semantically correct, or whether two textures are distinguishable in physical production.

## Recommended QA loop

1. Review the source diagram and all detected labels.
2. Inspect each label's leader endpoint and segmentation mask.
3. Review line hierarchy, fragments, close gaps, braille, and texture assignment.
4. Export at the intended physical page size.
5. Produce a physical proof on the target swell-paper/fuser system.
6. Obtain tactile-reader feedback where possible and revise the source or layout.
