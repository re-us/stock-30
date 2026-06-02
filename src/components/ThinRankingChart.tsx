import type { StockItem } from "@/types/stock";
import { formatMentionScore10 } from "@/utils/format";

type ThinRankingChartProps = {
  stocks: StockItem[];
  selectedId: string | null;
  onSelect: (stock: StockItem) => void;
};

export function ThinRankingChart({ stocks, selectedId, onSelect }: ThinRankingChartProps) {
  const maxScore = Math.max(...stocks.map((stock) => stock.mentionScore), 1);

  return (
    <aside className="sticky top-6 rounded-[24px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-950">TOP 30 랭킹</h2>
        <p className="text-xs font-bold text-slate-400">Score / 10</p>
      </div>
      <div className="mt-4 space-y-1.5">
        {stocks.slice(0, 30).map((stock) => (
          <button
            key={stock.id}
            type="button"
            onClick={() => onSelect(stock)}
            className={`grid w-full grid-cols-[28px_minmax(0,1fr)_36px_34px] items-center gap-2 rounded-xl px-2 py-1.5 text-left transition ${
              selectedId === stock.id ? "bg-blue-50" : "hover:bg-slate-50"
            }`}
          >
            <span className="text-xs font-black tabular-nums text-slate-500">{stock.rank}</span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-black text-slate-900">{stock.name}</span>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                <span className="block h-full rounded-full bg-blue-500" style={{ width: `${(stock.mentionScore / maxScore) * 100}%` }} />
              </span>
            </span>
            <span className="text-right text-[11px] font-black tabular-nums text-blue-600">
              {stock.weeklyUpsideProbability ? `${stock.weeklyUpsideProbability.probability}%` : "-"}
            </span>
            <span className="text-right text-xs font-black tabular-nums text-slate-700">{formatMentionScore10(stock.mentionScore)}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
