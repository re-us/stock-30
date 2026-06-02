import { calculateHitRate } from "@/lib/analytics/hitRate";
import { calculateExcessReturn } from "@/lib/analytics/marketAdjustedReturn";
import {
  calculatePearsonCorrelation,
  calculateSpearmanCorrelation,
  calculateZScore,
  clamp,
} from "@/lib/analytics/statistics";
import type { HorizonSignal, QuantSignal, SignalConfidence, SignalHorizon } from "@/types/stock";

const horizons: SignalHorizon[] = ["6H", "24H", "3D", "5D"];

export function calculateQuantSignal({
  mentionHistory,
  priceReturnsByHorizon,
  marketReturnsByHorizon,
  currentMentionCount,
}: {
  mentionHistory: number[];
  priceReturnsByHorizon: Record<SignalHorizon, number[]>;
  marketReturnsByHorizon?: Record<SignalHorizon, number[]>;
  currentMentionCount: number;
}): QuantSignal {
  const mentionZScore = calculateZScore(currentMentionCount, mentionHistory);
  const mentionChanges = toPercentChanges(mentionHistory);
  const horizonSignals = horizons.map((horizon) =>
    calculateHorizonSignal({
      horizon,
      mentionChanges,
      mentionZScore,
      priceReturns: priceReturnsByHorizon[horizon] ?? [],
      marketReturns: marketReturnsByHorizon?.[horizon],
    }),
  );
  const primary = horizonSignals.find((signal) => signal.horizon === "24H") ?? horizonSignals[0];
  const score = calculateScore(mentionZScore, primary.hitRate, primary.pearsonCorrelation, primary.spearmanCorrelation);

  return {
    score,
    primaryHorizon: "24H",
    confidence: primary.confidence,
    label: getLabel(score, primary),
    horizons: horizonSignals,
  };
}

function calculateHorizonSignal({
  horizon,
  mentionChanges,
  mentionZScore,
  priceReturns,
  marketReturns,
}: {
  horizon: SignalHorizon;
  mentionChanges: number[];
  mentionZScore: number | null;
  priceReturns: number[];
  marketReturns?: number[];
}): HorizonSignal {
  const length = Math.min(mentionChanges.length, priceReturns.length);
  const safeMentionChanges = mentionChanges.slice(-length);
  const safePriceReturns = priceReturns.slice(-length);
  const excessReturns = safePriceReturns
    .map((stockReturn, index) =>
      calculateExcessReturn({
        stockReturn,
        marketReturn: marketReturns?.[marketReturns.length - length + index] ?? null,
      }),
    )
    .filter((value): value is number => value !== null && Number.isFinite(value));
  const hitRate = calculateHitRate({
    mentionChanges: safeMentionChanges,
    futureExcessReturns: excessReturns,
  });
  const latestPriceReturn = safePriceReturns.at(-1) ?? null;
  const latestExcessReturn = excessReturns.at(-1) ?? null;
  const sampleSize = Math.min(safeMentionChanges.length, excessReturns.length);

  return {
    horizon,
    mentionChangeRate: roundNullable(safeMentionChanges.at(-1) ?? null, 1),
    mentionZScore: roundNullable(mentionZScore, 2),
    priceReturn: roundNullable(latestPriceReturn, 1),
    excessReturn: roundNullable(latestExcessReturn, 1),
    pearsonCorrelation: roundNullable(calculatePearsonCorrelation(safeMentionChanges, excessReturns), 2),
    spearmanCorrelation: roundNullable(calculateSpearmanCorrelation(safeMentionChanges, excessReturns), 2),
    hitRate: hitRate.hitRate === null ? null : roundNullable(hitRate.hitRate * 100, 0),
    sampleSize,
    confidence: getConfidence(sampleSize),
  };
}

function calculateScore(
  mentionZScore: number | null,
  hitRate: number | null,
  pearsonCorrelation: number | null,
  spearmanCorrelation: number | null,
): number {
  const zNormalized = mentionZScore === null ? 0 : clamp(mentionZScore, -2, 2) / 2;
  const hitRateBoost = hitRate === null ? 0 : (hitRate - 50) / 50;
  const correlations = [pearsonCorrelation, spearmanCorrelation].filter((value): value is number => value !== null);
  const correlationAverage = correlations.length
    ? correlations.reduce((sum, value) => sum + value, 0) / correlations.length
    : 0;

  return Math.round(clamp(50 + zNormalized * 20 + hitRateBoost * 15 + correlationAverage * 15, 0, 100));
}

function getConfidence(sampleSize: number): SignalConfidence {
  if (sampleSize < 10) return "low";
  if (sampleSize < 30) return "medium";
  return "high";
}

function getLabel(score: number, primary: HorizonSignal): string {
  if (primary.confidence === "low") return "표본이 제한되어 보수적으로 계산됨";
  if ((primary.pearsonCorrelation ?? 0) < -0.15 || (primary.spearmanCorrelation ?? 0) < -0.15) {
    return "언급 흐름과 가격 흐름의 방향성이 엇갈림";
  }
  if (primary.excessReturn !== null && primary.excessReturn <= 0 && (primary.mentionChangeRate ?? 0) > 0) {
    return "언급 증가가 두드러지지만 시장 대비 반응은 제한적";
  }
  if (score >= 70) return "언급 흐름과 가격 흐름의 동행 정도가 강해진 구간";
  return "가격 흐름보다 언급 증가가 먼저 나타난 구간";
}

function toPercentChanges(values: number[]): number[] {
  const changes: number[] = [];
  for (let index = 1; index < values.length; index += 1) {
    const previous = values[index - 1];
    const current = values[index];
    if (Number.isFinite(previous) && Number.isFinite(current) && previous !== 0) {
      changes.push(((current - previous) / previous) * 100);
    }
  }
  return changes;
}

function roundNullable(value: number | null, digits: number): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const unit = 10 ** digits;
  return Math.round(value * unit) / unit;
}
