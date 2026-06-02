import type { ReactNode } from "react";
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
          <p className="break-keep text-xs font-black leading-4 text-blue-700">이번주 상승확률 (데이터 기반 예측)</p>
          <p className="mt-1 text-[28px] font-black leading-8 tabular-nums text-blue-950">{probability.probability}%</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="flex h-9 min-w-[64px] items-center justify-center whitespace-nowrap rounded-full bg-white px-3 text-xs font-black leading-none text-blue-700">
            {formatGrade(probability.grade)}
          </p>
        </div>
      </div>
      {!compact && (
        <>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill>모델 신뢰도: {probability.modelReliabilityLabel}</Pill>
            <Pill>데이터 품질: {formatDataQuality(probability.dataQuality)}</Pill>
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-blue-700">{probability.label}</p>
        </>
      )}
    </div>
  );
}

export function formatGrade(grade: ProbabilityGrade): string {
  if (grade === "conservative") return "보수";
  if (grade === "neutral") return "중립";
  if (grade === "positive") return "긍정";
  return "강함";
}

export function formatDataQuality(dataQuality: DataQuality): string {
  if (dataQuality === "rich") return "충분";
  if (dataQuality === "normal") return "보통";
  return "제한적";
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-7 items-center justify-center whitespace-nowrap rounded-full bg-slate-100 px-2.5 text-xs font-black text-slate-500">
      {children}
    </span>
  );
}
