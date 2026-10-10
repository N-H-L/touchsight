// Copies browser builds of dependencies and downloads model weights into app/vendor
// so the deployed static site has no runtime CDN dependencies.
import { mkdir, copyFile, readdir, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const nm = join(root, 'node_modules');
const out = join(root, 'app', 'vendor');

async function cp(src, dst) {
  await mkdir(join(dst, '..'), { recursive: true });
  await copyFile(src, dst);
}

async function fetchTo(url, dst) {
  try { if ((await stat(dst)).size > 0) return; } catch {}
  const res = await fetch(url, { headers: { 'User-Agent': 'TouchSight-vendor/0.1' } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  await mkdir(join(dst, '..'), { recursive: true });
  await writeFile(dst, Buffer.from(await res.arrayBuffer()));
  console.log('downloaded', url);
}

// OpenCV.js
await cp(join(nm, '@techstark/opencv-js/dist/opencv.js'), join(out, 'opencv/opencv.js'));

// Tesseract.js (main, worker, wasm core) + English model
for (const f of ['tesseract.esm.min.js', 'tesseract.min.js', 'worker.min.js']) {
  await cp(join(nm, 'tesseract.js/dist', f), join(out, 'tesseract', f));
}
for (const f of await readdir(join(nm, 'tesseract.js-core'))) {
  if (/\.(js|wasm)$/.test(f) && f !== 'index.js') await cp(join(nm, 'tesseract.js-core', f), join(out, 'tesseract/core', f));
}
await fetchTo('https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int/eng.traineddata.gz', join(out, 'tesseract/lang/eng.traineddata.gz'));

// transformers.js + onnxruntime-web wasm
await cp(join(nm, '@huggingface/transformers/dist/transformers.min.js'), join(out, 'transformers/transformers.min.js'));
for (const f of await readdir(join(nm, 'onnxruntime-web/dist'))) {
  if (/^ort-wasm.*\.(wasm|mjs)$/.test(f)) await cp(join(nm, 'onnxruntime-web/dist', f), join(out, 'ort', f));
}
for (const f of await readdir(join(nm, '@huggingface/transformers/dist'))) {
  if (/^ort-wasm.*\.(wasm|mjs)$/.test(f)) await cp(join(nm, '@huggingface/transformers/dist', f), join(out, 'ort', f));
}

// SlimSAM (Segment Anything, distilled) weights
const hf = 'https://huggingface.co/Xenova/slimsam-77-uniform/resolve/main/';
for (const f of ['config.json', 'preprocessor_config.json', 'onnx/vision_encoder.onnx', 'onnx/prompt_encoder_mask_decoder.onnx']) {
  await fetchTo(hf + f, join(root, 'app', 'models', 'Xenova', 'slimsam-77-uniform', f));
}
console.log('vendor done');
