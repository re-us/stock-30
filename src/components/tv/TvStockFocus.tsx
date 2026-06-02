import type { StockItem } from "@/types/stock";
import { formatMentionScore10, formatPercent } from "@/utils/format";
import { getStockDisplayName } from "@/utils/stockNames";

type TvStockFocusProps = {
  stock: StockItem;
};

export function TvStockFocus({ stock }: TvStockFocusProps) {
  const probability = stock.weeklyUpsideProbability?.probability ?? null;
  const keywords = stock.keywords.slice(0, 3);
  const headlines = stock.headlines.slice(0, 2).map((headline) => translateHeadlineForDisplay(headline, stock));

  return (
    <aside key={stock.id} className="tv-focus-enter min-h-0 overflow-hidden rounded-[28px] bg-gradient-to-br from-white via-white to-slate-100 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.92)] ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xl font-black text-blue-600">현재 {stock.rank}위</p>
          <h2 className="mt-2 truncate text-5xl font-black leading-tight text-slate-950">{getStockDisplayName(stock)}</h2>
          <p className="mt-1 truncate text-xl font-bold text-slate-500">
            {stock.symbol} · {stock.market} · {stock.sector}
          </p>
        </div>
        <div className="shrink-0 rounded-[24px] bg-gradient-to-br from-slate-950 to-slate-800 px-6 py-4 text-right text-white shadow-[0_16px_28px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.12)]">
          <p className="text-base font-bold text-slate-300">Score / 10</p>
          <p className="text-6xl font-black leading-none tabular-nums">{formatMentionScore10(stock.mentionScore)}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Metric label="전일대비 관심량 증가" value={formatPercent(stock.mentionChangeRate)} tone={stock.mentionChangeRate >= 0 ? "text-emerald-600" : "text-rose-500"} />
        <Metric label="이번주 상승확률 (데이터 기반 예측)" value={probability === null ? "-" : `${probability}%`} tone="text-blue-600" />
      </div>

      <div className="mt-4 rounded-[22px] bg-gradient-to-br from-blue-50 via-white to-sky-50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-blue-100">
        <p className="text-base font-black text-blue-700">참고 분석 지표</p>
        <p className="mt-1 text-2xl font-black text-blue-950">온라인 언급 흐름과 가격 흐름 기반 참고치</p>
        <p className="mt-2 line-clamp-1 text-base font-semibold text-blue-800">해당 지표는 매매 권유가 아닌 투자 판단의 보조 자료입니다.</p>
      </div>

      <section className="mt-4">
        <h3 className="text-xl font-black text-slate-950">왜 떴나요?</h3>
        <p className="mt-2 line-clamp-2 rounded-[20px] bg-slate-50 p-3.5 text-lg font-bold leading-7 text-slate-700">{stock.reason}</p>
      </section>

      <section className="mt-4">
        <h3 className="text-xl font-black text-slate-950">주요 키워드</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <span key={keyword} className="rounded-full bg-blue-50 px-4 py-2 text-lg font-black text-blue-700">
              {keyword}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-4">
        <h3 className="text-xl font-black text-slate-950">관련 뉴스</h3>
        <ul className="mt-2 space-y-2">
          {headlines.map((headline) => (
            <li key={headline} className="break-words rounded-2xl bg-slate-50 px-4 py-2.5 text-base font-bold leading-6 text-slate-600">
              {headline}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-4 grid grid-cols-[1fr_150px] gap-3">
        <section className="rounded-[20px] bg-slate-50 p-4">
          <h3 className="text-lg font-black text-slate-950">반응 비율</h3>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-200">
            <span className="bg-emerald-400" style={{ width: `${stock.sentiment.positive}%` }} />
            <span className="bg-slate-300" style={{ width: `${stock.sentiment.neutral}%` }} />
            <span className="bg-rose-300" style={{ width: `${stock.sentiment.negative}%` }} />
          </div>
          <p className="mt-3 text-base font-bold text-slate-500">
            긍정 {stock.sentiment.positive}% · 중립 {stock.sentiment.neutral}% · 부정 {stock.sentiment.negative}%
          </p>
        </section>
        <section className="rounded-[20px] bg-slate-50 p-4">
          <h3 className="text-lg font-black text-slate-950">7일 추이</h3>
          <div className="mt-4 flex h-20 items-end gap-1">
            {stock.trend7d.map((value, index) => (
              <span key={`${value}-${index}`} className="w-full rounded-t-md bg-blue-400/70" style={{ height: `${getTrendHeight(stock.trend7d, value)}%` }} />
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-[20px] bg-gradient-to-br from-white to-slate-50 p-4 shadow-[0_6px_14px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-slate-200/70">
      <p className="break-keep text-sm font-bold leading-5 text-slate-500">{label}</p>
      <p className={`mt-1 text-4xl font-black tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

function getTrendHeight(values: number[], value: number): number {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  return 26 + ((value - min) / range) * 74;
}

function translateHeadlineForDisplay(headline: string, stock: StockItem): string {
  if (!hasEnglish(headline)) return headline;

  const source = headline.replace(/\s+-\s+[^-]+$/g, "").trim();
  const stockName = getStockDisplayName(stock);
  const lower = source.toLowerCase();

  if (lower.includes("coinbase launches in india")) return "코인베이스, 인도 시장에서 INR 직접 결제망으로 서비스 확대";
  if (lower.includes("strategy slides") && lower.includes("coinbase drops")) return "비트코인 매도 이슈로 스트래티지와 코인베이스 관련 뉴스 확산";
  if (lower.includes("valuation") && lower.includes("palantir")) return "팔란티어 최근 주가 흐름 이후 밸류에이션 점검 기사";
  if (lower.includes("nvidia") && lower.includes("humanoid robots")) return "엔비디아, 휴머노이드 로봇 관련 투자 확대 이슈 부각";
  if (lower.includes("nvidia") && lower.includes("chip")) return "엔비디아 반도체 공급과 신규 칩 관련 이슈가 주목받음";
  if (lower.includes("ark") && lower.includes("nvda")) return "ARK의 엔비디아 관련 매매 동향과 반도체 업종 뉴스 확산";
  if (lower.includes("tesla")) return "테슬라 관련 전기차와 자율주행 이슈가 온라인에서 확산";
  if (lower.includes("apple")) return "애플 관련 신제품과 AI 기능 이슈가 뉴스에 반영";
  if (lower.includes("microsoft")) return "마이크로소프트 AI와 클라우드 사업 관련 뉴스 확산";
  if (lower.includes("amazon")) return "아마존 AWS와 커머스 사업 관련 뉴스 확산";
  if (lower.includes("meta")) return "메타 플랫폼스 광고와 AI 서비스 관련 뉴스 확산";
  if (lower.includes("google") || lower.includes("alphabet")) return "알파벳 검색과 AI 서비스 관련 뉴스 확산";

  return `${stockName} 관련 해외 뉴스가 온라인에서 확산`;
}

function hasEnglish(value: string): boolean {
  return /[A-Za-z]/.test(value);
}
