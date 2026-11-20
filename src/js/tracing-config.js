// Centralized, monotonic tracing controls. Sensitivity changes candidate recovery;
// tactile-size and braille-clearance constraints remain enforced downstream.
export const DEFAULT_TRACING_SENSITIVITY = 55;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function tracingConfig(value = DEFAULT_TRACING_SENSITIVITY) {
  const sensitivity = clamp(Number.isFinite(Number(value)) ? Number(value) : DEFAULT_TRACING_SENSITIVITY, 0, 100);
  const t = sensitivity / 100;
  return {
    sensitivity,
    foregroundDistance: 28 - 14 * t,
    cannyLow: Math.round(60 - 30 * t),
    cannyHigh: Math.round(160 - 65 * t),
    regionStep: 18 - 8 * t,
    blackhatThreshold: Math.round(35 - 15 * t),
    tophatThreshold: Math.round(50 - 20 * t),
    minRegionArea: 0.0012 - 0.00055 * t,
    minStroke: 0.03 - 0.012 * t,
    foregroundKernelScale: 0.005 - 0.0018 * t,
    foregroundMinArea: 0.002 - 0.0012 * t,
  };
}
