"use client";

import { useEffect, useState } from "react";
import type { StockItem } from "@/types/stock";

type RollingTopStocksProps = {
  stocks: StockItem[];
};

export function RollingTopStocks({ stocks }: RollingTopStocksProps) {
  const [index, setIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const current = stocks[index % Math.max(stocks.length, 1)];

  useEffect(() => {
    if (stocks.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % stocks.length);
    }, 2200);

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
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black text-blue-700">TOP 30 자동 보기</p>
            <p className="mt-1 truncate text-base font-black text-slate-950">
              {current.rank}. {current.name}
            </p>
            <p className="mt-0.5 text-xs font-bold text-slate-500">
              {current.symbol} · 관심도 {current.mentionScore}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-700">열기</span>
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/30 px-4 py-5 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="mx-auto flex h-full max-w-md flex-col rounded-[24px] bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">TOP 30 랭킹</h2>
                <p className="mt-1 text-xs font-bold text-slate-500">온라인 관심도 기준</p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="min-h-10 rounded-full bg-slate-100 px-4 text-sm font-black text-slate-700">
                닫기
              </button>
            </div>
            <div className="mt-4 flex-1 overflow-auto">
              <div className="space-y-2">
                {stocks.slice(0, 30).map((stock) => (
                  <div key={stock.id} className="grid grid-cols-[32px_minmax(0,1fr)_48px] items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                    <span className="text-sm font-black tabular-nums text-slate-500">{stock.rank}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-slate-950">{stock.name}</span>
                      <span className="block truncate text-xs font-bold text-slate-500">{stock.symbol} · {stock.market}</span>
                    </span>
                    <span className="text-right text-sm font-black tabular-nums text-blue-600">{stock.mentionScore}</span>
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
