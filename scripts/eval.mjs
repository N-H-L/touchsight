// Runs the real app in headless Chromium on every sample and records the
// guideline-check metrics for TouchSight vs. the edge-tracing baseline.
// Writes eval-out/eval.json, eval-out/eval.md and app/precomputed/<id>.svg (fallback gallery).
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';

const base = process.env.BASE || 'http://localhost:5173';
const samples = JSON.parse(await readFile('app/samples/samples.json', 'utf8'));
const only = process.argv.slice(2);
await mkdir('eval-out', { recursive: true });
await mkdir('app/precomputed', { recursive: true });
const browser = await chromium.launch();
const rows = [];
for (const s of samples) {
  if (only.length && !only.includes(s.id)) continue;
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const t0 = Date.now();
  try {
    await page.goto(`${base}/?sample=${s.id}`);
    await page.waitForFunction(() => /Done in|went wrong|Could not/.test(document.querySelector('#status')?.textContent || ''), null, { timeout: 240000 });
    const status = await page.textContent('#status');
    const r = await page.evaluate(() => {
      const st = window.__touchsight;
      if (!st?.check) return null;
      return { ours: st.check.ours, base: st.check.base, base2: st.check.base2, stats: st.layout.stats, timings: st.analysis.timings,
        labels: st.analysis.labels.map((L) => L.text), svg: null };
    });
    const svg = await page.evaluate(() => document.querySelector('#ours-small').innerHTML);
    if (svg) await writeFile(`app/precomputed/${s.id}.svg`, svg);
    rows.push({ id: s.id, category: s.category, status, wall_s: (Date.now() - t0) / 1000, ...r });
    console.log(s.id, status);
  } catch (e) {
    rows.push({ id: s.id, category: s.category, error: String(e.message || e) });
    console.log(s.id, 'ERROR', e.message);
  }
  await page.close();
}
await browser.close();
await writeFile('eval-out/eval.json', JSON.stringify(rows, null, 1));

const ok = rows.filter((r) => r.ours);
const md = ['| Sample | Cat. | Labels found | Braille labels | Print-label spots still marked (TS / edge) | Lines <3 mm, % of figure (TS / edge / edge−text) | Short fragments (TS / edge / edge−text) | Braille clear 3 mm | Run time (s) |', '|---|---|---|---|---|---|---|---|---|'];
for (const r of rows) {
  if (!r.ours) { md.push(`| ${r.id} | ${r.category} | error | | | | | | |`); continue; }
  const t = r.timings, run = ((t.ocr + t.sam_embed + t.sam_parts) / 1000).toFixed(1);
  const truth = samples.find((x) => x.id === r.id)?.labels_true;
  md.push(`| ${r.id} | ${r.category} | ${r.ours.printLabels}${truth ? ` of ${truth}` : ''} | ${r.ours.brailleLabels} | ${r.ours.printTextLeft} / ${r.base.printTextLeft} | ${r.ours.narrowGapPct} / ${r.base.narrowGapPct} / ${r.base2.narrowGapPct} | ${r.ours.fragments} / ${r.base.fragments} / ${r.base2.fragments} | ${r.ours.brailleClear}/${r.ours.brailleLabels} | ${run} |`);
}
const sum = (f) => ok.reduce((a, r) => a + f(r), 0);
md.push('', `Totals over ${ok.length} samples: print labels left as raised text ${sum((r) => r.ours.printTextLeft)} (TouchSight) vs ${sum((r) => r.base.printTextLeft)} (edge tracing) of ${sum((r) => r.ours.printLabels)}; ` +
  `short fragments ${sum((r) => r.ours.fragments)} vs ${sum((r) => r.base.fragments)}; ` +
  `short fragments vs text-erased tracing ${sum((r) => r.ours.fragments)} vs ${sum((r) => r.base2.fragments)}; ` +
  `mean narrow-gap area ${(sum((r) => r.ours.narrowGapPct) / ok.length).toFixed(1)}% vs ${(sum((r) => r.base.narrowGapPct) / ok.length).toFixed(1)}% (text-erased tracing ${(sum((r) => r.base2.narrowGapPct) / ok.length).toFixed(1)}%); ` +
  `braille labels with 3 mm clearance ${sum((r) => r.ours.brailleClear)} of ${sum((r) => r.ours.brailleLabels)}.`);
await writeFile('eval-out/eval.md', md.join('\n'));
console.log(md.join('\n'));
