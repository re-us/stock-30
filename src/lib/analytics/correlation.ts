export function calculatePearsonCorrelation(x: number[], y: number[]): number | null {
  const length = Math.min(x.length, y.length);
  if (length < 2) return null;

  const xs = x.slice(-length).filter(Number.isFinite);
  const ys = y.slice(-length).filter(Number.isFinite);
  const safeLength = Math.min(xs.length, ys.length);
  if (safeLength < 2) return null;

  const safeX = xs.slice(-safeLength);
  const safeY = ys.slice(-safeLength);
  const meanX = safeX.reduce((sum, value) => sum + value, 0) / safeLength;
  const meanY = safeY.reduce((sum, value) => sum + value, 0) / safeLength;

  let numerator = 0;
  let varianceX = 0;
  let varianceY = 0;

  for (let index = 0; index < safeLength; index += 1) {
    const dx = safeX[index] - meanX;
    const dy = safeY[index] - meanY;
    numerator += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }

  if (varianceX === 0 || varianceY === 0) return null;

  const result = numerator / Math.sqrt(varianceX * varianceY);
  if (!Number.isFinite(result)) return null;
  return Math.max(-1, Math.min(1, result));
}
