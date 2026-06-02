import type { HorizonSignal, StockItem } from "@/types/stock";
import { formatMentionScore10, formatNumber, formatPercent } from "@/utils/format";
import { getStockDisplayName } from "@/utils/stockNames";
import { MiniTrendChart } from "./MiniTrendChart";
import { SentimentBar } from "./SentimentBar";
import { formatDataQuality, formatGrade } from "./WeeklyProbabilityBadge";

type StockDetailPanelProps = {
  stock: StockItem;
};

export function StockDetailPanel({ stock }: StockDetailPanelProps) {
  const usefulSignals =
    stock.quantSignal?.horizons.filter(
      (signal) =>
        signal.sampleSize > 0 &&
        (signal.hitRate !== null ||
          signal.pearsonCorrelation !== null ||
          signal.spearmanCorrelation !== null ||
          signal.excessReturn !== null),
    ) ?? [];

  return (
    <aside className="rounded-[24px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-48px)] lg:overflow-auto">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-black text-blue-600">현재 {stock.rank}위</p>
          <h2 className="mt-2 truncate text-[22px] font-black leading-7 text-slate-950 sm:text-2xl">{getStockDisplayName(stock)}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            {stock.symbol} · {stock.market} · {stock.sector}
          </p>
        </div>
        <div className="shrink-0 rounded-[18px] bg-slate-950 px-4 py-3 text-right text-white">
          <p className="text-xs font-bold text-slate-300">Score / 10</p>
          <p className="text-2xl font-black tabular-nums">{formatMentionScore10(stock.mentionScore)}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3">
        <Metric label="전일대비 관심량 증가" value={formatPercent(stock.mentionChangeRate)} tone={stock.mentionChangeRate >= 0 ? "text-emerald-600" : "text-rose-500"} />
        <Metric label="커뮤니티" value={formatNumber(stock.communityMentions)} />
        <Metric label="뉴스" value={formatNumber(stock.newsCount)} />
        <Metric label="검색 지수" value={String(stock.searchScore)} />
      </div>

      {stock.weeklyUpsideProbability && (
        <section className="mt-7">
          <h3 className="text-base font-black text-slate-950">이번주 상승확률 (데이터 기반 예측)</h3>
          <div className="mt-4 rounded-[24px] bg-blue-50 p-5">
            <p className="break-keep text-xs font-bold leading-5 text-blue-700">이번주 상승확률 (데이터 기반 예측)</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="text-[42px] font-black leading-none tabular-nums text-blue-950">{stock.weeklyUpsideProbability.probability}%</p>
              <div className="text-right">
                <p className="text-xs font-black text-blue-800">분석 강도: {formatGrade(stock.weeklyUpsideProbability.grade)}</p>
                <p className="mt-1 text-xs font-bold text-blue-700">데이터 범위: {formatDataQuality(stock.weeklyUpsideProbability.dataQuality)}</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-bold leading-6 text-blue-900">{stock.weeklyUpsideProbability.label}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-blue-800">{stock.weeklyUpsideProbability.summary}</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {stock.weeklyUpsideProbability.factors.map((factor) => (
              <div key={factor.name} className="rounded-[20px] bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-950">{factor.name}</p>
                  <p className="text-sm font-black tabular-nums text-slate-700">{factor.score}</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <span className="block h-full rounded-full bg-blue-400" style={{ width: `${factor.score}%` }} />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 rounded-[22px] bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
            본 확률은 온라인 언급 흐름, 뉴스 노출, 가격 흐름 데이터를 기반으로 산출한 참고 분석 지표입니다. 투자 판단의 근거가 아닌 보조 자료이며, 최종 결정과 책임은 사용자 본인에게 있습니다.
          </p>
        </section>
      )}

      <section className="mt-7">
        <h3 className="text-base font-black text-slate-950">7일 언급량 추이</h3>
        <div className="mt-4 rounded-3xl bg-slate-50 p-4">
          <MiniTrendChart values={stock.trend7d} tall />
        </div>
      </section>

      <section className="mt-7">
        <h3 className="text-base font-black text-slate-950">감성 분석</h3>
        <div className="mt-4">
          <SentimentBar sentiment={stock.sentiment} />
        </div>
      </section>

      {usefulSignals.length > 0 && (
        <details className="mt-7 rounded-[22px] bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-black text-slate-900">언급-가격 동행성 보조 분석</summary>
          <div className="mt-3 space-y-2">
            {usefulSignals.map((signal) => (
              <CompactSignal key={signal.horizon} signal={signal} />
            ))}
          </div>
        </details>
      )}

      <section className="mt-7">
        <h3 className="text-base font-black text-slate-950">주요 언급 키워드</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {stock.keywords.map((keyword) => (
            <span key={keyword} className="rounded-full bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
              {keyword}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h3 className="text-base font-black text-slate-950">관련 뉴스</h3>
        <ul className="mt-3 space-y-2">
          {stock.headlines.slice(0, 3).map((headline) => (
            <li key={headline} className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-600">
              {headline}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-7">
        <h3 className="text-base font-black text-slate-950">관련 종목</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {stock.relatedSymbols.map((symbol) => (
            <span key={symbol} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">
              {symbol}
            </span>
          ))}
        </div>
      </section>
    </aside>
  );
}

function Metric({ label, value, tone = "text-slate-950" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-[18px] bg-slate-50 p-4">
      <p className="break-keep text-xs font-bold leading-5 text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-black tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

function CompactSignal({ signal }: { signal: HorizonSignal }) {
  return (
    <div className="rounded-[18px] bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-900">{signal.horizon}</p>
        <p className="text-xs font-bold text-slate-500">표본 {signal.sampleSize}</p>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs font-bold text-slate-600">
        <SignalMetric label="Hit Rate" value={formatNullablePercent(signal.hitRate)} />
        <SignalMetric label="시장 대비" value={formatNullablePercent(signal.excessReturn)} />
        <SignalMetric label="상관" value={formatNullableNumber(signal.pearsonCorrelation ?? signal.spearmanCorrelation)} />
      </div>
    </div>
  );
}

function SignalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-400">{label}</p>
      <p className="mt-1 tabular-nums text-slate-800">{value}</p>
    </div>
  );
}

function formatNullablePercent(value: number | null): string {
  return value === null ? "-" : `${value.toFixed(1)}%`;
}

function formatNullableNumber(value: number | null): string {
  return value === null ? "-" : value.toFixed(2);
}
