import type { StockItem } from "@/types/stock";
import { formatPercent } from "@/utils/format";
import { WeeklyProbabilityBadge } from "./WeeklyProbabilityBadge";

type SummaryCardsProps = {
  stocks: StockItem[];
};

export function SummaryCards({ stocks }: SummaryCardsProps) {
  const top = stocks[0];
  const fastest = [...stocks].sort((a, b) => b.mentionChangeRate - a.mentionChangeRate)[0];
  const average = stocks.reduce((sum, stock) => sum + stock.mentionChangeRate, 0) / stocks.length;

  return (
    <section className="space-y-3">
      <div className="rounded-[24px] bg-[#191f28] p-4 text-white shadow-[0_10px_26px_rgba(25,31,40,0.12)] sm:p-5">
        <p className="text-xs font-bold text-blue-100">오늘의 1위 종목</p>
        <div className="mt-2.5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-[22px] font-black leading-7 sm:text-3xl">{top.name}</h2>
            <p className="mt-0.5 text-sm font-bold text-slate-300">
              {top.symbol} · {top.market}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs font-bold text-slate-300">관심도</p>
            <p className="text-[30px] font-black leading-8 tabular-nums">{top.mentionScore}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniMetric label="언급 변화" value={formatPercent(top.mentionChangeRate)} />
          <MiniMetric label="상승확률" value={top.weeklyUpsideProbability ? `${top.weeklyUpsideProbability.probability}%` : "-"} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <div className="rounded-[20px] bg-white p-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.035)]">
          <p className="text-xs font-bold text-slate-500">급상승 관심 종목</p>
          <p className="mt-1.5 truncate text-base font-black text-slate-950">{fastest.name}</p>
          <p className="mt-0.5 text-xl font-black tabular-nums text-emerald-600">{formatPercent(fastest.mentionChangeRate)}</p>
        </div>
        <div className="rounded-[20px] bg-white p-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.035)]">
          <p className="text-xs font-bold text-slate-500">평균 언급 변화</p>
          <p className="mt-1.5 text-base font-black text-slate-950">TOP 30</p>
          <p className={`mt-0.5 text-xl font-black tabular-nums ${average >= 0 ? "text-emerald-600" : "text-rose-500"}`}>{formatPercent(average)}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <WeeklyProbabilityBadge probability={top.weeklyUpsideProbability} compact />
        </div>
      </div>
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-white/10 px-3.5 py-2.5">
      <p className="text-xs font-bold text-slate-300">{label}</p>
      <p className="mt-0.5 text-lg font-black tabular-nums text-white">{value}</p>
    </div>
  );
}
