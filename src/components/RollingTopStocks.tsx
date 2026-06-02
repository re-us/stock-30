"use client";

import { useEffect, useMemo, useState } from "react";
import type { StockItem } from "@/types/stock";
import { formatMentionScore10 } from "@/utils/format";
import { getStockDisplayName } from "@/utils/stockNames";

type RollingTopStocksProps = {
  stocks: StockItem[];
};

type SheetMode = "mentions" | "probability";

export function RollingTopStocks({ stocks }: RollingTopStocksProps) {
  const [index, setIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>("mentions");
  const current = stocks[index % Math.max(stocks.length, 1)];

  const sheetStocks = useMemo(() => {
    if (sheetMode === "probability") {
      return [...stocks].sort((a, b) => (b.weeklyUpsideProbability?.probability ?? 0) - (a.weeklyUpsideProbability?.probability ?? 0));
    }

    return [...stocks].sort((a, b) => b.mentionScore - a.mentionScore);
  }, [sheetMode, stocks]);

  useEffect(() => {
    if (stocks.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % stocks.length);
    }, 3800);

    return () => window.clearInterval(timer);
  }, [stocks.length]);

  if (!current) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="col-span-2 rounded-[20px] bg-blue-50 p-3.5 text-left shadow-[0_6px_18px_rgba(15,23,42,0.035)] transition active:scale-[0.99] sm:col-span-1"
      >
        <div className="relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div key={current.id} className="rolling-stock-enter min-w-0">
              <p className="mt-1 truncate text-base font-black text-slate-950">
                {current.rank}. {getDisplayName(current)}
              </p>
              <p className="mt-0.5 text-xs font-bold text-slate-500">
                {current.symbol} · {formatMentionScore10(current.mentionScore)}
              </p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-blue-700" aria-hidden="true">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </span>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/30 px-4 py-5 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="mx-auto flex h-full max-w-md flex-col rounded-[24px] bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">TOP 30 랭킹</h2>
                <p className="mt-1 text-xs font-bold text-slate-500">온라인 언급 기준</p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="min-h-10 rounded-full bg-slate-100 px-4 text-sm font-black text-slate-700">
                닫기
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-full bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setSheetMode("mentions")}
                className={`min-h-10 rounded-full text-sm font-black transition ${sheetMode === "mentions" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
              >
                언급량 순
              </button>
              <button
                type="button"
                onClick={() => setSheetMode("probability")}
                className={`min-h-10 rounded-full text-sm font-black transition ${sheetMode === "probability" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
              >
                상승확률 순
              </button>
            </div>
            <div className="mt-4 flex-1 overflow-auto">
              <div className="space-y-2">
                {sheetStocks.slice(0, 30).map((stock, index) => (
                  <div key={stock.id} className="grid grid-cols-[32px_minmax(0,1fr)_82px] items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                    <span className="text-sm font-black tabular-nums text-slate-500">{index + 1}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-slate-950">{getDisplayName(stock)}</span>
                      <span className="block truncate text-xs font-bold text-slate-500">
                        {stock.symbol} · {stock.market}
                      </span>
                    </span>
                    <span className="text-right text-sm font-black tabular-nums text-blue-600">
                      {sheetMode === "probability" ? `${stock.weeklyUpsideProbability?.probability ?? "-"}%` : formatMentionScore10(stock.mentionScore)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getDisplayName(stock: StockItem): string {
  return getStockDisplayName(stock);
}
