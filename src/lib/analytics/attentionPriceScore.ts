import { clampScore } from "@/lib/ranking/scoring";

type Confidence = "low" | "medium" | "high";

export function calculateAttentionPriceScore({
  mentionChangeRate,
  priceChangeRate,
  correlation,
  dataPoints,
}: {
  mentionChangeRate: number | null;
  priceChangeRate: number | null;
  correlation: number | null;
  dataPoints: number;
}): {
  score: number;
  confidence: Confidence;
  label: string;
} {
  const confidence = getConfidence({ correlation, dataPoints, priceChangeRate });
  const normalizedMentionChange = normalizeSignedPercent(mentionChangeRate, 40);
  const normalizedPriceChange = normalizeSignedPercent(priceChangeRate, 12);
  const correlationBoost = correlation === null ? 0 : correlation * 15;
  const score = clampScore(50 + normalizedMentionChange * 20 + normalizedPriceChange * 15 + correlationBoost);

  return {
    score,
    confidence,
    label: getLabel({ score, confidence, correlation, mentionChangeRate, priceChangeRate }),
  };
}

function normalizeSignedPercent(value: number | null, range: number): number {
  if (value === null || !Number.isFinite(value)) return 0;
  return Math.max(-1, Math.min(1, value / range));
}

function getConfidence({
  correlation,
  dataPoints,
  priceChangeRate,
}: {
  correlation: number | null;
  dataPoints: number;
  priceChangeRate: number | null;
}): Confidence {
  if (correlation === null || priceChangeRate === null || dataPoints < 7) return "low";
  if (dataPoints >= 14) return "high";
  return "medium";
}

function getLabel({
  score,
  confidence,
  correlation,
  mentionChangeRate,
  priceChangeRate,
}: {
  score: number;
  confidence: Confidence;
  correlation: number | null;
  mentionChangeRate: number | null;
  priceChangeRate: number | null;
}): string {
  if (confidence === "low") return "표본이 제한되어 보수적으로 계산됨";
  if ((correlation ?? 0) < -0.15) return "언급 흐름과 가격 흐름의 방향성이 엇갈림";
  if ((mentionChangeRate ?? 0) > 0 && (priceChangeRate ?? 0) <= 0) return "가격 변동보다 언급 증가가 더 두드러짐";
  if (score >= 70) return "언급 흐름과 가격 흐름의 동행 정도가 강해진 구간";
  return "언급 증가 대비 가격 반응은 제한적";
}
