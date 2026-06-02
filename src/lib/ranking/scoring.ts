export const clampScore = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

export const normalizeCount = (count: number, max: number): number => clampScore((count / max) * 100);

export const calculateMentionScore = ({
  newsExposureScore,
  searchTrendScore,
  communityScore,
  momentumScore,
}: {
  newsExposureScore: number;
  searchTrendScore: number;
  communityScore: number;
  momentumScore: number;
}): number =>
  clampScore(
    newsExposureScore * 0.45 +
      searchTrendScore * 0.30 +
      communityScore * 0.15 +
      momentumScore * 0.10,
  );
