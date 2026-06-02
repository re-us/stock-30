import type { StockItem } from "@/types/stock";
import { formatNumber, formatPercent, formatRankChange } from "@/utils/format";
import { MiniTrendChart } from "./MiniTrendChart";
import { SentimentBar } from "./SentimentBar";
import { WeeklyProbabilityBadge } from "./WeeklyProbabilityBadge";

type StockRankCardProps = {
  stock: StockItem;
  isSelected: boolean;
  onSelect: (stock: StockItem) => void;
};

export function StockRankCard({ stock, isSelected, onSelect }: StockRankCardProps) {
  const rankChange = formatRankChange(stock.rank, stock.previousRank);
  const isUp = rankChange.startsWith("▲") || rankChange === "NEW";
  const isDown = rankChange.startsWith("▼");

  return (
    <button
      type="button"
      onClick={() => onSelect(stock)}
      className={`w-full rounded-[24px] p-5 text-left transition active:scale-[0.995] ${
        isSelected
          ? "bg-blue-50 shadow-[0_10px_28px_rgba(49,130,246,0.10)] ring-1 ring-blue-100"
          : "bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex w-10 shrink-0 flex-col items-center">
          <span className="text-2xl font-black tabular-nums text-slate-950">{stock.rank}</span>
          <span className={`mt-1 text-xs font-black tabular-nums ${isUp ? "text-emerald-600" : isDown ? "text-rose-500" : "text-slate-400"}`}>
            {rankChange}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-[18px] font-black leading-6 text-slate-950">{stock.name}</h2>
              <p className="mt-1 truncate text-xs font-bold text-slate-500">
                {stock.symbol} · {stock.market} · {stock.sector}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-bold text-slate-400">관심도</p>
              <p className="text-[26px] font-black leading-7 tabular-nums text-slate-950">{stock.mentionScore}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <SmallMetric label="언급 변화" value={formatPercent(stock.mentionChangeRate)} tone={stock.mentionChangeRate >= 0 ? "text-emerald-600" : "text-rose-500"} />
            <SmallMetric label="상승확률" value={stock.weeklyUpsideProbability ? `${stock.weeklyUpsideProbability.probability}%` : "-"} tone="text-blue-600" />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_112px]">
            <div>
              <p className="text-xs font-bold leading-5 text-slate-500">
                뉴스 {formatNumber(stock.newsCount)} · 검색 {stock.searchScore} · 커뮤니티 {formatNumber(stock.communityMentions)}
              </p>
              <div className="mt-3">
                <SentimentBar sentiment={stock.sentiment} />
              </div>
            </div>
            <MiniTrendChart values={stock.trend7d} />
          </div>

          <p className="mt-4 line-clamp-2 rounded-[18px] bg-white/70 px-4 py-3 text-sm font-semibold leading-6 text-slate-600">
            왜 떴나요? {stock.reason}
          </p>

          <div className="mt-3">
            <WeeklyProbabilityBadge probability={stock.weeklyUpsideProbability} />
          </div>
        </div>
      </div>
    </button>
  );
}

function SmallMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-[18px] bg-white/75 px-4 py-3">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-black tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
