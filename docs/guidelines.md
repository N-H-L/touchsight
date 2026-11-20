# Tactile layout and BANA guidelines

The layout stage implements a concrete, checkable subset of the BANA *Guidelines and Standards for Tactile Graphics* (2022), drawn as pure black SVG in millimetres.

## Line widths

| Element | Weight |
|---|---|
| Silhouette and named-part edges (Detailed style) | 1.5 mm |
| Detail lines | 0.8-1.0 mm |
| Leader lines (always the thinnest) | 0.6 mm |

## Textures

- At most **5 distinguishable textures**.
- Each fills the part it labels, **inset 1.5 mm** from the outline so the pattern never blurs the boundary.
- Textures are optional; the default is bold/fine lines only.

## Braille

- **Uncontracted UEB** (Grade 1), encoded by `src/js/braille.js`.
- Dots drawn at Library of Congress **Spec 800** dimensions.
- **Full words** where they fit; otherwise **two-letter keys** on a key page. Keys avoid the ambiguous pairs aa/ac/cc/ca and always contain dot 3 or dot 6.
- **3 mm clearance** around every braille label, with knockouts when a label must sit on the drawing.
- A page title in braille is optional.

## Spacing

- Lines closer than **3 mm** are merged and thinned to one centreline (Simplified style enforces this everywhere; Detailed style reports the residual narrow-gap area so the transcriber can judge).
- Short fragments under **12.5 mm** are too small to identify by touch. Simplified drops them outright; Detailed keeps only what the label-guided hierarchy marks as meaningful.

## What the checker measures

`src/js/check.js` computes, for both TouchSight-NG's output and the Canny baseline at the same page size:

- print-label spots still traced as raised marks (target: 0)
- short fragments below 12.5 mm
- mean figure area where lines are closer than 3 mm
- braille labels with full 3 mm clearance

These checks are automated helpers, **not** a substitute for a qualified transcriber's review.
