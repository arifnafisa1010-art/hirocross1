// VBT (Velocity Based Training) core utilities: marker tracking, auto scale
// calibration and rep detection from vertical displacement samples.

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface TrackResult {
  /** centroid x in canvas px */
  x: number;
  /** centroid y in canvas px */
  y: number;
  /** blob width in px */
  width: number;
  /** blob height in px */
  height: number;
  /** number of matched pixels */
  pixels: number;
}

export interface VbtRep {
  index: number;
  /** mean concentric velocity (m/s) */
  mpv: number;
  /** peak velocity (m/s) */
  peak: number;
  /** range of motion (m) */
  rom: number;
  /** concentric duration (s) */
  duration: number;
  timestamp: number;
}

export interface VbtSample {
  t: number; // seconds
  y: number; // meters, upward positive
}

/** Squared distance in RGB space, normalised 0..1 */
export function colorDistance(a: RgbColor, b: RgbColor): number {
  const dr = (a.r - b.r) / 255;
  const dg = (a.g - b.g) / 255;
  const db = (a.b - b.b) / 255;
  return Math.sqrt((dr * dr + dg * dg + db * db) / 3);
}

/**
 * Finds the centroid + bounding box of pixels matching `target` colour.
 * `tolerance` is 0..1 (higher = looser match). Sub-samples every 2px for speed.
 */
export function trackMarker(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  target: RgbColor,
  tolerance: number,
): TrackResult | null {
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  const step = 2;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const px = { r: data[i], g: data[i + 1], b: data[i + 2] };
      if (colorDistance(px, target) <= tolerance) {
        sumX += x;
        sumY += y;
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (count < 12) return null;

  return {
    x: sumX / count,
    y: sumY / count,
    width: maxX - minX,
    height: maxY - minY,
    pixels: count,
  };
}

/**
 * Automatic scale calibration: converts the tracked blob size (px) into a
 * metres-per-pixel factor using the known real diameter of the reference
 * object (plate 45cm / marker sticker etc.). Because it is recomputed from the
 * live blob, the scale stays consistent at any camera distance or screen size.
 */
export function metersPerPixel(blobSizePx: number, realDiameterCm: number): number | null {
  if (blobSizePx < 4 || realDiameterCm <= 0) return null;
  return realDiameterCm / 100 / blobSizePx;
}

/** Exponential smoothing helper for a noisy scale estimate. */
export function smoothScale(prev: number | null, next: number, alpha = 0.15): number {
  if (prev === null || !Number.isFinite(prev)) return next;
  return prev * (1 - alpha) + next * alpha;
}

const MIN_ROM = 0.15; // m — ignore jitter / partial movements
const MIN_DURATION = 0.15; // s
const VELOCITY_THRESHOLD = 0.15; // m/s to consider movement started

/**
 * Detects a completed concentric (upward) rep from a rolling sample buffer.
 * Returns rep metrics when the bar stops rising, otherwise null.
 */
export function detectRep(samples: VbtSample[]): Omit<VbtRep, 'index' | 'timestamp'> | null {
  if (samples.length < 6) return null;

  // Walk backwards to find the last continuous upward run.
  let end = samples.length - 1;
  // Confirm movement has stopped (last few samples ~ static or downward)
  const tailVel = velocityAt(samples, end);
  if (tailVel > VELOCITY_THRESHOLD * 0.5) return null;

  while (end > 0 && velocityAt(samples, end) <= VELOCITY_THRESHOLD) end--;
  if (end <= 1) return null;

  let start = end;
  while (start > 1 && velocityAt(samples, start) > VELOCITY_THRESHOLD * 0.4) start--;

  const rom = samples[end].y - samples[start].y;
  const duration = samples[end].t - samples[start].t;
  if (rom < MIN_ROM || duration < MIN_DURATION) return null;

  let peak = 0;
  for (let i = start + 1; i <= end; i++) {
    const v = velocityAt(samples, i);
    if (v > peak) peak = v;
  }

  const mpv = rom / duration;
  if (!Number.isFinite(mpv) || mpv <= 0) return null;

  return { mpv, peak, rom, duration };
}

export function velocityAt(samples: VbtSample[], i: number): number {
  if (i <= 0 || i >= samples.length) return 0;
  const dt = samples[i].t - samples[i - 1].t;
  if (dt <= 0) return 0;
  return (samples[i].y - samples[i - 1].y) / dt;
}

export function velocityLossPercent(best: number, current: number): number {
  if (best <= 0) return 0;
  return Math.max(0, ((best - current) / best) * 100);
}

/** Load-velocity zone guidance (Gonzalez-Badillo style reference table). */
export function velocityZone(mpv: number): { label: string; hint: string; tone: 'green' | 'blue' | 'amber' | 'red' } {
  if (mpv >= 1.3) return { label: 'Starting Strength', hint: '~30-45% 1RM · kecepatan maksimal', tone: 'green' };
  if (mpv >= 1.0) return { label: 'Speed-Strength', hint: '~45-60% 1RM · power tinggi', tone: 'blue' };
  if (mpv >= 0.75) return { label: 'Power', hint: '~60-75% 1RM · zona daya maksimum', tone: 'blue' };
  if (mpv >= 0.5) return { label: 'Strength-Speed', hint: '~75-85% 1RM · kekuatan cepat', tone: 'amber' };
  return { label: 'Absolute Strength', hint: '>85% 1RM · kekuatan maksimal', tone: 'red' };
}
