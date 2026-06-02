export const formatNumber = (value: number): string => new Intl.NumberFormat("ko-KR").format(value);

export const formatPercent = (value: number): string => `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

export const formatMentionScore10 = (value: number): string => (Math.max(0, Math.min(100, value)) / 10).toFixed(1);

export const formatRankChange = (rank: number, previousRank: number | null): string => {
  if (previousRank === null) return "NEW";
  const diff = previousRank - rank;
  if (diff > 0) return `▲${diff}`;
  if (diff < 0) return `▼${Math.abs(diff)}`;
  return "-";
};
