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
