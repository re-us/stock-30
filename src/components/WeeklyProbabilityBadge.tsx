import type { DataQuality, ProbabilityGrade, WeeklyUpsideProbability } from "@/types/stock";

type WeeklyProbabilityBadgeProps = {
  probability?: WeeklyUpsideProbability;
  compact?: boolean;
};

export function WeeklyProbabilityBadge({ probability, compact = false }: WeeklyProbabilityBadgeProps) {
  if (!probability) return null;

  return (
    <div className="rounded-[18px] bg-blue-50 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="whitespace-nowrap text-xs font-black text-blue-700">이번주 상승확률</p>
          <p className="mt-1 text-[28px] font-black leading-8 tabular-nums text-blue-950">{probability.probability}%</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-700">
            {formatGrade(probability.grade)}
          </p>
          {!compact && <p className="mt-2 whitespace-nowrap text-xs font-bold text-blue-700">데이터 {formatDataQuality(probability.dataQuality)}</p>}
        </div>
      </div>
      {!compact && <p className="mt-2 text-xs font-semibold leading-5 text-blue-700">{probability.label}</p>}
    </div>
  );
}

export function formatGrade(grade: ProbabilityGrade): string {
  if (grade === "conservative") return "보수적";
  if (grade === "neutral") return "중립";
  if (grade === "positive") return "긍정";
  return "강함";
}

export function formatDataQuality(dataQuality: DataQuality): string {
  if (dataQuality === "rich") return "충분";
  if (dataQuality === "normal") return "보통";
  return "제한적";
}
