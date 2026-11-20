# The teacher review workflow

TouchSight-NG produces a first draft. The transcriber finishes it. This page describes the review loop in the app (right rail) and the recommended checks before printing.

## Fixing labels

Every detected label is listed with its braille rendering underneath and a status line:

- *full braille* or *key "..."`, depending on how it was placed
- *leader traced* or *label sits on the part*
- *part segmented* or *no part found*
- auto-corrections that the pipeline applied, for example `Atriym` → `Atrium`, `Leff Atrium` → `Left Atrium`, checked against a small science vocabulary and your list of known terms. **Every correction is shown to you**, never applied silently beyond the list.

Actions per label:

- **Edit the text**: click the input, change the wording, tab out. The braille and layout update instantly.
- **Merge**: joins a label into the one above. OCR sometimes splits a two-line label into two; merging restores the original wording.
- **Remove / restore**: drops the label from the page (or restores it).

## Interactive checking

- On the **Tactile graphic** tab, hovering a label highlights its braille and its bold outline on the page.
- On the **What the AI saw** tab, hovering shows the label's box, its leader line, and the mask Segment Anything extracted, over the faded original.
- The **vs. edge tracing** tab always shows what naive tracing would have produced at the same page size.

## The guideline check

The **Guideline check** table scores the current layout against the checks described in [Tactile layout and BANA guidelines](guidelines.md), next to the edge-tracing baseline. Typical rows:

- print text still traced as raised marks (should be 0)
- short fragments below the 12.5 mm touch threshold
- fraction of figure area where lines are closer than 3 mm
- braille labels with full 3 mm clearance

## Before you print

1. Re-read every label against the source diagram. The OCR is good but not perfect; the layout cannot know when a label is factually wrong.
2. Check the legend: confirm the five-texture budget and that named parts read correctly.
3. Look at the 3D relief under raking light for crowding that the automated checks miss.
4. Export the tactile SVG and follow [Printing and swell paper](printing.md).
