let potracePromise;
async function loadPotrace() {
  if (!potracePromise) {
    potracePromise = import('../vendor/potrace/index.js').then(async (module) => {
      await module.init();
      return module.potrace;
    }).catch((error) => {
      potracePromise = null;
      throw new Error('Could not initialize local Potrace: ' + (error?.message || error));
    });
  }
  return potracePromise;
}
export async function prepareAutotrace(sourceImageData) {
  if (!sourceImageData?.width || !sourceImageData?.height || !sourceImageData.data) throw new TypeError('Autotrace requires valid ImageData.');
  const potrace = await loadPotrace();
  const svg = await potrace(sourceImageData, { turdsize: 4, turnpolicy: 4, alphamax: 1, opticurve: 1, opttolerance: 0.25, pathonly: false, extractcolors: true, posterizelevel: 4, posterizationalgorithm: 0 });
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const image = new Image(); image.src = url; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = sourceImageData.width; canvas.height = sourceImageData.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Canvas 2D context is unavailable.');
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const cleaned = context.getImageData(0, 0, canvas.width, canvas.height);
    let visible = false;
    for (let i = 0; i < cleaned.data.length; i += 4) if (cleaned.data[i] < 245 || cleaned.data[i + 1] < 245 || cleaned.data[i + 2] < 245) { visible = true; break; }
    if (!visible) throw new Error('Potrace produced no visible diagram contours.');
    return cleaned;
  } finally { URL.revokeObjectURL(url); }
}