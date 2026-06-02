import { clamp } from "@/lib/analytics/statistics";
import type { DataQuality, ModelReliabilityLabel, ProbabilityGrade, WeeklyUpsideProbability } from "@/types/stock";

type Factor = WeeklyUpsideProbability["factors"][number];

type WeeklyUpsideParams = {
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
  similarPatternHitRate?: number | null;
  backtestHitRate5d?: number | null;
  calibrationAdjustment?: number | null;
  modelReliabilityScore?: number | null;
  pearsonCorrelation?: number | null;
  spearmanCorrelation?: number | null;
  dataSourceCount?: number;
  sampleSize?: number;
};

export function calculateWeeklyUpsideProbability(params: WeeklyUpsideParams): WeeklyUpsideProbability {
  const mentionScore = safe(params.mentionScore);
  const mentionChangeRate = safe(params.mentionChangeRate);
  const newsCount = safe(params.newsCount);
  const searchScore = safe(params.searchScore);
  const communityMentions = safe(params.communityMentions);
  const sentimentPositive = safe(params.sentimentPositive);
  const sentimentNegative = safe(params.sentimentNegative);
  const dataSourceCount = Math.max(0, Math.round(safe(params.dataSourceCount ?? 1)));
  const sampleSize = Math.max(0, Math.round(safe(params.sampleSize ?? 0)));
  const hitRate = firstFinite(params.backtestHitRate5d, params.similarPatternHitRate, params.hitRate);
  const modelReliabilityScore = clamp(
    params.modelReliabilityScore ?? calculateModelReliabilityScore({ sampleSize, hitRate, dataSourceCount }),
    0,
    100,
  );
  const modelReliabilityLabel = getModelReliabilityLabel(modelReliabilityScore, sampleSize);
  const dataQuality = getDataQuality(dataSourceCount, sampleSize);
  const sentimentGap = sentimentPositive - sentimentNegative;
  const newsExposureScore = normalize(newsCount, 180);
  const communityScore = normalize(communityMentions, 14000);
  const mentionMomentumScore = clamp(50 + mentionChangeRate * 1.35, 0, 100);
  const sentimentScore = clamp(50 + sentimentGap * 0.9, 0, 100);
  const priceFlowScore = params.priceChangeRate === null || params.priceChangeRate === undefined ? 50 : clamp(50 + safe(params.priceChangeRate) * 3, 0, 100);
  const reliabilityFactorScore = hitRate === null ? modelReliabilityScore : clamp((hitRate + modelReliabilityScore) / 2, 0, 100);

  const rawProbability =
    50 +
    centeredContribution(mentionScore, 50, 6) +
    centeredContribution(newsExposureScore, 50, 5) +
    centeredContribution(searchScore, 50, 5) +
    centeredContribution(communityScore, 50, 4) +
    signedContribution(mentionChangeRate, 35, 8) +
    signedContribution(sentimentGap, 60, 8) +
    priceContribution(params.priceChangeRate, 12, 7) +
    priceContribution(params.marketAdjustedReturn, 10, 5) +
    hitRateContribution(hitRate) +
    correlationContribution(params.pearsonCorrelation ?? null, params.spearmanCorrelation ?? null) +
    clamp(params.calibrationAdjustment ?? 0, -6, 6);

  const reliabilityWeight = getReliabilityWeight(modelReliabilityScore, hitRate);
  let probability = 50 * (1 - reliabilityWeight) + rawProbability * reliabilityWeight;

  if (dataQuality === "limited") {
    probability = clamp(50 + (probability - 50) * 0.28, 48, 55);
  }

  if (probability >= 70 && !allowsHighProbability({ mentionScore, mentionChangeRate, searchScore, newsExposureScore, sentimentGap, priceChangeRate: params.priceChangeRate ?? null, hitRate, modelReliabilityScore })) {
    probability = 69;
  }

  const safeProbability = Math.round(clamp(probability, 35, 82));
  const grade = getGrade(safeProbability);

  return {
    probability: safeProbability,
    grade,
    dataQuality,
    modelReliabilityScore: Math.round(modelReliabilityScore),
    modelReliabilityLabel,
    label: getLabel(grade),
    summary: getSummary(grade, dataQuality, modelReliabilityLabel),
    factors: [
      buildFactor("온라인 관심도", blend([mentionScore, searchScore, communityScore]), "관심도 점수, 검색 관심도, 커뮤니티 언급량을 함께 반영합니다."),
      buildFactor("언급 변화", mentionMomentumScore, "전일 대비 관심량 증가 흐름을 반영합니다."),
      buildFactor("반응 흐름", sentimentScore, "긍정 반응과 부정 반응의 차이를 반영합니다."),
      buildFactor("가격 흐름", priceFlowScore, "가격 흐름 데이터가 있을 때만 보조 지표로 반영합니다."),
      buildFactor("검증 신뢰도", reliabilityFactorScore, "표본 수와 hit rate가 쌓일수록 영향이 커집니다."),
    ],
  };
}

function calculateModelReliabilityScore({ sampleSize, hitRate, dataSourceCount }: { sampleSize: number; hitRate: number | null; dataSourceCount: number }): number {
  const sampleCap = sampleSize < 30 ? 40 : sampleSize < 100 ? 60 : 75;
  const sampleBase =
    sampleSize < 30
      ? 18 + (sampleSize / 30) * 22
      : sampleSize < 100
        ? 40 + ((sampleSize - 30) / 70) * 20
        : 60 + Math.min((sampleSize - 100) / 200, 1) * 15;
  const hitRateBoost = hitRate === null ? 0 : hitRate >= 55 ? 8 : hitRate <= 50 ? -8 : 2;
  const sourceBoost = clamp(dataSourceCount - 1, 0, 4) * 2;
  return clamp(sampleBase + hitRateBoost + sourceBoost, 0, sampleCap);
}

function allowsHighProbability({
  mentionScore,
  mentionChangeRate,
  searchScore,
  newsExposureScore,
  sentimentGap,
  priceChangeRate,
  hitRate,
  modelReliabilityScore,
}: {
  mentionScore: number;
  mentionChangeRate: number;
  searchScore: number;
  newsExposureScore: number;
  sentimentGap: number;
  priceChangeRate: number | null;
  hitRate: number | null;
  modelReliabilityScore: number;
}): boolean {
  const attentionIsStrong = mentionScore >= 72 && mentionChangeRate >= 12;
  const exposureIsStrong = searchScore >= 65 || newsExposureScore >= 60;
  const reactionIsStrong = sentimentGap >= 10;
  const priceIsNotWeak = priceChangeRate === null || priceChangeRate >= 0;
  const validationIsStrong = (hitRate !== null && hitRate >= 55) || modelReliabilityScore >= 55;
  return attentionIsStrong && exposureIsStrong && reactionIsStrong && priceIsNotWeak && validationIsStrong;
}

function getReliabilityWeight(modelReliabilityScore: number, hitRate: number | null): number {
  if (hitRate === null) return modelReliabilityScore < 45 ? 0.34 : 0.48;
  if (modelReliabilityScore < 40) return 0.42;
  if (modelReliabilityScore < 60) return 0.58;
  if (modelReliabilityScore < 70) return 0.72;
  return 0.84;
}

function getDataQuality(dataSourceCount: number, sampleSize: number): DataQuality {
  if (dataSourceCount >= 4 && sampleSize >= 100) return "rich";
  if (dataSourceCount >= 2 && sampleSize >= 30) return "normal";
  return "limited";
}

function getModelReliabilityLabel(score: number, sampleSize: number): ModelReliabilityLabel {
  if (sampleSize < 30 || score < 45) return "데이터 축적 중";
  if (score < 65) return "보통";
  return "양호";
}

function getGrade(probability: number): ProbabilityGrade {
  if (probability < 48) return "conservative";
  if (probability < 57) return "neutral";
  if (probability < 68) return "positive";
  return "strong";
}

function getLabel(grade: ProbabilityGrade): string {
  if (grade === "conservative") return "온라인 관심도와 가격 흐름을 더 확인할 필요가 있는 구간";
  if (grade === "neutral") return "온라인 관심도와 가격 흐름이 중립적으로 관찰되는 구간";
  if (grade === "positive") return "온라인 관심도와 가격 흐름이 비교적 우호적인 구간";
  return "여러 지표가 동시에 강하게 관찰되는 구간";
}

function getSummary(grade: ProbabilityGrade, dataQuality: DataQuality, reliabilityLabel: ModelReliabilityLabel): string {
  const quality = dataQuality === "rich" ? "충분한" : dataQuality === "normal" ? "보통 수준의" : "제한적인";
  if (grade === "positive" || grade === "strong") {
    return `${quality} 데이터에서 온라인 노출, 반응 흐름, 가격 흐름이 함께 관찰됩니다. 모델 신뢰도는 ${reliabilityLabel}이며, 이 수치는 투자 판단을 위한 보조 자료입니다.`;
  }
  return `${quality} 데이터에서 온라인 관심도는 관찰되지만 검증 표본은 아직 제한적입니다. 모델 신뢰도는 ${reliabilityLabel}이며, 이 수치는 투자 판단을 위한 보조 자료입니다.`;
}

function buildFactor(name: string, score: number, description: string): Factor {
  return {
    name,
    score: Math.round(clamp(score, 0, 100)),
    description,
  };
}

function normalize(value: number, max: number): number {
  return clamp((safe(value) / max) * 100, 0, 100);
}

function centeredContribution(value: number, center: number, weight: number): number {
  return clamp((safe(value) - center) / 50, -1, 1) * weight;
}

function signedContribution(value: number, range: number, weight: number): number {
  return clamp(safe(value) / range, -1, 1) * weight;
}

function priceContribution(value: number | null | undefined, range: number, weight: number): number {
  if (value === null || value === undefined || !Number.isFinite(value)) return 0;
  return signedContribution(value, range, weight);
}

function hitRateContribution(hitRate: number | null): number {
  if (hitRate === null) return 0;
  return clamp((hitRate - 50) / 20, -1, 1) * 16;
}

function correlationContribution(pearson: number | null, spearman: number | null): number {
  const values = [pearson, spearman].filter((value): value is number => value !== null && Number.isFinite(value));
  if (!values.length) return 0;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return clamp(average, -1, 1) * 4;
}

function blend(values: number[]): number {
  const safeValues = values.filter(Number.isFinite);
  if (!safeValues.length) return 50;
  return safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length;
}

function firstFinite(...values: Array<number | null | undefined>): number | null {
  return values.find((value): value is number => value !== null && value !== undefined && Number.isFinite(value)) ?? null;
}

function safe(value: number): number {
  return Number.isFinite(value) ? value : 0;
}
