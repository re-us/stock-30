"use client";

import { useEffect, useRef, useState } from "react";
import type { StockItem } from "@/types/stock";
import { formatMentionScore10, formatRankChange } from "@/utils/format";
import { getStockDisplayName } from "@/utils/stockNames";

type TvRankListProps = {
  stocks: StockItem[];
  selectedId: string;
  onSelect: (stock: StockItem) => void;
};

export function TvRankList({ stocks, selectedId, onSelect }: TvRankListProps) {
  const [displayStocks, setDisplayStocks] = useState(() => stocks.slice(0, 30));
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set());
  const displayStocksRef = useRef(displayStocks);
  const timerRef = useRef<number | null>(null);
  const clearChangeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const next = stocks.slice(0, 30);
    displayStocksRef.current = next;
    setDisplayStocks(next);
    setChangedIds(new Set());
  }, [stocks]);

  useEffect(() => {
    const scheduleNextShuffle = () => {
      const delay = 15000 + Math.round(Math.random() * 15000);
      timerRef.current = window.setTimeout(() => {
        const result = buildNextDisplayOrder(displayStocksRef.current);
        displayStocksRef.current = result.stocks;
        setDisplayStocks(result.stocks);
        setChangedIds(new Set(result.changedIds));
        if (clearChangeTimerRef.current !== null) window.clearTimeout(clearChangeTimerRef.current);
        clearChangeTimerRef.current = window.setTimeout(() => setChangedIds(new Set()), 1800);
        scheduleNextShuffle();
      }, delay);
    };

    scheduleNextShuffle();

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      if (clearChangeTimerRef.current !== null) window.clearTimeout(clearChangeTimerRef.current);
    };
  }, []);

  return (
    <section className="tv-rank-panel flex min-h-0 flex-col rounded-[28px] bg-gradient-to-br from-white via-white to-slate-100 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.03]">
      <div className="mb-2 grid h-7 shrink-0 grid-cols-[76px_minmax(0,1fr)_140px_140px] items-center px-3 text-sm font-black uppercase text-slate-400">
        <span>순위</span>
        <span>종목</span>
        <span className="text-center">Score / 10</span>
        <span className="text-right">상승확률</span>
      </div>
      <div className="grid min-h-0 flex-1 gap-1" style={{ gridTemplateRows: "repeat(30, minmax(0, 1fr))" }}>
        {displayStocks.map((stock, index) => {
          const isSelected = selectedId === stock.id;
          const isChanged = changedIds.has(stock.id);
          const rankChange = getRankChange(stock, index + 1);

          return (
          <button
            key={stock.id}
            type="button"
            onClick={() => onSelect(stock)}
            className={`tv-rank-row grid min-h-0 grid-cols-[76px_minmax(0,1fr)_140px_140px] items-center rounded-[16px] px-3 text-left transition-[transform,box-shadow,background-color] duration-500 ${
              isSelected
                ? "bg-gradient-to-r from-blue-50 via-white to-sky-50 shadow-[0_8px_20px_rgba(49,130,246,0.12),inset_0_1px_0_rgba(255,255,255,0.92)] ring-1 ring-blue-100/80"
                : "bg-gradient-to-r from-white via-[#fbfcff] to-slate-50 shadow-[0_3px_10px_rgba(15,23,42,0.045),inset_0_1px_0_rgba(255,255,255,0.88)] ring-1 ring-slate-100/70"
            } ${isChanged ? "tv-rank-change" : ""}`}
            style={{
              animationDelay: isChanged ? `${Math.min(index, 12) * 34}ms` : undefined,
            }}
          >
            <span className="flex items-center gap-2">
              <span className={`text-xl font-black leading-none tabular-nums ${isSelected ? "text-blue-700" : "text-slate-700"}`}>{index + 1}</span>
              <span className={`text-xs font-black leading-none tabular-nums ${rankChange.tone}`}>{rankChange.label}</span>
            </span>
            <span className="min-w-0">
              <span className="truncate text-lg font-black leading-none text-slate-950">{getStockDisplayName(stock)}</span>
              <span className="ml-3 text-base font-bold leading-none text-slate-500">{stock.symbol} · {stock.market}</span>
            </span>
            <span className="text-center text-xl font-black leading-none tabular-nums text-slate-950">{formatMentionScore10(stock.mentionScore)}</span>
            <span className="text-right text-xl font-black leading-none tabular-nums text-blue-600">{stock.weeklyUpsideProbability?.probability ?? "-"}%</span>
          </button>
          );
        })}
      </div>
    </section>
  );
}

function buildNextDisplayOrder(stocks: StockItem[]): { stocks: StockItem[]; changedIds: string[] } {
  if (stocks.length < 4) return { stocks, changedIds: [] };

  const next = [...stocks];
  const changedIds = new Set<string>();
  const usedIndexes = new Set<number>();
  const moveCount = 2 + Math.floor(Math.random() * 3);

  for (let move = 0; move < moveCount; move += 1) {
    const sourceIndex = 1 + Math.floor(Math.random() * (next.length - 2));
    const direction = Math.random() > 0.48 ? -1 : 1;
    const targetIndex = sourceIndex + direction;

    if (targetIndex < 0 || targetIndex >= next.length || usedIndexes.has(sourceIndex) || usedIndexes.has(targetIndex)) {
      continue;
    }

    const source = next[sourceIndex];
    const target = next[targetIndex];
    next[sourceIndex] = target;
    next[targetIndex] = source;
    usedIndexes.add(sourceIndex);
    usedIndexes.add(targetIndex);
    changedIds.add(source.id);
    changedIds.add(target.id);
  }

  return {
    stocks: next,
    changedIds: [...changedIds],
  };
}

function getRankChange(stock: StockItem, currentRank: number): { label: string; tone: string } {
  const label = formatRankChange(currentRank, stock.previousRank);
  if (label.startsWith("▲")) return { label, tone: "text-emerald-500" };
  if (label.startsWith("▼")) return { label, tone: "text-rose-500" };
  if (label === "NEW") return { label, tone: "text-blue-500" };
  return { label, tone: "text-slate-300" };
}
