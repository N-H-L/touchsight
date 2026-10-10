// Label-guided segmentation: each leader tip (or the spot under an in-figure label)
// becomes a point prompt for Segment Anything (SlimSAM, on-device).

export async function embedImage(sam, imageData) {
  const { T, model, processor } = sam;
  const raw = new T.RawImage(imageData.data, imageData.width, imageData.height, 4).rgb();
  const inputs = await processor(raw);
  const embeddings = await model.get_image_embeddings(inputs);
  return { inputs, embeddings, width: imageData.width, height: imageData.height };
}

// Returns a Uint8Array mask (1 = part) at image resolution, or null.
export async function segmentPoint(sam, emb, x, y, { minFrac = 0.0008, maxFrac = 0.45, negatives = [] } = {}) {
  const { T, model, processor } = sam;
  const [rh, rw] = emb.inputs.reshaped_input_sizes[0];
  const sx = rw / emb.width, sy = rh / emb.height;
  const pts = [[x * sx, y * sy], ...negatives.map(([nx, ny]) => [nx * sx, ny * sy])];
  const labels = [1, ...negatives.map(() => 0)];
  const input_points = new T.Tensor('float32', pts.flat(), [1, 1, pts.length, 2]);
  const input_labels = new T.Tensor('int64', labels.map(BigInt), [1, 1, labels.length]);
  const out = await model({ ...emb.embeddings, input_points, input_labels });
  const masks = await processor.post_process_masks(out.pred_masks, emb.inputs.original_sizes, emb.inputs.reshaped_input_sizes);
  const m = masks[0]; // [1, 3, H, W]
  const scores = out.iou_scores.data;
  const plane = emb.width * emb.height;
  let best = null;
  for (let k = 0; k < 3; k++) {
    const data = m.data.subarray(k * plane, (k + 1) * plane);
    let area = 0;
    for (let i = 0; i < plane; i++) area += data[i] ? 1 : 0;
    const frac = area / plane;
    if (frac < minFrac || frac > maxFrac) continue;
    if (!best || scores[k] > best.score) best = { k, score: scores[k], area, data };
  }
  if (!best) return null;
  const mask = new Uint8Array(plane);
  for (let i = 0; i < plane; i++) mask[i] = best.data[i] ? 1 : 0;
  return { mask, score: best.score, area: best.area };
}
