export const clampScore = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

export const normalizeCount = (count: number, max: number): number => clampScore((count / max) * 100);

export const calculateMentionScore = ({
  newsExposureScore,
  searchTrendScore,
  communityScore,
  mentionMomentumScore,
  sentimentScore,
  sourceQualityScore,
}: {
  newsExposureScore: number;
  searchTrendScore: number;
  communityScore: number;
  mentionMomentumScore: number;
  sentimentScore: number;
  sourceQualityScore: number;
}): number =>
  clampScore(
    newsExposureScore * 0.25 +
      searchTrendScore * 0.20 +
      communityScore * 0.15 +
      mentionMomentumScore * 0.25 +
      sentimentScore * 0.10 +
      sourceQualityScore * 0.05,
  );
