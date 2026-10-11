# Voiceover video script (you record it)

Target: **2:30–2:50**. Hard limit **3:00** (the rules also say at least 2:00).

## Set up (5 minutes, before recording)
1. Open Chrome at https://n-h-l.github.io/touchsight/
2. **Warm up the models:** click **Human heart**, wait for "Done", then click **Structure of a volcano** and wait for "Done". Later runs are faster.
3. Press **F5** to reload, so you start on the empty page.
4. Press **F11** for full screen. Keep browser zoom at 100% (Ctrl+0).
5. Recorder: **Clipchamp** (built into Windows 11): *Record & create → Screen*, mic on, then choose the Chrome window. Or use **Win + Alt + R** (Game Bar); first turn the mic on with Win + G → Capture settings.
6. Do one practice run without recording. Speak slowly. If you mess up a line, pause, say it again, and cut the mistake in Clipchamp afterwards.

## Script
**DO** = what to click. **SAY** = what to say, in your own words if you like.

### 1. Problem (0:00–0:20)
- **DO:** Stay on the empty page. Don't click anything.
- **SAY:** "Hi, I'm [your name], and this is TouchSight. Blind students learn science from the same diagrams as everyone else. But first a teacher has to redraw every diagram by hand as a raised-line *tactile graphic*, with braille instead of print. One science assignment can take up to ten hours."

### 2. Run it (0:20–0:50)
- **DO:** In the left panel under *Or try a sample*, click **Human heart**. The loading screen with the step list appears.
- **SAY (while it loads):** "TouchSight makes that first draft automatically, and it all runs here in the browser. Nothing is uploaded, so it's free and private for schools. Right now it's reading the printed labels with PaddleOCR, following each label's pointer line to the part it names, and using Segment Anything to find that exact part."
- If it's still loading, add: "The first run downloads the AI models; after that it takes about ten to twenty seconds."

### 3. Before and after (0:50–1:10)
- **DO:** Above the drawing, click **Original**.
- **SAY:** "This is the original: colour, shading and small print you can't feel."
- **DO:** Click **Tactile**.
- **SAY:** "And this is the tactile version. The print is gone, every label is now braille, and the pointer lines are redrawn with space around the braille."

### 4. The bold lines (1:10–1:25)
- **DO:** Slowly move the mouse along a thick outline, for example around the aorta at the top.
- **SAY:** "The thick lines are the edges of the parts the labels name. Segment Anything found them, so a reader can feel where each named part is. The thinner lines keep the rest of the original detail."
- **DO:** Click **Overlay**.
- **SAY:** "The overlay shows it lines up exactly with the original."

### 5. What the AI saw (1:25–1:40)
- **DO:** Click the **What the AI saw** tab. Hover your mouse over labels 1, 2, 3 and 4 in the right-hand list, one at a time.
- **SAY:** "Here's what the AI saw: each label, the pointer line it owns, and the part it segmented."

### 6. Fixing labels (1:40–2:00)
- **DO:** Click the **Tactile graphic** tab. In the right-hand list, scroll to **5 Left Atrium** and point at the green text *auto-corrected Leff Atrium → Left Atrium*.
- **SAY:** "The text reader misread 'Left' as 'Leff', and TouchSight fixed it automatically."
- **DO:** Click in the **2 Aorta** text box, type ` (main artery)` at the end, then press **Tab**.
- **SAY:** "And the teacher stays in control. Edit any label and the braille updates straight away."

### 7. Why not just trace it? (2:00–2:15)
- **DO:** Click the **vs. edge tracing** tab.
- **SAY:** "If you just trace the picture, every word turns into raised squiggles and there's no braille."
- **DO:** Scroll the right-hand panel down to **Guideline check**.
- **SAY:** "TouchSight checks every page against the official tactile graphics guidelines. On sixteen test diagrams it found ninety-eight percent of the labels."

### 8. How it feels (2:15–2:30)
- **DO:** Click the **3D relief** tab. Drag the picture a little to tilt it.
- **SAY:** "This preview shows how it will feel. You can download it for swell paper, or as an STL file to 3D-print."

### 9. Another subject + close (2:30–2:50)
- **DO:** Click the **Tactile graphic** tab, then the **Structure of a volcano** sample. Talk while it loads.
- **SAY:** "It works for other subjects too, like this earth science diagram. I picked this idea after brainstorming image-AI projects, because tactile graphics are a real bottleneck. The layout rules come from the braille authority's guidelines, and I tested every change on sixteen diagrams. I built it solo this weekend with PaddleOCR, Segment Anything, OpenCV and three.js, with help from Claude Code. It hasn't been tested with blind readers yet; that's my next step. TouchSight: diagrams everyone can read."
- **DO:** Let the volcano result show for 2–3 seconds, then stop recording.

## After recording
- Check the length. If it's over 3:00, cut the loading waits in Clipchamp.
- Export at 1080p. Upload to YouTube as **Public**, with the title and description from SUBMISSION.md. If your video doesn't show "processing shortened", remove that phrase from the description.
- The captioned video I made (`C:\Users\Admin\Videos\touchsight-demo.mp4`) is your backup if recording goes wrong.
