import { fetchWithTimeout } from "@/lib/api/fetchWithTimeout";
import { isValidMarket, sanitizeSymbol } from "@/lib/security/validation";
import type { Market, PriceQuote } from "@/types/stock";

export type PricePoint = {
  date: string;
  close: number;
};

type AlphaVantageDailyResponse = {
  "Time Series (Daily)"?: Record<string, { "4. close"?: string }>;
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        currency?: string;
        regularMarketTime?: number;
      };
    }>;
  };
};

export async function fetchAlphaVantageDailyPrices(symbol: string): Promise<PricePoint[] | null> {
  const safeSymbol = sanitizeSymbol(symbol);
  if (!safeSymbol) return null;

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey || apiKey === "dummy") return null;

  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "TIME_SERIES_DAILY");
  url.searchParams.set("symbol", safeSymbol);
  url.searchParams.set("apikey", apiKey);

  const data = await fetchWithTimeout<AlphaVantageDailyResponse>(url.toString());
  const series = data?.["Time Series (Daily)"];
  if (!series) return null;

  return Object.entries(series)
    .map(([date, value]) => toPricePoint(date, value["4. close"]))
    .filter((point): point is PricePoint => point !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchStooqDailyPrices(symbol: string, market: Market): Promise<PricePoint[] | null> {
  if (!isValidMarket(market)) return null;
  if (market !== "US") return null;
  const safeSymbol = sanitizeSymbol(symbol);
  if (!safeSymbol) return null;

  const stooqSymbol = `${safeSymbol.toLowerCase()}.us`;
  const csv = await fetchWithTimeout<string>(`https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSymbol)}&i=d`);
  if (!csv) return null;

  const points = csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => {
      const [date, , , , close] = line.split(",");
      return toPricePoint(date, close);
    })
    .filter((point): point is PricePoint => point !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  return points.length >= 2 ? points : null;
}

export async function getDailyPrices(symbol: string, market: Market): Promise<PricePoint[] | null> {
  const alphaPrices = await fetchAlphaVantageDailyPrices(symbol);
  if (alphaPrices && alphaPrices.length >= 14) return alphaPrices;

  const stooqPrices = await fetchStooqDailyPrices(symbol, market);
  if (stooqPrices && stooqPrices.length >= 14) return stooqPrices;

  return null;
}

export async function getLatestPriceQuote(symbol: string, market: Market, dailyPrices?: PricePoint[] | null): Promise<PriceQuote | null> {
  const yahooQuote = await fetchYahooLatestPrice(symbol, market);
  if (yahooQuote) return yahooQuote;

  const prices = dailyPrices ?? (await getDailyPrices(symbol, market));
  const latest = prices?.at(-1);
  if (!latest) return null;

  return {
    value: latest.close,
    currency: market === "KR" ? "KRW" : "USD",
    source: market === "US" ? "Stooq" : "Fallback",
    asOf: latest.date,
    isDelayed: true,
  };
}

async function fetchYahooLatestPrice(symbol: string, market: Market): Promise<PriceQuote | null> {
  if (!isValidMarket(market)) return null;
  const safeSymbol = sanitizeSymbol(symbol);
  if (!safeSymbol) return null;

  const yahooSymbol = market === "KR" ? `${safeSymbol}.KS` : safeSymbol;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1m`;
  const data = await fetchWithTimeout<YahooChartResponse>(url, {}, 3500);
  const meta = data?.chart?.result?.[0]?.meta;
  const value = meta?.regularMarketPrice ?? meta?.chartPreviousClose;
  if (!Number.isFinite(value) || value === undefined || value <= 0) return null;

  return {
    value,
    currency: meta?.currency === "KRW" ? "KRW" : "USD",
    source: "Yahoo",
    asOf: meta?.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
    isDelayed: true,
  };
}

function toPricePoint(date: string | undefined, close: string | undefined): PricePoint | null {
  const parsedClose = Number(close);
  if (!date || !Number.isFinite(parsedClose) || parsedClose <= 0) return null;
  return { date, close: parsedClose };
}
