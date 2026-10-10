# TouchSight Tactile Spec (parameters for the renderer and rule checker)

Primary source: **BANA, *Guidelines and Standards for Tactile Graphics*, 2022 edition** (GSTG 2022; it replaces the 2010 edition, and the numbers below match 2010 where we checked).
PDF: https://www.brailleauthority.org/sites/default/files/tg/Tactile%20Graphics%20Standards%20and%20Guidelines%202022_a11y.pdf
(Landing page: https://www.brailleauthority.org/guidelines-and-standards-tactile-graphics). Local copy: `scratchpad/spec/gstg.pdf`.
Note: the PDF's margin section numbers drift from the text after extraction. "§" refs are best effort, and the Unit and page refs (e.g. p.3-8) are reliable.
Confidence: H = quoted from the primary source; M = secondary source or derived; L = practitioner anecdote. **UNVERIFIED** = we could not find a source.
Unit conversion: the guidelines use 1/8 in = 3 mm and 1/4 in = 6 mm (rounded). The checker should use the BANA metric values.

## 1. Braille cell geometry (paper braille, NLS Specification 800 as quoted by BANA)
Source: BANA "Size and Spacing of Braille Characters", https://www.brailleauthority.org/node/63

| Parameter | Value | Unit | Source | Conf |
|---|---|---|---|---|
| Dot base diameter | 1.44 (0.057 in) | mm | BANA node/63, Spec 800 | H |
| Dot height | 0.48 (0.019 in) | mm | same | H |
| Dot-to-dot within cell (center to center, horiz. and vert.) | 2.34 (0.092 in) | mm | same | H |
| Cell-to-cell (corresponding dots of adjacent cells) | 6.2 (0.245 in) | mm | same | H |
| Line-to-line (corresponding dots of adjacent lines) | 10.0 (0.400 in) | mm | same | H |
| Signage range (ANSI A117.1), for reference only | dot 1.5–1.6, in-cell 2.3–2.5, cell 6.1–7.6, line 10.0–10.2 | mm | same | H |
| Derived cell bounding box (dots only) | ~3.8 W x 6.1 H (2.34+1.44, 2x2.34+1.44) | mm | derived | M |
| Swell-paper font: Duxbury "Swell Braille.ttf" at **24 pt**, black, no outline; CorelDRAW line/paragraph spacing **111%** to match embossed spacing | 24 | pt | GSTG 2022 App. B (p.A-2) and App. D microcapsule notes (p.A-13/14) | H |
| Standard TrueType braille / SimBraille fonts are **not suitable** for swell paper (dots swell too large) | - | - | GSTG 2022 p.A-13 | H |

Implementation: draw each dot as a filled black circle. On swell paper, dots spread when heated, so render them a little smaller than 1.44 mm (Swell Braille uses "slightly smaller dots", GSTG Glossary). Suggested dot diameter about 1.2–1.3 mm: **UNVERIFIED**, calibrate by test print. Keep center spacing at 2.34, 6.2 and 10.0 mm.

## 2. Clearances and minimum sizes (GSTG 2022 Unit 3, §3.4.3, pp.3-7 to 3-9, unless noted)

| Parameter | Value | Unit | Source | Conf |
|---|---|---|---|---|
| Label to any other component (min / max) | **3 / 6** (1/8–1/4 in) | mm | §3.4.3 "Labels" p.3-9; §5.10 p.5-23 | H |
| If the label can't sit within 3–6 mm, move it far enough for a lead line of | >= 20 | mm | p.3-9 | H |
| Blank space around a label embedded in an area texture (all sides) | >= 3 | mm | p.3-9 | H |
| Point symbol to any other component | >= 3 | mm | p.3-9 | H |
| Symbols/labels spacing; closer than 3 mm "tend to be perceived as a single symbol" | >= 3 | mm | Unit 8 §8.5 pp.8-3, 8-5 | H |
| Primary line minimum length | >= 12.5 (1/2 in) | mm | §3.4.3.2 p.3-8 | H |
| Dashed primary line: dash length 6–10 mm, gap about 0.5 x dash | 6–10 / ~3–5 | mm | p.3-8 | H |
| Minimum area size | 1/4 sq in (= **161 mm²**, about 12.7x12.7 mm) | in² | §3.4.3.1 p.3-7 (the PDF prints "(6 square millimeters)", an obvious conversion error; use 161 mm²) | H(in), M(mm) |
| Very small areas: raise them above neighbours (or show them as recessed) rather than texture them | - | - | p.3-7 | H |
| Point symbols, minimum diameter when shapes must be told apart | >= 6 | mm | p.3-9; key: §5.9.3 | H |
| Same-shape symbols must differ in size by | 25–30 | % | Unit 8 p.8-6 | H |
| Grid lines, minimum spacing (otherwise they read as texture) | >= 10 (3/8 in) | mm | p.3-9 | H |
| Parallel distinct lines, minimum separation | >= 3 (apply the general 3 mm symbol rule) | mm | derived from p.8-5 | M |
| Break (blank gap) where lines cross other lines or textures, and between adjacent textures; not needed when the contrast is clear | gap ~3 mm **UNVERIFIED** size | - | Unit 2 (clutter) p.2-2 | H(rule) |
| Blank space around a plotted point (embossed) / min point diameter | 3 / 3 | mm | Unit 6 §6.10 angles (p.6-~70) | H |

## 3. Lines: widths and styles (swell paper)

| Parameter | Value | Unit | Source | Conf |
|---|---|---|---|---|
| Max distinct line styles per graphic | **5** (use an alphabetic key if more are needed) | count | §3.2 p.3-2 | H |
| Lead line: the **least significant** line in the graphic; preferred length **20–37.5 mm**; straight; **no arrowhead**; solid or textured | 20–37.5 | mm | §3.4.3.5 p.3-8 | H |
| Lead line: one end **touches** the component; the other end stops **>= 3 mm** from the start/end of the braille label | 0 / >=3 | mm | p.3-8 | H |
| Lead lines that curve or change direction are harder to follow (GRASP research) | - | - | p.3-8 | H |
| Arrow: shaft and head about equal weight; solid isosceles head attached to the shaft, or open head with shaft detached 3 mm from apex | 3 | mm | p.3-8/3-9 | H |
| Axis lines stronger than grid lines | - | - | p.3-9 | H |
| Line style in key sample length | 25 (1 in) | mm | §5.9.2 | H |
| Thinnest line one student could feel on swell (PIAF heat 10) | 0.3 | mm | Perkins eLearning blog, https://www.perkinselearning.org/technology/blog/students-tactile-preferences-piafswell-machine-graphics | L |
| Suggested distinguishable widths from the same test | 0.4, 0.9, 1.4, 2.0 | mm | same | L |
| Minimum line weight to "swell clearly" | 3 pt (~1.06 mm) | pt | NCW Outreach bulletin, https://www.ncw.co.uk/wp-content/uploads/2026/06/Reaching-Out-June-26.docx (cites UKAAF) | M |
| Use dashed lines for label leaders so they read differently from outlines | - | - | NCW bulletin (above) | M |

**Recommended TouchSight defaults** (our synthesis): outline/primary 1.5 mm solid; secondary 1.0 mm solid; dashed 1.0 mm (dash 6, gap 3); dotted (1.2 mm dots every 3 mm); lead line 0.6–0.8 mm (thinnest). Width steps should differ by about 2x to be tactually distinct: **UNVERIFIED**. App. F of GSTG ("Line Styles for Microcapsule") only shows images: "lines used for one graphic should be tactually distinct" (p.A-31).

## 4. Area fills and textures

| Parameter | Value | Unit | Source | Conf |
|---|---|---|---|---|
| Max different area textures per graphic | **5** | count | §3.2 p.3-2 | H |
| Max point symbol types | **5** | count | §3.2 p.3-2 | H |
| Key texture sample size | 12.5 H x 25 W (cells 1–4, two braille lines) | mm | p.3-9; §5.9.1 | H |
| Minimum area to carry a texture | use 161 mm² (the area min), better >= 12.5x25 mm (the size of the key sample) | mm² | derived | M |
| Textures within a graphic must be tactually distinct; use the same texture for the same feature throughout (e.g. water) | - | - | App. E p.A-30; Unit 2 p.2-3 | H |
| Leave a blank break between adjacent textures and where lines cross textures | - | - | Unit 2 p.2-2 | H |
| Background / large or least important regions: smooth, no fill (e.g. "non-texturing of water", "smooth--no fill" as a texture class) | - | - | Unit 3 planning example p.3-5/3-6 | H |
| Omit decorative borders and frames unless they show containment | - | - | Unit 2 §2.5–2.6 p.2-1 | H |
| Print shading or colour that is also labeled need not be shown as texture | - | - | Unit 6 pie-chart notes | H |
| Fill ordering example (dense to sparse): solid > large dot > diagonal lines > small dot > none | - | - | p.3-6 example | H |
| Use a variety of heights and textures to improve readability | - | - | Unit 2 p.2-4 | H |

## 5. Labels, keys, titles

| Rule | Value | Source | Conf |
|---|---|---|---|
| Hierarchy: (1) full word inside the area; (2) words plus alphabetic keys; (3) lead lines for small areas, lines and points; (4) key the item and explain it in the key | - | §5.10.3 p.5-22 | H |
| Prefer a braille word over a keyed symbol whenever the word fits (a key adds a step) | - | Unit 2 p.2-3; §3.1 p.3-1 | H |
| Labels are horizontal; a runover is left-justified (not indented) | - | §5.10 pp.5-22/23 | H |
| Label to its component | 3–6 mm | §5.10 p.5-23 | H |
| Alphabetic key: **2–3 cells** (2 preferred); first letter = first letter of the item; **one letter must contain dot 3 and/or dot 6**; avoid aa, ac, cc, ca (top row only, read as texture); single-letter keys are not recommended and need a period | - | §5.8.1 p.5-17 | H |
| Do not use a Grade 1 indicator before a 2-cell alphabetic key | - | §5.8.1 p.5-17 | H |
| Numeric key: numeric indicator before each number, no period | - | §5.8.1 | H |
| Key placement: transcriber's note **below the graphic title** and before the graphic, same page if possible; otherwise on the **facing (left-hand) page** before the graphic | - | §5.8.3 p.5-18 | H |
| Key starts with "Key:" (in TN indicators, cell 7); order: textures, then letter keys, then number keys; letter keys in cell 1 + blank cell, explanation after, runovers cell 3; textures cells 1–4, explanation cell 6, runover cell 8; 2-column key allowed ("Key in 2 columns:") | - | §5.8.4 pp.5-19..21 | H |
| Key order: alphabetical for "random" labels; reading order (L-R, top-bottom, or clockwise from top) for "logical" labels | - | §5.7 p.5-16 | H |
| Print "Legend" becomes "Key" in braille | - | p.5-16 | H |
| Title: centered heading with a blank line before and after (unless it is line 1 or follows a box line) | - | §5.3 p.5-8 | H |
| Graphic body placed at the **left margin**, not centered | - | Unit 2 §2.7 p.2-1 | H |
| Capitalization follows print; it may be omitted where space is limited | - | §5.10 p.5-22 | H |
| Single **capital** letter label: no Grade 1 indicator. Single **lowercase** letter label (incl. a, i, o): Grade 1 indicator **required** | - | §5.10 p.5-22/23; Unit 6 number-line notes | H |
| Contracted vs uncontracted labels: follow the transcription code (UEB contracted in literary texts; GSTG examples use contractions in keys). TouchSight emitting uncontracted (Grade 1) labels is a simplification; mark it in a transcriber's note | - | §5.8.1 ("single-cell contractions should be used" in keys) | M |
| Orientation cue for loose sheets: cut off the top-right corner | - | Unit 2 p.2-4 | H |

## 6. Page sizes and layout

| Parameter | Value | Unit | Source | Conf |
|---|---|---|---|---|
| Standard braille textbook page | 11.5 x 11 in (29 x 28 cm) | in | §3.4.4 p.3-14 | H |
| Max graphic incl. title, key, TN, page numbers on that page | **40 cells x 25 lines** (~248 x 250 mm using 6.2/10 mm pitch) | cells | §3.4.2 p.3-7 | H (derived mm M) |
| Larger option: 11 x 17 in (28 x 43 cm) or fold-out flap | - | in | §3.4.4 p.3-14 | H |
| Portable maps | 8.5 x 11 up to 11 x 17 in | in | Unit 8 §8.6 p.8-5 | H |
| Swell paper sizes on sale | 8.5 x 11 in and 11 x 17 in (US); A4/A3 (EU) | - | vendor listings (maxiaids/braillebookstore); A4/A3 **UNVERIFIED** | M |
| Graphics in a volume use the same paper size as the text | - | - | Unit 2 §2.4 p.2-1 | H |
| Margins | match embossed braille, with space for left-side binding (no number given) | - | App. G p.A-32 | H(rule) |
| Suggested printable margins: 12.7 mm (0.5 in), left binding 25 mm | - | mm | **UNVERIFIED** | L |
| Enlarge only as much as needed for clarity; enlarge maps and scale proportionally | - | - | §3.5 p.3-14/15 | H |

## 7. Simplification principles (GSTG 2022 Units 2–3)
- Simplify, as long as the original intent is kept (Unit 2 p.2-2). Don't over-simplify (§3.6 p.3-15).
- When measurement isn't the task, you may change size, position and layout (distortion allowed). When it is, keep scale and make the item measurable (p.2-2).
- If depth isn't needed, convert 3-D to 2-D and name the view (front, cross-section). Multiple views are allowed (p.2-2, p.3-15).
- Drop decorative borders, frames, and print shading or colour that carries no content (§2.5–2.6).
- Clutter comes from components that are too close or too similar. Add blank breaks at crossings and between textures (p.2-2).
- Choose content from the surrounding text and questions; never change meaning (§3.2 p.3-2).
- Complex diagrams: split them into sections or layers or several graphics, each with its own title (p.3-15; Unit 7).
- Limit to 5 textures, 5 line styles and 5 point types; consolidate categories (the example collapses 12 rainfall ranges into 5) (§3.2, p.3-5).
- Use transcriber's notes to explain format changes (Unit 2 p.2-3).
- Smooth jagged outlines; trace the imported bitmap rather than drawing freehand (App. D p.A-13).

## 8. UEB Grade 1 essentials
Source: ICEB, *The Rules of Unified English Braille*, 2nd ed. 2013, https://iceb.org/ueb.html (Sec. 3 symbols, 5 Grade 1, 6 numeric, 7 punctuation, 8 capitals). The dot patterns are standard and were checked by computing the Unicode values. Conf H for symbols; the rule § numbers are from memory (M).
Unicode: `U+2800 + mask` with dot1=0x01, dot2=0x02, dot3=0x04, dot4=0x08, dot5=0x10, dot6=0x20.

| Ch | Dots | U+ | Ch | Dots | U+ | Ch | Dots | U+ |
|---|---|---|---|---|---|---|---|---|
| a ⠁ | 1 | 2801 | j ⠚ | 245 | 281A | s ⠎ | 234 | 280E |
| b ⠃ | 12 | 2803 | k ⠅ | 13 | 2805 | t ⠞ | 2345 | 281E |
| c ⠉ | 14 | 2809 | l ⠇ | 123 | 2807 | u ⠥ | 136 | 2825 |
| d ⠙ | 145 | 2819 | m ⠍ | 134 | 280D | v ⠧ | 1236 | 2827 |
| e ⠑ | 15 | 2811 | n ⠝ | 1345 | 281D | w ⠺ | 2456 | 283A |
| f ⠋ | 124 | 280B | o ⠕ | 135 | 2815 | x ⠭ | 1346 | 282D |
| g ⠛ | 1245 | 281B | p ⠏ | 1234 | 280F | y ⠽ | 13456 | 283D |
| h ⠓ | 125 | 2813 | q ⠟ | 12345 | 281F | z ⠵ | 1356 | 2835 |
| i ⠊ | 24 | 280A | r ⠗ | 1235 | 2817 | | | |

Indicators and punctuation:
| Symbol | Dots | Braille | U+ |
|---|---|---|---|
| Numeric indicator | 3456 | ⠼ | 283C |
| Digits 1-9,0 = a-j after ⠼ (1=⠁ ... 9=⠊, 0=⠚) | - | ⠼⠁⠃ = "12" | - |
| Capital letter indicator | 6 | ⠠ | 2820 |
| Capitalized word indicator | 6,6 | ⠠⠠ | - |
| Grade 1 symbol indicator | 56 | ⠰ | 2830 |
| Grade 1 word indicator / passage | 56,56 / 56,56,56 | ⠰⠰ / ⠰⠰⠰ | - |
| Period | 256 | ⠲ | 2832 |
| Comma | 2 | ⠂ | 2802 |
| Hyphen | 36 | ⠤ | 2824 |
| Apostrophe | 3 | ⠄ | 2804 |
| Colon / semicolon | 25 / 23 | ⠒ / ⠆ | 2812 / 2806 |
| Question / exclamation | 236 / 235 | ⠦ / ⠖ | 2826 / 2816 |
| Opening / closing parenthesis | 5,126 / 5,345 | ⠐⠣ / ⠐⠜ | - |

Rules for the encoder:
- Capitals: ⠠ before a single capital letter. ⠠⠠ before an all-caps word of 2 or more letters (the capitals mode ends at a space or a non-letter).
- Numbers: ⠼ once before each digit sequence. The numeric mode ends at a space or a non-digit. A letter a–j directly after a digit must be preceded by ⠰ (e.g. "3a" = ⠼⠉⠰⠁).
- Grade 1 indicator: a lowercase letter standing alone (b..z would read as alphabetic wordsigns like "but", "can") gets ⠰. BANA tactile rule: put ⠰ before **any** lone lowercase letter label, including a, i, o, and **never** before a lone capital letter label.
- For whole-uncontracted labels, a letter sequence that matches a shortform/wordsign could be misread (e.g. "ab" = about) when standing alone. Safest: prefix such words with ⠰⠰, or note "labels in uncontracted braille" in a transcriber's note. Exhaustive list: **UNVERIFIED** (see UEB Rulebook §10).

## 9. Swell / microcapsule paper practicalities (GSTG 2022 App. D, pp.A-11..A-15; Unit 4 p.4-3)
- Ink or toner **must be carbon-based black**, or the image won't rise. Test inks before copying (p.A-12). Laser toner and photocopy are typical.
- The fuser raises **gray and black** areas. So any gray (antialiasing, light fills) swells partly. Output pure #000 on pure #FFF with **no antialiasing or grayscale**, and keep the background blank (p.4-3). "Too much heat causes background swelling" (p.A-12).
- Printing directly in many laser printers pre-heats the paper. Print on bond paper, then photocopy onto capsule paper, or use a straight paper path (p.A-12).
- Copy onto plain paper first to proof (p.A-12). Keep toner density even and check the copier periodically (p.A-12).
- Braille: use Swell Braille 24 pt (not SimBraille or standard braille fonts), black, no outline. Never resize braille with the graphic. Line spacing 111% in CorelDRAW (pp.A-13/14). In SVG, draw explicit circles at Spec-800 pitch instead of fonts.
- Swell height is about 0.5 mm (Wikipedia "Tactile graphic", https://en.wikipedia.org/wiki/Tactile_graphic, M). Braille on capsule paper is lower and rounder than embossed dots and is generally less crisp. Keep labels short and well spaced (M).
- Brands: Minolta, Zytex, Swell, Swell Touch, Tangible Magic. Developed with a "fuser/enhancer" such as PIAF (p.A-11). Perkins test ran PIAF at heat level 10 (L).

## Checker rule summary (machine-checkable)
`label_gap_mm in [3,6] or has_leadline` | `leadline_len_mm in [20,37.5]`, straight, no arrowhead, touches target, ends >=3 mm from label, thinnest stroke | `n_textures<=5, n_line_styles<=5, n_point_types<=5` | `area_mm2>=161` | `primary_line_len_mm>=12.5` | `point_diam_mm>=6 (if multiple shapes)`, clearance >= 3 | `any two distinct symbols gap >= 3 mm` | `label clearance inside texture >= 3 mm` | `grid spacing >= 10 mm` | `page content <= 40 cells x 25 lines` | `fills are pure black/white, no gray` | `keys 2-3 cells, contain dot 3 or 6, not aa/ac/cc/ca` | `lone lowercase letter label -> prefix ⠰`.
