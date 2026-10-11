// Label recall/precision of the app's detected labels (eval-out/eval.json) against
// hand-counted ground truth (app/samples/labels_truth.json). Fuzzy match: normalised
// Levenshtein similarity >= 0.8, or one contains the other with similar length.
import { readFile, writeFile } from 'node:fs/promises';

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
function lev(a, b) {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0]; d[0] = i;
    for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; }
  }
  return d[b.length];
}
export function match(det, truth) {
  const a = norm(det), b = norm(truth);
  if (!a || !b) return false;
  if (1 - lev(a, b) / Math.max(a.length, b.length) >= 0.8) return true;
  const [s, l] = a.length < b.length ? [a, b] : [b, a];
  return l.includes(s) && s.length / l.length >= 0.6;
}

const rows = JSON.parse(await readFile(process.argv[2] || 'eval-out/eval.json', 'utf8'));
const truth = JSON.parse(await readFile('app/samples/labels_truth.json', 'utf8'));
const out = ['| Sample | True labels | Found (matched) | Recall | Extra detections | Missed |', '|---|---|---|---|---|---|'];
let T = 0, M = 0;
for (const r of rows) {
  const t = truth[r.id]; if (!t || !r.labels) continue;
  const used = new Set();
  const missed = [];
  for (const lab of t) {
    const k = r.labels.findIndex((d, i) => !used.has(i) && match(d, lab));
    if (k >= 0) used.add(k); else missed.push(lab);
  }
  const m = t.length - missed.length;
  T += t.length; M += m;
  out.push(`| ${r.id} | ${t.length} | ${m} | ${Math.round(100 * m / t.length)}% | ${r.labels.length - used.size} | ${missed.join('; ')} |`);
}
out.push('', `Overall recall: ${M} of ${T} (${Math.round(100 * M / T)}%)`);
await writeFile('eval-out/recall.md', out.join('\n'));
console.log(out.join('\n'));
