# Printing and swell paper

## What the tactile SVG contains

The tactile SVG is a vector drawing intended for physical production. It uses pure black geometry rather than relying on colour or greyscale to encode tactile features. The page is laid out in millimetres for the selected paper size. The preview may show grey label pills and other UI overlays that are not part of the production SVG.

## Swell-paper workflow

1. Export **Download tactile SVG**, or choose **Print / PDF** in the application.
2. Open the SVG or PDF in a tool that preserves page dimensions.
3. Print on plain paper at **100% / actual size**. Disable “fit to page,” “shrink oversized pages,” or other scaling options.
4. Confirm the page size and orientation before printing.
5. Photocopy the black image onto swell paper (also called microcapsule paper) using the procedure specified by the equipment supplier.
6. Run the sheet through the appropriate heat fuser (for example, a PIAF system). Dark printed areas absorb heat and expand to form raised features.
7. Inspect the physical output for missing lines, merged details, uneven height, braille clarity, and paper/fuser artifacts.

Nominal design weights currently documented by the project are 1.5 mm for named-part/silhouette edges, 0.8–1.0 mm for detail lines, and 0.6 mm for leaders. Braille dot dimensions follow the project's Spec 800 target. Confirm these values on the actual equipment and stock being used.

## Production checks

- Ensure the printer did not scale the page.
- Confirm the printed black areas are solid and the page is not clipped.
- Check that the fuser has raised intended lines without joining nearby lines.
- Verify that braille dots are distinct and correctly spaced.
- Confirm that textures are distinguishable and do not merge with part boundaries.
- Compare the proof with the source diagram and transcriber's approved layout.

The grey label pills in the screen preview are not production content. The exported tactile page is intended to be pure black.

## 3D printing

The relief tab can export an **STL** plate model containing raised lines, textures, and braille dots. This can be useful for prototyping or alternative fabrication. STL output is not a substitute for verifying swell-paper output when swell paper is the intended production method.

## Troubleshooting

| Symptom | Check |
|---|---|
| Graphic appears too small or too large | Print at 100% / actual size; inspect the SVG page dimensions and printer scaling settings. |
| Nearby lines merge | Revisit the Simplified style, tracing sensitivity, or source diagram; inspect actual raised output. |
| Fine details disappear | Consider whether they are essential; verify printer/fuser settings and physical line weight. |
| Braille is crowded | Review label placement and the 3 mm clearance check; do not rely on the screen preview alone. |
| Texture patterns merge | Reduce texture complexity or use fewer texture classes. |
| SVG is clipped | Check page size, margins, and printer printable area. |

## Editable SVG post-processing and quality control

The tactile SVG export is a vector document with physical dimensions in millimetres. It contains separate, named SVG groups for the page background, textures, structural line art, outlines, label-clearance knockouts, leader lines, and braille dots. The key-page SVG also separates braille from sighted print-reference text. Paths, circles, and text remain vector objects rather than a flattened screenshot.

**Inkscape is the recommended reference editor because it is free and open-source (FOSS).** The exported SVG is standard vector artwork; other SVG-capable editors—including Adobe Illustrator and Affinity Designer—can also be used. TouchSight-NG targets FOSS workflows, so Inkscape is the editor used in these instructions, not a technical requirement.

Recommended post-processing sequence:

1. Export the editable tactile SVG and, when present, the key-page SVG.
2. Open the SVG in Inkscape. Use the Objects/Layers panel to inspect and isolate the named groups.
3. Compare the artwork with the source diagram and the TouchSight-NG analysis views. Correct path geometry, remove false contours, reconnect broken boundaries, and adjust leader placement where necessary.
4. Check label-to-part correspondence, braille spelling and dot patterns, line hierarchy, texture distinction, clearances, and page margins. Do not assume that a visually attractive edit is tactilely legible.
5. Preserve the physical page dimensions and millimetre scale. Avoid scaling individual objects in ways that alter specified braille or line dimensions.
6. Save a separate reviewed SVG, then produce a physical proof on the target printer/swell-paper/fuser system. Inspect the raised output and obtain tactile-reader feedback where possible.

The vector editor is a post-processing and QC option, not an automated validation step. Editing SVG geometry does not update TouchSight-NG's analysis state or its automated guideline report. Re-run or independently perform checks after edits, and retain the unmodified export so changes can be compared or reverted.
