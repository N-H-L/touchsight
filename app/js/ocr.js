// Finds the printed labels in a diagram: Tesseract word boxes -> text lines.
// Lines are merged into multi-line labels later, once we know which lines own a leader line.

const WORDISH = /[A-Za-z0-9]/;

export async function recognizeWords(worker, canvas) {
  const { data } = await worker.recognize(canvas, {}, { blocks: true });
  const words = [];
  for (const b of data.blocks ?? []) for (const p of b.paragraphs) for (const l of p.lines) for (const w of l.words) {
    const text = w.text.trim();
    const { x0, y0, x1, y1 } = w.bbox;
    words.push({ text, conf: w.confidence, x0, y0, x1, y1 });
  }
  return words;
}

export function filterWords(words, W, H) {
  return words.filter((w) => {
    const h = w.y1 - w.y0, wd = w.x1 - w.x0;
    if (!WORDISH.test(w.text)) return false;
    if (h < 7 || h > H * 0.09 || wd > W * 0.6) return false;
    const alnum = w.text.replace(/[^A-Za-z0-9]/g, '').length;
    // Short tokens need high confidence; drawings often produce 1-2 char garbage.
    if (alnum <= 2) return w.conf >= 80 && /^[A-Za-z0-9]{1,2}$/.test(w.text.replace(/[()]/g, ''));
    return w.conf >= 55 && alnum / w.text.length >= 0.6;
  });
}

// Group words that sit on the same baseline and are close horizontally.
export function wordsToLines(words) {
  const sorted = [...words].sort((a, b) => a.x0 - b.x0);
  const lines = [];
  for (const w of sorted) {
    const h = w.y1 - w.y0;
    const line = lines.find((L) => {
      const lh = L.y1 - L.y0;
      const ov = Math.min(L.y1, w.y1) - Math.max(L.y0, w.y0);
      const gap = w.x0 - L.x1;
      return ov > 0.5 * Math.min(lh, h) && gap < 0.9 * Math.max(lh, h) && gap > -0.5 * h;
    });
    if (line) {
      line.words.push(w);
      line.x1 = Math.max(line.x1, w.x1); line.y0 = Math.min(line.y0, w.y0); line.y1 = Math.max(line.y1, w.y1);
    } else {
      lines.push({ words: [w], x0: w.x0, y0: w.y0, x1: w.x1, y1: w.y1 });
    }
  }
  for (const L of lines) {
    L.text = L.words.map((w) => w.text).join(' ').replace(/\s+/g, ' ').trim();
    L.conf = L.words.reduce((s, w) => s + w.conf, 0) / L.words.length;
  }
  return lines;
}

// Merge stacked lines into one label when at most one of them has its own leader line
// ("Superior / Vena Cava"), but keep stacked lists apart when each line has a leader.
export function linesToLabels(lines) {
  const items = lines.map((l) => ({ ...l, lines: [l] }));
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < items.length; i++) for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      const a = items[i], b = items[j];
      const h = Math.max(a.lines.at(-1).y1 - a.lines.at(-1).y0, b.lines[0].y1 - b.lines[0].y0);
      const vgap = b.y0 - a.y1;
      if (vgap < -0.3 * h || vgap > 0.75 * h) continue;
      const hov = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
      const aligned = hov > 0 || Math.abs(a.x0 - b.x0) < h || Math.abs(a.x1 - b.x1) < h ||
        Math.abs((a.x0 + a.x1) / 2 - (b.x0 + b.x1) / 2) < h;
      if (!aligned) continue;
      const leaders = (a.leader ? 1 : 0) + (b.leader ? 1 : 0);
      if (leaders > 1) continue;
      items[i] = {
        lines: [...a.lines, ...b.lines], leader: a.leader || b.leader,
        x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1),
      };
      items.splice(j, 1);
      merged = true;
      break outer;
    }
  }
  return items.map((it) => ({
    text: it.lines.map((l) => l.text).join(' ').replace(/\s+/g, ' ').trim(),
    x0: it.x0, y0: it.y0, x1: it.x1, y1: it.y1, leader: it.leader ?? null, lines: it.lines,
  }));
}
