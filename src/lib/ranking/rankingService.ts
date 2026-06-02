import { mockStocks } from "@/data/mockStocks";
import { calculateAttentionPriceScore } from "@/lib/analytics/attentionPriceScore";
import { calculatePearsonCorrelation } from "@/lib/analytics/correlation";
import { calculateQuantSignal } from "@/lib/analytics/quantSignal";
import { calculateWeeklyUpsideProbability } from "@/lib/analytics/weeklyUpsideProbability";
import { fetchAlphaVantageNews } from "@/lib/data-sources/alphaVantage";
import { fetchGdeltArticles } from "@/lib/data-sources/gdelt";
import { fetchGoogleNewsRss } from "@/lib/data-sources/googleNewsRss";
import { fetchNaverDataLab } from "@/lib/data-sources/naverDataLab";
import { fetchStocktwits } from "@/lib/data-sources/stocktwits";
import { fetchYahooFinanceRss } from "@/lib/data-sources/yahooFinanceRss";
import { getDailyPrices, type PricePoint } from "@/lib/market/priceData";
import { calculateMentionScore, clampScore, normalizeCount } from "@/lib/ranking/scoring";
import type {
  AttentionPriceCorrelation,
  RankingsResponse,
  SignalHorizon,
  SourceStatus,
  SourceStatusValue,
  StockItem,
  WeeklyUpsideProbability,
} from "@/types/stock";

type SourceFlags = {
  gdelt: boolean[];
  googleNews: boolean[];
  yahooFinance: boolean[];
  naverDataLab: boolean[];
  alphaVantage: boolean[];
  stocktwits: boolean[];
};

export async function getRankings(): Promise<RankingsResponse> {
  const sourceFlags: SourceFlags = {
    gdelt: [],
    googleNews: [],
    yahooFinance: [],
    naverDataLab: [],
    alphaVantage: [],
    stocktwits: [],
  };

  const stocks = await Promise.all(mockStocks.map((stock) => enrichStock(stock, sourceFlags)));
  const ranked = stocks
    .sort((a, b) => b.mentionScore - a.mentionScore)
    .slice(0, 30)
    .map((stock, index) => ({
      ...stock,
      rank: index + 1,
    }));

  return {
    ...buildUpdateMetadata(),
    sourceStatus: buildSourceStatus(sourceFlags),
    stocks: ranked,
  };
}

export function getMockRankings(): RankingsResponse {
  return {
    ...buildUpdateMetadata(),
    sourceStatus: {
      gdelt: "mock",
      googleNews: "mock",
      yahooFinance: "mock",
      naverDataLab: hasSecret(process.env.NAVER_CLIENT_ID) && hasSecret(process.env.NAVER_CLIENT_SECRET) ? "mock" : "disabled",
      alphaVantage: hasSecret(process.env.ALPHA_VANTAGE_API_KEY) ? "mock" : "disabled",
      stocktwits: "mock",
    },
    stocks: mockStocks.map((stock) => ({
      ...stock,
      correlation: buildFallbackCorrelation(stock),
      quantSignal: buildFallbackQuantSignal(stock),
      weeklyUpsideProbability: buildFallbackWeeklyUpsideProbability(stock),
    })),
  };
}

async function enrichStock(stock: StockItem, sourceFlags: SourceFlags): Promise<StockItem> {
  const [gdelt, googleNews, yahooFinance, naverDataLab, alphaVantage, stocktwits, prices] = await Promise.all([
    fetchGdeltArticles(`${stock.name} ${stock.symbol}`),
    fetchGoogleNewsRss({ name: stock.name, symbol: stock.symbol, market: stock.market }),
    fetchYahooFinanceRss(stock.symbol, stock.market),
    stock.market === "KR" ? fetchNaverDataLab({ name: stock.name, symbol: stock.symbol }) : Promise.resolve(null),
    stock.market === "US" ? fetchAlphaVantageNews(stock.symbol) : Promise.resolve(null),
    stock.market === "US" ? fetchStocktwits(stock.symbol) : Promise.resolve(null),
    getDailyPrices(stock.symbol, stock.market),
  ]);

  sourceFlags.gdelt.push(Boolean(gdelt));
  sourceFlags.googleNews.push(Boolean(googleNews));
  sourceFlags.yahooFinance.push(Boolean(yahooFinance));
  if (stock.market === "KR" && hasSecret(process.env.NAVER_CLIENT_ID) && hasSecret(process.env.NAVER_CLIENT_SECRET)) sourceFlags.naverDataLab.push(Boolean(naverDataLab));
  if (stock.market === "US" && hasSecret(process.env.ALPHA_VANTAGE_API_KEY)) sourceFlags.alphaVantage.push(Boolean(alphaVantage));
  if (stock.market === "US") sourceFlags.stocktwits.push(Boolean(stocktwits));

  const liveHeadlines = [...(yahooFinance?.headlines ?? []), ...(gdelt?.headlines ?? []), ...(googleNews?.headlines ?? []), ...(alphaVantage?.headlines ?? [])].slice(0, 3);
  const liveNewsCount = (gdelt?.articlesCount ?? 0) + (googleNews?.itemCount ?? 0) + (yahooFinance?.itemCount ?? 0) + (alphaVantage?.feedCount ?? 0);
  const newsCount = liveNewsCount > 0 ? liveNewsCount : stock.newsCount;
  const searchScore = naverDataLab?.searchScore ?? stock.searchScore;
  const communityMentions = stocktwits?.communityMentions ? Math.max(stock.communityMentions, stocktwits.communityMentions) : stock.communityMentions;
  const sentiment = alphaVantage?.sentiment ?? stocktwits?.sentiment ?? stock.sentiment;
  const momentumScore = naverDataLab?.momentumScore ?? clampScore(50 + stock.mentionChangeRate);

  const mentionScore = calculateMentionScore({
    newsExposureScore: liveNewsCount > 0 ? normalizeCount(liveNewsCount, 120) : stock.mentionScore,
    searchTrendScore: searchScore,
    communityScore: stocktwits?.communityMentions ? normalizeCount(stocktwits.communityMentions, 30) : normalizeCount(stock.communityMentions, 13000),
    momentumScore,
  });

  const trend7d = naverDataLab?.trend7d?.length ? naverDataLab.trend7d : stock.trend7d;
  const correlation = buildCorrelation({ stock, trend7d, prices });
  const quantSignal = buildQuantSignal({ stock, trend7d, prices });

  return {
    ...stock,
    mentionScore,
    newsCount,
    searchScore: clampScore(searchScore),
    communityMentions,
    sentiment,
    trend7d,
    headlines: liveHeadlines.length ? liveHeadlines : stock.headlines,
    correlation,
    quantSignal,
    weeklyUpsideProbability: buildWeeklyUpsideProbability({
      stock,
      mentionScore,
      newsCount,
      searchScore: clampScore(searchScore),
      communityMentions,
      sentimentPositive: sentiment.positive,
      sentimentNegative: sentiment.negative,
      correlation,
      quantSignal,
      dataSourceCount: countLiveSources([Boolean(gdelt), Boolean(googleNews), Boolean(yahooFinance), Boolean(naverDataLab), Boolean(alphaVantage), Boolean(stocktwits), Boolean(prices)]),
    }),
  };
}

function buildSourceStatus(flags: SourceFlags): SourceStatus {
  return {
    gdelt: statusFromFlags(flags.gdelt),
    googleNews: statusFromFlags(flags.googleNews),
    yahooFinance: statusFromFlags(flags.yahooFinance),
    naverDataLab: hasSecret(process.env.NAVER_CLIENT_ID) && hasSecret(process.env.NAVER_CLIENT_SECRET) ? statusFromFlags(flags.naverDataLab) : "disabled",
    alphaVantage: hasSecret(process.env.ALPHA_VANTAGE_API_KEY) ? statusFromFlags(flags.alphaVantage) : "disabled",
    stocktwits: statusFromFlags(flags.stocktwits),
  };
}

function hasSecret(value: string | undefined): boolean {
  return Boolean(value && value !== "dummy");
}

function statusFromFlags(flags: boolean[]): SourceStatusValue {
  if (flags.length === 0) return "disabled";
  if (flags.some(Boolean)) return "live";
  return "failed";
}

function buildCorrelation({
  stock,
  trend7d,
  prices,
}: {
  stock: StockItem;
  trend7d: number[];
  prices: PricePoint[] | null;
}): AttentionPriceCorrelation {
  if (!prices || prices.length < 14) {
    return buildFallbackCorrelation(stock, trend7d);
  }

  const recentPrices = prices.slice(-7);
  const mentionChanges = toPercentChanges(trend7d);
  const priceChanges = toPercentChanges(recentPrices.map((point) => point.close));
  const correlation = calculatePearsonCorrelation(mentionChanges, priceChanges);
  const lastWeekMentionChangeRate = getPeriodChangeRate(trend7d);
  const lastWeekPriceChangeRate = getPeriodChangeRate(recentPrices.map((point) => point.close));
  const score = calculateAttentionPriceScore({
    mentionChangeRate: lastWeekMentionChangeRate,
    priceChangeRate: lastWeekPriceChangeRate,
    correlation,
    dataPoints: prices.length,
  });

  return {
    mentionPriceCorrelation: correlation === null ? null : round(correlation, 2),
    lastWeekMentionChangeRate: roundNullable(lastWeekMentionChangeRate, 1),
    lastWeekPriceChangeRate: roundNullable(lastWeekPriceChangeRate, 1),
    attentionPriceScore: score.score,
    confidence: score.confidence,
    label: score.label,
  };
}

function buildFallbackCorrelation(stock: StockItem, trend7d = stock.trend7d): AttentionPriceCorrelation {
  const lastWeekMentionChangeRate = getPeriodChangeRate(trend7d) ?? stock.mentionChangeRate;
  const score = calculateAttentionPriceScore({
    mentionChangeRate: lastWeekMentionChangeRate,
    priceChangeRate: null,
    correlation: null,
    dataPoints: trend7d.length,
  });

  return {
    mentionPriceCorrelation: null,
    lastWeekMentionChangeRate: roundNullable(lastWeekMentionChangeRate, 1),
    lastWeekPriceChangeRate: null,
    attentionPriceScore: score.score,
    confidence: "low",
    label: score.label,
  };
}

function toPercentChanges(values: number[]): number[] {
  const changes: number[] = [];
  for (let index = 1; index < values.length; index += 1) {
    const previous = values[index - 1];
    const current = values[index];
    if (Number.isFinite(previous) && Number.isFinite(current) && previous !== 0) {
      changes.push(((current - previous) / previous) * 100);
    }
  }
  return changes;
}

function getPeriodChangeRate(values: number[]): number | null {
  const first = values[0];
  const last = values.at(-1);
  if (!Number.isFinite(first) || !Number.isFinite(last) || first === 0 || last === undefined) return null;
  return ((last - first) / first) * 100;
}

function roundNullable(value: number | null, digits: number): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return round(value, digits);
}

function round(value: number, digits: number): number {
  const unit = 10 ** digits;
  return Math.round(value * unit) / unit;
}

function buildQuantSignal({
  stock,
  trend7d,
  prices,
}: {
  stock: StockItem;
  trend7d: number[];
  prices: PricePoint[] | null;
}) {
  const mentionHistory = buildMentionHistory(trend7d, stock.communityMentions);
  return calculateQuantSignal({
    mentionHistory,
    priceReturnsByHorizon: buildPriceReturnsByHorizon(prices),
    currentMentionCount: stock.communityMentions,
  });
}

function buildFallbackQuantSignal(stock: StockItem) {
  return calculateQuantSignal({
    mentionHistory: buildMentionHistory(stock.trend7d, stock.communityMentions),
    priceReturnsByHorizon: buildEmptyReturnsByHorizon(),
    currentMentionCount: stock.communityMentions,
  });
}

function buildWeeklyUpsideProbability({
  stock,
  mentionScore,
  newsCount,
  searchScore,
  communityMentions,
  sentimentPositive,
  sentimentNegative,
  correlation,
  quantSignal,
  dataSourceCount,
}: {
  stock: StockItem;
  mentionScore: number;
  newsCount: number;
  searchScore: number;
  communityMentions: number;
  sentimentPositive: number;
  sentimentNegative: number;
  correlation: AttentionPriceCorrelation;
  quantSignal: ReturnType<typeof buildQuantSignal>;
  dataSourceCount: number;
}): WeeklyUpsideProbability {
  const primary = quantSignal.horizons.find((item) => item.horizon === quantSignal.primaryHorizon);

  return calculateWeeklyUpsideProbability({
    mentionScore,
    mentionChangeRate: stock.mentionChangeRate,
    newsCount,
    searchScore,
    communityMentions,
    sentimentPositive,
    sentimentNegative,
    priceChangeRate: correlation.lastWeekPriceChangeRate ?? primary?.priceReturn ?? null,
    marketAdjustedReturn: primary?.excessReturn ?? null,
    hitRate: primary?.hitRate ?? null,
    pearsonCorrelation: primary?.pearsonCorrelation ?? correlation.mentionPriceCorrelation,
    spearmanCorrelation: primary?.spearmanCorrelation ?? null,
    dataSourceCount,
    sampleSize: primary?.sampleSize ?? 0,
  });
}

function buildFallbackWeeklyUpsideProbability(stock: StockItem): WeeklyUpsideProbability {
  const correlation = buildFallbackCorrelation(stock);
  const quantSignal = buildFallbackQuantSignal(stock);
  return buildWeeklyUpsideProbability({
    stock,
    mentionScore: stock.mentionScore,
    newsCount: stock.newsCount,
    searchScore: stock.searchScore,
    communityMentions: stock.communityMentions,
    sentimentPositive: stock.sentiment.positive,
    sentimentNegative: stock.sentiment.negative,
    correlation,
    quantSignal,
    dataSourceCount: 1,
  });
}

function countLiveSources(values: boolean[]): number {
  return values.filter(Boolean).length;
}

function buildMentionHistory(trend7d: number[], currentMentions: number): number[] {
  const base = Math.max(currentMentions / Math.max(trend7d.at(-1) ?? 1, 1), 1);
  const recent = trend7d.map((value) => Math.round(value * base));
  const first = recent[0] ?? currentMentions;
  const prefix = Array.from({ length: 23 }, (_, index) => Math.round(first * (0.84 + index * 0.006)));
  return [...prefix, ...recent].filter(Number.isFinite);
}

function buildPriceReturnsByHorizon(prices: PricePoint[] | null): Record<SignalHorizon, number[]> {
  if (!prices || prices.length < 7) return buildEmptyReturnsByHorizon();
  const closes = prices.map((point) => point.close);
  const dailyReturns = rollingReturns(closes, 1);
  return {
    "6H": dailyReturns.map((value) => value / 4),
    "24H": dailyReturns,
    "3D": rollingReturns(closes, 3),
    "5D": rollingReturns(closes, 5),
  };
}

function buildEmptyReturnsByHorizon(): Record<SignalHorizon, number[]> {
  return {
    "6H": [],
    "24H": [],
    "3D": [],
    "5D": [],
  };
}

function rollingReturns(values: number[], windowSize: number): number[] {
  const returns: number[] = [];
  for (let index = windowSize; index < values.length; index += 1) {
    const start = values[index - windowSize];
    const end = values[index];
    if (Number.isFinite(start) && Number.isFinite(end) && start > 0 && end > 0) {
      returns.push(((end - start) / start) * 100);
    }
  }
  return returns.slice(-30);
}

function buildUpdateMetadata(): Pick<RankingsResponse, "updatedAt" | "nextUpdateAt" | "updateIntervalHours"> {
  const updatedAt = new Date();
  const nextUpdateAt = new Date(updatedAt);
  nextUpdateAt.setUTCHours(Math.floor(updatedAt.getUTCHours() / 6) * 6 + 6, 0, 0, 0);

  return {
    updatedAt: updatedAt.toISOString(),
    nextUpdateAt: nextUpdateAt.toISOString(),
    updateIntervalHours: 6,
  };
}
