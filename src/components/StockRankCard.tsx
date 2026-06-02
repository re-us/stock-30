import type { StockItem } from "@/types/stock";
import { formatMentionScore10, formatNumber, formatPercent, formatRankChange } from "@/utils/format";
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
      className={`w-full rounded-[22px] p-4 text-left transition active:scale-[0.995] ${
        isSelected
          ? "bg-blue-50 shadow-[0_8px_22px_rgba(49,130,246,0.10)] ring-1 ring-blue-100"
          : "bg-white shadow-[0_6px_18px_rgba(15,23,42,0.035)]"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex w-8 shrink-0 flex-col items-center">
          <span className="text-xl font-black tabular-nums text-slate-950">{stock.rank}</span>
          <span className={`mt-0.5 text-[11px] font-black tabular-nums ${isUp ? "text-emerald-600" : isDown ? "text-rose-500" : "text-slate-400"}`}>
            {rankChange}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0">
              <h2 className="truncate text-[17px] font-black leading-6 text-slate-950">{stock.name}</h2>
              <p className="mt-0.5 truncate text-xs font-bold text-slate-500">
                {stock.symbol} · {stock.market} · {stock.sector}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] font-bold text-slate-400">Score / 10</p>
              <p className="text-[24px] font-black leading-7 tabular-nums text-slate-950">{formatMentionScore10(stock.mentionScore)}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <SmallMetric label="언급 변화" value={formatPercent(stock.mentionChangeRate)} tone={stock.mentionChangeRate >= 0 ? "text-emerald-600" : "text-rose-500"} />
            <SmallMetric label="상승확률" value={stock.weeklyUpsideProbability ? `${stock.weeklyUpsideProbability.probability}%` : "-"} tone="text-blue-600" />
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-[1fr_104px]">
            <div>
              <p className="text-xs font-bold leading-5 text-slate-500">
                뉴스 {formatNumber(stock.newsCount)} · 검색 {stock.searchScore} · 커뮤니티 {formatNumber(stock.communityMentions)}
              </p>
              <div className="mt-2">
                <SentimentBar sentiment={stock.sentiment} />
              </div>
            </div>
            <MiniTrendChart values={stock.trend7d} />
          </div>

          <p className="mt-3 line-clamp-2 rounded-[16px] bg-white/70 px-3.5 py-2.5 text-sm font-semibold leading-5 text-slate-600">
            왜 떴나요? {stock.reason}
          </p>

          <div className="mt-2.5">
            <WeeklyProbabilityBadge probability={stock.weeklyUpsideProbability} />
          </div>
        </div>
      </div>
    </button>
  );
}

function SmallMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-[16px] bg-white/75 px-3 py-2.5">
      <p className="text-[11px] font-bold text-slate-400">{label}</p>
      <p className={`mt-0.5 text-base font-black tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
