"use client";

import { useEffect, useState } from "react";
import type { StockItem } from "@/types/stock";

type RollingTopStocksProps = {
  stocks: StockItem[];
};

const KOREAN_NAMES: Record<string, string> = {
  NVDA: "엔비디아",
  TSLA: "테슬라",
  AAPL: "애플",
  MSFT: "마이크로소프트",
  AMD: "AMD",
  META: "메타",
  AMZN: "아마존",
  PLTR: "팔란티어",
  GOOGL: "구글",
  AVGO: "브로드컴",
  "005930": "삼성전자",
  "000660": "SK하이닉스",
  "005380": "현대차",
  "000270": "기아",
  "035420": "네이버",
  "035720": "카카오",
  "373220": "LG에너지솔루션",
  "068270": "셀트리온",
  "005490": "POSCO홀딩스",
  "012450": "한화에어로스페이스",
};

export function RollingTopStocks({ stocks }: RollingTopStocksProps) {
  const [index, setIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const current = stocks[index % Math.max(stocks.length, 1)];

  useEffect(() => {
    if (stocks.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % stocks.length);
    }, 3500);

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
              <p className="text-xs font-black text-blue-700">TOP 30 자동 보기</p>
              <p className="mt-1 truncate text-base font-black text-slate-950">
                {current.rank}. {getDisplayName(current)}
              </p>
              <p className="mt-0.5 text-xs font-bold text-slate-500">
                {current.symbol} · Score {current.mentionScore}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-700">열기</span>
          </div>
          <span key={`${current.id}-bar`} className="rolling-stock-progress mt-3 block h-1 rounded-full bg-blue-200" />
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
                  <div key={stock.id} className="grid grid-cols-[32px_minmax(0,1fr)_72px] items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                    <span className="text-sm font-black tabular-nums text-slate-500">{stock.rank}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-slate-950">{getDisplayName(stock)}</span>
                      <span className="block truncate text-xs font-bold text-slate-500">
                        {stock.symbol} · {stock.market}
                      </span>
                    </span>
                    <span className="text-right text-sm font-black tabular-nums text-blue-600">Score {stock.mentionScore}</span>
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
  return KOREAN_NAMES[stock.symbol] ?? stock.name;
}
