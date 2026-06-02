"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { DataStatusBadge } from "@/components/DataStatusBadge";
import { Disclaimer } from "@/components/Disclaimer";
import { EmptyState } from "@/components/EmptyState";
import { FilterTabs } from "@/components/FilterTabs";
import { Header } from "@/components/Header";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { SearchBar } from "@/components/SearchBar";
import { StockDetailPanel } from "@/components/StockDetailPanel";
import { StockRankCard } from "@/components/StockRankCard";
import { SummaryCards } from "@/components/SummaryCards";
import { ThinRankingChart } from "@/components/ThinRankingChart";
import { mockStocks } from "@/data/mockStocks";
import { calculateWeeklyUpsideProbability } from "@/lib/analytics/weeklyUpsideProbability";
import type { FilterKey, QuantSignal, RankingsResponse, SignalHorizon, SourceStatus, StockItem } from "@/types/stock";

type DataState = "live" | "partial" | "mock";

const mockSourceStatus: SourceStatus = {
  gdelt: "mock",
  googleNews: "mock",
  naverDataLab: "disabled",
  alphaVantage: "disabled",
  stocktwits: "mock",
};

const initialStocks = mockStocks.map((stock) => ({
  ...stock,
  quantSignal: stock.quantSignal ?? buildClientFallbackQuantSignal(stock),
  weeklyUpsideProbability: stock.weeklyUpsideProbability ?? buildClientFallbackWeeklyUpsideProbability(stock),
}));

export default function Home() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [stocks, setStocks] = useState<StockItem[]>(initialStocks);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [sourceStatus, setSourceStatus] = useState<SourceStatus>(mockSourceStatus);
  const [dataState, setDataState] = useState<DataState>("mock");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [nextUpdateAt, setNextUpdateAt] = useState<string | null>(null);
  const [updateIntervalHours, setUpdateIntervalHours] = useState<6>(6);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const requestRankings = async (): Promise<RankingsResponse> => {
    const response = await fetch("/api/stocks/rankings", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to load rankings");
    return (await response.json()) as RankingsResponse;
  };

  const applyRankings = (data: RankingsResponse) => {
    setStocks(data.stocks);
    setSourceStatus(data.sourceStatus);
    setDataState(getDataState(data.sourceStatus));
    setUpdatedAt(data.updatedAt);
    setNextUpdateAt(data.nextUpdateAt ?? null);
    setUpdateIntervalHours(data.updateIntervalHours);
    setSelectedStock((current) => (current ? data.stocks.find((stock) => stock.id === current.id) ?? null : null));
  };

  const applyMockRankings = () => {
    setStocks(initialStocks);
    setSourceStatus(mockSourceStatus);
    setDataState("mock");
    setUpdatedAt(new Date().toISOString());
    setNextUpdateAt(null);
    setUpdateIntervalHours(6);
    setSelectedStock((current) => (current ? initialStocks.find((stock) => stock.id === current.id) ?? null : null));
  };

  const loadRankings = async () => {
    try {
      applyRankings(await requestRankings());
    } catch {
      applyMockRankings();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    requestRankings()
      .then((data) => {
        if (isMounted) applyRankings(data);
      })
      .catch(() => {
        if (isMounted) applyMockRankings();
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredStocks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return stocks.filter((stock) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "us" && stock.market === "US") ||
        (filter === "kr" && stock.market === "KR") ||
        (filter === "rising" && stock.mentionChangeRate >= 15) ||
        (filter === "positive" && stock.sentiment.positive >= 50) ||
        (filter === "negative" && (stock.sentiment.negative >= 25 || stock.mentionChangeRate < 0));

      const matchesQuery =
        normalizedQuery.length === 0 ||
        stock.name.toLowerCase().includes(normalizedQuery) ||
        stock.symbol.toLowerCase().includes(normalizedQuery) ||
        stock.sector.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [filter, query, stocks]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRankings();
    setIsRefreshing(false);
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <Header onRefresh={handleRefresh} isRefreshing={isRefreshing} />
        <div className="mt-5">
          <SummaryCards stocks={stocks} />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          <section className="min-w-0">
            <div className="space-y-3">
              <FilterTabs active={filter} onChange={setFilter} />
              <SearchBar value={query} onChange={setQuery} />
            </div>
            <div className="mt-4 flex items-center justify-between px-1">
              <p className="text-sm font-black text-slate-900">TOP 30 랭킹</p>
              <p className="text-sm font-bold tabular-nums text-slate-500">{filteredStocks.length}개 표시</p>
            </div>
            <div className="mt-3 transition-all">
              {isLoading ? (
                <LoadingSkeleton />
              ) : filteredStocks.length > 0 ? (
                <div className="space-y-3">
                  {filteredStocks.map((stock) => (
                    <Fragment key={stock.id}>
                      <StockRankCard stock={stock} isSelected={selectedStock?.id === stock.id} onSelect={setSelectedStock} />
                      {selectedStock?.id === stock.id && (
                        <div>
                          <StockDetailPanel stock={selectedStock} />
                        </div>
                      )}
                    </Fragment>
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </section>
          <div className="hidden lg:block">
            <ThinRankingChart stocks={filteredStocks} selectedId={selectedStock?.id ?? null} onSelect={setSelectedStock} />
          </div>
        </div>
        <div className="mt-6">
          <DataStatusBadge
            dataState={dataState}
            sourceStatus={sourceStatus}
            updatedAt={updatedAt}
            nextUpdateAt={nextUpdateAt}
            updateIntervalHours={updateIntervalHours}
          />
        </div>
        <div className="mt-4">
          <Disclaimer />
        </div>
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
    label: "표본이 제한되어 보수적으로 계산됨",
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

function getDataState(sourceStatus: SourceStatus): DataState {
  const values = Object.values(sourceStatus);
  if (values.every((value) => value === "mock" || value === "disabled")) return "mock";
  if (values.some((value) => value === "failed" || value === "mock" || value === "disabled")) return "partial";
  return "live";
}
