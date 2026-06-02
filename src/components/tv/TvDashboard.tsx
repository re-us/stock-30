"use client";

import { useEffect, useMemo, useState } from "react";
import { mockStocks } from "@/data/mockStocks";
import { calculateWeeklyUpsideProbability } from "@/lib/analytics/weeklyUpsideProbability";
import type { QuantSignal, RankingsResponse, SignalHorizon, StockItem } from "@/types/stock";
import { TvRankList } from "./TvRankList";
import { TvStockFocus } from "./TvStockFocus";

const initialStocks = mockStocks.map((stock) => ({
  ...stock,
  quantSignal: stock.quantSignal ?? buildClientFallbackQuantSignal(stock),
  weeklyUpsideProbability: stock.weeklyUpsideProbability ?? buildClientFallbackWeeklyUpsideProbability(stock),
}));

export function TvDashboard() {
  const [stocks, setStocks] = useState<StockItem[]>(initialStocks);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/stocks/rankings", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load rankings");
        return response.json() as Promise<RankingsResponse>;
      })
      .then((data) => {
        if (!isMounted) return;
        setStocks(data.stocks.length ? data.stocks : initialStocks);
        setUpdatedAt(data.updatedAt);
      })
      .catch(() => {
        if (!isMounted) return;
        setStocks(initialStocks);
        setUpdatedAt(new Date().toISOString());
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (stocks.length < 2) return;
    const timer = window.setInterval(() => {
      setSelectedIndex((current) => (current + 1) % stocks.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [stocks.length]);

  const topStocks = useMemo(() => stocks.slice(0, 30), [stocks]);
  const selectedStock = topStocks[selectedIndex % Math.max(topStocks.length, 1)] ?? topStocks[0] ?? initialStocks[0];

  const handleSelect = (stock: StockItem) => {
    const nextIndex = topStocks.findIndex((item) => item.id === stock.id);
    if (nextIndex >= 0) setSelectedIndex(nextIndex);
  };

  if (isLoading) {
    return (
      <main className="flex h-screen w-screen items-center justify-center bg-[#f8f9fa] text-[#191f28]">
        <div className="rounded-[32px] bg-white px-12 py-10 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <p className="text-5xl font-black tracking-normal">STOCK 30</p>
          <p className="mt-5 text-2xl font-black text-slate-500">방송 화면을 준비하고 있습니다</p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#f8f9fa] p-8 text-[#191f28]">
      <div className="flex h-full flex-col gap-5">
        <header className="flex h-[92px] items-center justify-between rounded-[28px] bg-white px-8 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div>
            <div className="flex items-end gap-4">
              <h1 className="text-5xl font-black leading-none tracking-normal">STOCK 30</h1>
              <p className="pb-1 text-2xl font-black text-slate-500">TV</p>
            </div>
            <p className="mt-2 text-xl font-bold text-slate-500">온라인 언급 기반 주식 TOP 30</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-slate-600">업데이트 기준: 매일 09:00</p>
            <p className="mt-1 text-base font-bold text-slate-400">최근 {formatKoreanTime(updatedAt)} · 투자 추천이 아닌 참고 분석 자료</p>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.9fr)_minmax(420px,1fr)] gap-5">
          <TvRankList stocks={topStocks} selectedId={selectedStock.id} onSelect={handleSelect} />
          <TvStockFocus stock={selectedStock} />
        </section>

        <footer className="flex h-10 items-center justify-between px-2 text-sm font-bold text-slate-400">
          <span>데이터 상태: 실제 데이터 연동 준비 중 · 샘플 데이터 보강 표시</span>
          <span>본 화면은 온라인 언급 기반 참고 자료이며, 투자 추천이나 매매 신호가 아닙니다.</span>
        </footer>
      </div>
    </main>
  );
}

function buildClientFallbackQuantSignal(stock: StockItem): QuantSignal {
  const score = Math.max(0, Math.min(100, Math.round(50 + stock.mentionChangeRate * 0.8)));
  return {
    score,
    primaryHorizon: "24H",
    confidence: "low",
    label: "제한된 보조 변수로 계산된 참고 지표",
    horizons: (["6H", "24H", "3D", "5D"] satisfies SignalHorizon[]).map((horizon) => ({
      horizon,
      mentionChangeRate: stock.mentionChangeRate,
      mentionZScore: null,
      priceReturn: null,
      excessReturn: null,
      pearsonCorrelation: null,
      spearmanCorrelation: null,
      hitRate: null,
      sampleSize: 0,
      confidence: "low",
    })),
  };
}

function buildClientFallbackWeeklyUpsideProbability(stock: StockItem) {
  return calculateWeeklyUpsideProbability({
    mentionScore: stock.mentionScore,
    mentionChangeRate: stock.mentionChangeRate,
    newsCount: stock.newsCount,
    searchScore: stock.searchScore,
    communityMentions: stock.communityMentions,
    sentimentPositive: stock.sentiment.positive,
    sentimentNegative: stock.sentiment.negative,
    dataSourceCount: 1,
    sampleSize: 0,
  });
}

function formatKoreanTime(value: string | null): string {
  if (!value) return "준비 중";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
