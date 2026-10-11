// Finds the printed labels in a diagram: Tesseract word boxes -> text lines.
// Lines are merged into multi-line labels later, once we know which lines own a leader line.

import { isPhrase, isKnownLabel } from './vocab.js';

const WORDISH = /[A-Za-z0-9]/;

export async function recognizeWords(worker, canvas) {
  const { data } = await worker.recognize(canvas, {}, { blocks: true });
  const words = [];
  for (const b of data.blocks ?? []) for (const p of b.paragraphs) for (const l of p.lines) for (const w of l.words) {
    const text = w.text.trim().replace(/^[^A-Za-z0-9(]+|[^A-Za-z0-9)]+$/g, '');
    const { x0, y0, x1, y1 } = w.bbox;
    words.push({ text, conf: w.confidence, x0, y0, x1, y1 });
  }
  return words;
}

// Union of words from several OCR passes; overlapping boxes keep the more confident word.
export function mergeWordSets(...sets) {
  const out = [];
  const iou = (a, b) => {
    const ix = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0));
    const iy = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
    const inter = ix * iy;
    return inter / ((a.x1 - a.x0) * (a.y1 - a.y0) + (b.x1 - b.x0) * (b.y1 - b.y0) - inter);
  };
  for (const set of sets) for (const w of set) {
    const i = out.findIndex((o) => iou(o, w) > 0.3);
    if (i < 0) out.push(w);
    else if (w.conf > out[i].conf) out[i] = w;
  }
  return out;
}

export function filterWords(words, W, H) {
  return words.filter((w) => {
    const h = w.y1 - w.y0, wd = w.x1 - w.x0;
    if (!WORDISH.test(w.text)) return false;
    if (!w.vertical && (h < 7 || h > H * 0.09 || wd > W * 0.6)) return false;
    const alnum = w.text.replace(/[^A-Za-z0-9]/g, '').length;
    // Short tokens need high confidence; drawings often produce 1-2 char garbage.
    if (alnum <= 2) return w.conf >= 80 && /^[A-Za-z0-9]{1,2}$/.test(w.text.replace(/[()]/g, ''));
    if (alnum === 3) return w.conf >= 75;
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
      // Two leaders block the merge unless they are the same physical line (a leader
      // that starts between two stacked lines gets claimed by both).
      // A known two-line term ("Pulmonary" / "Artery") always merges.
      const phrase = isPhrase(`${a.lines.map((l) => l.text).join(' ')} ${b.lines.map((l) => l.text).join(' ')}`);
      if (a.leader && b.leader && !phrase && !sameLeader(a.leader, b.leader, h)) continue;
      if (a.lines.length + b.lines.length > 3) continue;
      const at = a.lines.map((l) => l.text).join(' '), bt = b.lines.map((l) => l.text).join(' ');
      const continuation = phrase || /^\(/.test(bt) || (at.split('(').length > at.split(')').length);
      // A column of 3+ evenly stacked lines is a list of separate labels
      // ("Nucleus" / "Nuclear pore" / "Chromatin"); an isolated pair is one label.
      // Two complete terms ("Rough endoplasmic reticulum" / "Smooth endoplasmic reticulum") stay apart.
      if (!continuation && isKnownLabel(at) && isKnownLabel(bt)) continue;
      if (!continuation && inColumn(items, a, b, h)) {
        const lowerCont = /^[a-z]/.test(bt) && /^[A-Z]/.test(at) && !isKnownLabel(bt);
        if (!lowerCont) continue;
      }
      items[i] = {
        lines: [...a.lines, ...b.lines], leader: longer(a.leader, b.leader),
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

// Is there another line stacked directly above `a` or below `b` with a similar gap?
function inColumn(items, a, b, h) {
  const gap = b.y0 - a.y1;
  const near = (x, y) => Math.abs(x.x0 - y.x0) < 1.2 * h || Math.abs(x.x1 - y.x1) < 1.2 * h || Math.abs((x.x0 + x.x1) / 2 - (y.x0 + y.x1) / 2) < 1.2 * h;
  return items.some((c) => c !== a && c !== b && (
    (near(c, a) && Math.abs((a.y0 - c.y1) - gap) < 0.6 * h && a.y0 - c.y1 > -0.3 * h) ||
    (near(c, b) && Math.abs((c.y0 - b.y1) - gap) < 0.6 * h && c.y0 - b.y1 > -0.3 * h)));
}

const len = (l) => Math.hypot(l.x2 - l.x1, l.y2 - l.y1);
function longer(a, b) { if (!a) return b; if (!b) return a; return len(a) >= len(b) ? a : b; }
function sameLeader(a, b, h) {
  const ds = Math.hypot(a.x1 - b.x1, a.y1 - b.y1);
  let da = Math.abs(Math.atan2(a.y2 - a.y1, a.x2 - a.x1) - Math.atan2(b.y2 - b.y1, b.x2 - b.x1));
  if (da > Math.PI) da = 2 * Math.PI - da;
  return ds < 1.6 * h && da < 0.2;
}
