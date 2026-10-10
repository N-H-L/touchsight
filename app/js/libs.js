// Lazy loaders for the three on-device engines. Everything is served from this
// site (app/vendor, app/models), so nothing leaves the user's machine.

const base = new URL('..', import.meta.url).href; // .../app/

let cvPromise;
export function loadOpenCV() {
  cvPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = base + 'vendor/opencv/opencv.js';
    s.async = true;
    s.onerror = () => reject(new Error('Could not load OpenCV.js'));
    s.onload = async () => {
      const cv = window.cv;
      // The Emscripten module is a thenable that resolves to itself; awaiting it
      // (or resolving a promise with it) loops forever, so wait then drop `then`.
      if (typeof cv.then === 'function') await new Promise((r) => cv.then(() => r()));
      else if (!cv.Mat) await new Promise((r) => { cv.onRuntimeInitialized = r; });
      delete cv.then;
      resolve(cv);
    };
    document.head.appendChild(s);
  });
  return cvPromise;
}

let ocrPromise;
export function loadOCR(onProgress) {
  ocrPromise ??= (async () => {
    const { createWorker } = (await import(base + 'vendor/tesseract/tesseract.esm.min.js')).default;
    const worker = await createWorker('eng', 1, {
      workerPath: base + 'vendor/tesseract/worker.min.js',
      corePath: base + 'vendor/tesseract/core',
      langPath: base + 'vendor/tesseract/lang',
      gzip: true,
      logger: (m) => onProgress?.(m),
    });
    // PSM 11 = sparse text: diagram labels are scattered, not paragraphs.
    await worker.setParameters({ tessedit_pageseg_mode: '11', preserve_interword_spaces: '1' });
    return worker;
  })();
  return ocrPromise;
}

let samPromise;
export function loadSAM() {
  samPromise ??= (async () => {
    const T = await import(base + 'vendor/transformers/transformers.min.js');
    T.env.allowRemoteModels = false;
    T.env.allowLocalModels = true;
    T.env.localModelPath = base + 'models/';
    T.env.backends.onnx.wasm.wasmPaths = base + 'vendor/ort/';
    // WASM everywhere: the WebGPU path is untested across judges' GPUs and the
    // CPU embed only costs a few seconds for this distilled model.
    const device = 'wasm';
    void hasWebGPU;
    const id = 'Xenova/slimsam-77-uniform';
    const model = await T.SamModel.from_pretrained(id, { dtype: 'fp32', device });
    const processor = await T.AutoProcessor.from_pretrained(id);
    return { T, model, processor, device };
  })();
  return samPromise;
}

async function hasWebGPU() {
  try {
    if (!navigator.gpu) return false;
    return !!(await navigator.gpu.requestAdapter());
  } catch { return false; }
}
