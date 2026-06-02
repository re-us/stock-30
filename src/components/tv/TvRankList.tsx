import type { StockItem } from "@/types/stock";
import { formatMentionScore10 } from "@/utils/format";
import { getStockDisplayName } from "@/utils/stockNames";

type TvRankListProps = {
  stocks: StockItem[];
  selectedId: string;
  onSelect: (stock: StockItem) => void;
};

export function TvRankList({ stocks, selectedId, onSelect }: TvRankListProps) {
  return (
    <section className="flex min-h-0 flex-col rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="mb-2 grid h-7 shrink-0 grid-cols-[48px_minmax(0,1fr)_140px_140px] items-center px-3 text-sm font-black uppercase text-slate-400">
        <span>순위</span>
        <span>종목</span>
        <span className="text-right">Score / 10</span>
        <span className="text-right">상승확률</span>
      </div>
      <div className="grid min-h-0 flex-1 gap-1" style={{ gridTemplateRows: "repeat(30, minmax(0, 1fr))" }}>
        {stocks.slice(0, 30).map((stock, index) => (
          <button
            key={stock.id}
            type="button"
            onClick={() => onSelect(stock)}
            className={`grid min-h-0 grid-cols-[48px_minmax(0,1fr)_140px_140px] items-center rounded-xl px-3 text-left transition ${
              selectedId === stock.id ? "bg-blue-50 ring-1 ring-blue-100" : "bg-slate-50"
            }`}
          >
            <span className="text-xl font-black leading-none tabular-nums text-slate-700">{index + 1}</span>
            <span className="min-w-0">
              <span className="truncate text-lg font-black leading-none text-slate-950">{getStockDisplayName(stock)}</span>
              <span className="ml-3 text-base font-bold leading-none text-slate-500">{stock.symbol} · {stock.market}</span>
            </span>
            <span className="text-right text-xl font-black leading-none tabular-nums text-slate-950">{formatMentionScore10(stock.mentionScore)}</span>
            <span className="text-right text-xl font-black leading-none tabular-nums text-blue-600">{stock.weeklyUpsideProbability?.probability ?? "-"}%</span>
          </button>
        ))}
      </div>
    </section>
  );
}
