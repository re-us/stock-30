export function calculateHitRate({
  mentionChanges,
  futureExcessReturns,
  mentionThreshold = 0,
}: {
  mentionChanges: number[];
  futureExcessReturns: number[];
  mentionThreshold?: number;
}): {
  hitRate: number | null;
  sampleSize: number;
} {
  const length = Math.min(mentionChanges.length, futureExcessReturns.length);
  let signals = 0;
  let hits = 0;

  for (let index = 0; index < length; index += 1) {
    const mentionChange = mentionChanges[index];
    const excessReturn = futureExcessReturns[index];
    if (!Number.isFinite(mentionChange) || !Number.isFinite(excessReturn)) continue;
    if (mentionChange >= mentionThreshold) {
      signals += 1;
      if (excessReturn > 0) hits += 1;
    }
  }

  return {
    hitRate: signals === 0 ? null : hits / signals,
    sampleSize: signals,
  };
}
