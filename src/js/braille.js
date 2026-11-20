// Uncontracted (Grade 1) Unified English Braille for short labels, plus key generation.
// Dot masks: dot1=1, dot2=2, dot3=4, dot4=8, dot5=16, dot6=32. Source: docs/hackathon/TACTILE_SPEC.md §8.

const LETTER_DOTS = {
  a: [1], b: [1, 2], c: [1, 4], d: [1, 4, 5], e: [1, 5], f: [1, 2, 4], g: [1, 2, 4, 5], h: [1, 2, 5],
  i: [2, 4], j: [2, 4, 5], k: [1, 3], l: [1, 2, 3], m: [1, 3, 4], n: [1, 3, 4, 5], o: [1, 3, 5],
  p: [1, 2, 3, 4], q: [1, 2, 3, 4, 5], r: [1, 2, 3, 5], s: [2, 3, 4], t: [2, 3, 4, 5], u: [1, 3, 6],
  v: [1, 2, 3, 6], w: [2, 4, 5, 6], x: [1, 3, 4, 6], y: [1, 3, 4, 5, 6], z: [1, 3, 5, 6],
};
const PUNCT = {
  '.': [[2, 5, 6]], ',': [[2]], '-': [[3, 6]], "'": [[3]], ':': [[2, 5]], ';': [[2, 3]],
  '?': [[2, 3, 6]], '!': [[2, 3, 5]], '(': [[5], [1, 2, 6]], ')': [[5], [3, 4, 5]], '/': [[4, 5, 6], [3, 4]],
};
const DIGIT_LETTER = { 1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e', 6: 'f', 7: 'g', 8: 'h', 9: 'i', 0: 'j' };
const NUM = [3, 4, 5, 6], CAP = [6], G1 = [5, 6];

const mask = (dots) => dots.reduce((m, d) => m | (1 << (d - 1)), 0);
export const cellChar = (m) => String.fromCodePoint(0x2800 + m);

// Returns an array of cell masks (0 = blank cell / space).
export function toCells(text) {
  const cells = [];
  const words = text.trim().split(/\s+/);
  words.forEach((word, wi) => {
    if (wi) cells.push(0);
    const letters = word.replace(/[^A-Za-z]/g, '');
    const allCaps = letters.length >= 2 && letters === letters.toUpperCase();
    const loneLower = /^[a-z]$/.test(word);
    if (loneLower) cells.push(mask(G1)); // lone lowercase letter would read as a wordsign
    if (allCaps) cells.push(mask(CAP), mask(CAP));
    let inNum = false;
    for (const ch of word) {
      if (/[0-9]/.test(ch)) {
        if (!inNum) { cells.push(mask(NUM)); inNum = true; }
        cells.push(mask(LETTER_DOTS[DIGIT_LETTER[ch]]));
        continue;
      }
      if (/[A-Za-z]/.test(ch)) {
        const lower = ch.toLowerCase();
        if (inNum && lower <= 'j') cells.push(mask(G1)); // "3a": letter a-j after digits
        inNum = false;
        if (!allCaps && ch !== lower) cells.push(mask(CAP));
        cells.push(mask(LETTER_DOTS[lower]));
        continue;
      }
      inNum = false;
      if (PUNCT[ch]) for (const d of PUNCT[ch]) cells.push(mask(d));
    }
  });
  return cells;
}

export const toUnicode = (text) => toCells(text).map(cellChar).join('');

// Two-letter alphabetic keys. BANA: keys contain a letter with dot 3 or 6 and avoid
// aa/ac/cc/ca (confusable with numbers/contractions). Labels lower-case, no capitals.
const HAS_36 = new Set('klmnopqrstuvwxyz'.split(''));
const BANNED = new Set(['aa', 'ac', 'cc', 'ca']);
export function makeKeys(labels) {
  const used = new Set();
  const ok = (k) => k.length === 2 && !used.has(k) && !BANNED.has(k) && (HAS_36.has(k[0]) || HAS_36.has(k[1]));
  return labels.map((text) => {
    const words = text.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(Boolean);
    const joined = words.join('');
    const tries = [];
    if (words.length >= 2) tries.push(words[0][0] + words[1][0], words[0][0] + words.at(-1)[0]);
    for (let i = 1; i < joined.length; i++) tries.push(joined[0] + joined[i]);
    for (let i = 0; i < joined.length; i++) for (let j = i + 1; j < joined.length; j++) tries.push(joined[i] + joined[j]);
    let key = tries.find(ok);
    if (!key) {
      outer: for (const a of 'abcdefghijklmnopqrstuvwxyz') for (const b of 'klmnopqrstuvwxyz') if (ok(a + b)) { key = a + b; break outer; }
    }
    used.add(key);
    return key;
  });
}

// Physical braille geometry (mm), Library of Congress Spec 800 via BANA.
export const BRAILLE = { dotDiameter: 1.44, dotPitch: 2.34, cellPitch: 6.2, linePitch: 10.0 };

// Dot centers (mm) for a run of cells with the cell's top-left at (x, y).
export function cellDots(cells, x, y) {
  const pts = [];
  const offs = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]]; // dots 1..6 -> (col,row)
  cells.forEach((m, i) => {
    for (let d = 0; d < 6; d++) if (m & (1 << d)) {
      const [c, r] = offs[d];
      pts.push([x + i * BRAILLE.cellPitch + c * BRAILLE.dotPitch, y + r * BRAILLE.dotPitch]);
    }
  });
  return pts;
}
export const brailleWidth = (n) => (n - 1) * BRAILLE.cellPitch + BRAILLE.dotPitch;
export const brailleHeight = () => 2 * BRAILLE.dotPitch;
