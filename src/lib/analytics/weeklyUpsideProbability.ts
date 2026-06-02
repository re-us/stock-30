import { clamp } from "@/lib/analytics/statistics";
import type { DataQuality, ProbabilityGrade, WeeklyUpsideProbability } from "@/types/stock";

type Factor = WeeklyUpsideProbability["factors"][number];

export function calculateWeeklyUpsideProbability({
  mentionScore,
  mentionChangeRate,
  newsCount,
  searchScore,
  communityMentions,
  sentimentPositive,
  sentimentNegative,
  priceChangeRate = null,
  marketAdjustedReturn = null,
  hitRate = null,
  pearsonCorrelation = null,
  spearmanCorrelation = null,
  dataSourceCount = 1,
  sampleSize = 0,
}: {
  mentionScore: number;
  mentionChangeRate: number;
  newsCount: number;
  searchScore: number;
  communityMentions: number;
  sentimentPositive: number;
  sentimentNegative: number;
  priceChangeRate?: number | null;
  marketAdjustedReturn?: number | null;
  hitRate?: number | null;
  pearsonCorrelation?: number | null;
  spearmanCorrelation?: number | null;
  dataSourceCount?: number;
  sampleSize?: number;
}): WeeklyUpsideProbability {
  const dataQuality = getDataQuality(dataSourceCount, sampleSize);
  const sentimentGap = sentimentPositive - sentimentNegative;
  const mentionMomentumScore = clamp(50 + mentionChangeRate * 1.4, 0, 100);
  const weeklyMentionScore = clamp(normalize(mentionScore, 100) * 0.55 + normalize(communityMentions, 13000) * 0.3 + normalize(searchScore, 100) * 0.15, 0, 100);
  const priceFlowScore = priceChangeRate === null ? 50 : clamp(50 + priceChangeRate * 3, 0, 100);
  const sentimentScore = clamp(50 + sentimentGap * 0.95, 0, 100);
  const attentionPriceScore = clamp((mentionMomentumScore + priceFlowScore) / 2 + (marketAdjustedReturn ?? 0) * 1.4, 0, 100);

  const factors: Factor[] = [
    buildFactor("이번주 언급량", weeklyMentionScore, "이번주 언급 점수, 커뮤니티 언급량, 검색 관심도를 함께 반영했습니다."),
    buildFactor("언급 변화", mentionMomentumScore, "전일 대비 언급 증가율이 높을수록 관심도 흐름에 더 반영됩니다."),
    buildFactor("긍정/부정 반응", sentimentScore, "긍정 언급과 부정 언급의 차이를 상승확률 계산에 반영했습니다."),
    buildFactor("전주 가격 흐름", priceFlowScore, "지난주 가격 흐름은 언급량 대비 참고 신호로만 반영했습니다."),
    buildFactor("관심-가격 동행", attentionPriceScore, "언급량 변화와 가격 흐름이 같은 방향으로 움직이는지 함께 참고했습니다."),
  ];

  let probability =
    50 +
    normalizeContribution(mentionScore, 100, 8) +
    signedContribution(mentionChangeRate, 35, 10) +
    normalizeContribution(newsCount, 120, 5) +
    normalizeContribution(searchScore, 100, 5) +
    normalizeContribution(communityMentions, 13000, 6) +
    signedContribution(sentimentGap, 60, 11);

  probability += priceChangeRate === null ? 0 : signedContribution(priceChangeRate, 12, 9);
  probability += marketAdjustedReturn === null ? 0 : signedContribution(marketAdjustedReturn, 10, 7);
  probability += hitRate === null ? 0 : signedContribution(hitRate - 50, 50, 7);
  probability += correlationContribution(pearsonCorrelation, spearmanCorrelation);

  if (dataQuality === "limited") {
    probability = 50 + (probability - 50) * 0.45;
  }

  const safeProbability = Math.round(clamp(probability, 35, 82));
  const grade = getGrade(safeProbability);

  return {
    probability: safeProbability,
    grade,
    dataQuality,
    label: getLabel(grade),
    summary: getSummary(grade, dataQuality),
    factors,
  };
}

function normalize(value: number, max: number): number {
  return clamp((safeNumber(value) / max) * 100, 0, 100);
}

function normalizeContribution(value: number, max: number, weight: number): number {
  return (normalize(value, max) / 100) * weight;
}

function signedContribution(value: number, range: number, weight: number): number {
  return clamp(safeNumber(value) / range, -1, 1) * weight;
}

function correlationContribution(pearson: number | null, spearman: number | null): number {
  const values = [pearson, spearman].filter((value): value is number => value !== null && Number.isFinite(value));
  if (!values.length) return 0;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return clamp(average, -1, 1) * 5;
}

function getDataQuality(dataSourceCount: number, sampleSize: number): DataQuality {
  if (dataSourceCount >= 4 && sampleSize >= 20) return "rich";
  if (dataSourceCount >= 2 && sampleSize >= 8) return "normal";
  return "limited";
}

function getGrade(probability: number): ProbabilityGrade {
  if (probability < 48) return "conservative";
  if (probability < 57) return "neutral";
  if (probability < 68) return "positive";
  return "strong";
}

function getLabel(grade: ProbabilityGrade): string {
  if (grade === "conservative") return "관심도는 있으나 가격 흐름 확인이 필요한 구간";
  if (grade === "neutral") return "관심도와 가격 흐름이 중립적으로 관찰되는 구간";
  if (grade === "positive") return "온라인 관심도와 가격 흐름이 비교적 우호적인 구간";
  return "관심도, 뉴스 노출, 가격 흐름이 함께 강해진 구간";
}

function getSummary(grade: ProbabilityGrade, dataQuality: DataQuality): string {
  const quality = dataQuality === "rich" ? "충분한" : dataQuality === "normal" ? "보통 수준의" : "제한적인";
  if (grade === "positive" || grade === "strong") {
    return `${quality} 데이터에서 온라인 노출량과 검색 관심도가 높게 관찰되며 가격 흐름도 일부 동반되는 모습입니다. 이 수치는 투자 판단을 위한 보조 자료입니다.`;
  }
  return `${quality} 데이터에서 관심도는 확인되지만 가격 흐름과의 연결은 제한적으로 관찰됩니다. 이 수치는 투자 판단을 위한 보조 자료입니다.`;
}

function buildFactor(name: string, score: number, description: string): Factor {
  return {
    name,
    score: Math.round(clamp(score, 0, 100)),
    description,
  };
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}
