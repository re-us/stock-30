export function calculateMean(values: number[]): number | null {
  const safeValues = values.filter(Number.isFinite);
  if (safeValues.length === 0) return null;
  return safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length;
}

export function calculateStandardDeviation(values: number[]): number | null {
  const safeValues = values.filter(Number.isFinite);
  if (safeValues.length < 2) return null;
  const mean = calculateMean(safeValues);
  if (mean === null) return null;
  const variance = safeValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) / safeValues.length;
  if (variance === 0) return null;
  return Math.sqrt(variance);
}

export function calculateZScore(current: number, values: number[]): number | null {
  if (!Number.isFinite(current)) return null;
  const mean = calculateMean(values);
  const standardDeviation = calculateStandardDeviation(values);
  if (mean === null || standardDeviation === null) return null;
  return (current - mean) / standardDeviation;
}

export function calculatePearsonCorrelation(x: number[], y: number[]): number | null {
  const length = Math.min(x.length, y.length);
  if (length < 2) return null;

  const xs = x.slice(-length);
  const ys = y.slice(-length);
  const meanX = calculateMean(xs);
  const meanY = calculateMean(ys);
  if (meanX === null || meanY === null) return null;

  let numerator = 0;
  let varianceX = 0;
  let varianceY = 0;

  for (let index = 0; index < length; index += 1) {
    const dx = xs[index] - meanX;
    const dy = ys[index] - meanY;
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
    numerator += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }

  if (varianceX === 0 || varianceY === 0) return null;
  const result = numerator / Math.sqrt(varianceX * varianceY);
  return Number.isFinite(result) ? clamp(result, -1, 1) : null;
}

export function calculateSpearmanCorrelation(x: number[], y: number[]): number | null {
  const length = Math.min(x.length, y.length);
  if (length < 2) return null;
  return calculatePearsonCorrelation(rankValues(x.slice(-length)), rankValues(y.slice(-length)));
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function rankValues(values: number[]): number[] {
  const sorted = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);
  const ranks = new Array<number>(values.length);

  for (let index = 0; index < sorted.length; index += 1) {
    ranks[sorted[index].index] = index + 1;
  }

  return ranks;
}
