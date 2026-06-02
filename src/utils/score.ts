import type { StockItem } from "@/types/stock";

export const MENTION_SCORE_WEIGHTS = {
  newsExposureScore: 0.25,
  searchTrendScore: 0.2,
  communityScore: 0.15,
  mentionMomentumScore: 0.25,
  sentimentScore: 0.1,
  sourceQualityScore: 0.05,
} as const;

// mentionScore는 0~100 범위의 온라인 관심도 점수입니다.
// 추후 API 연동 시 뉴스 노출, 검색 흐름, 커뮤니티 언급, 언급 변화,
// 반응 비율, 데이터 소스 품질을 위 비중으로 정규화해 합산합니다.
export const getMentionScore = (stock: StockItem): number => stock.mentionScore;
