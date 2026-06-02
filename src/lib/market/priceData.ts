import { fetchWithTimeout } from "@/lib/api/fetchWithTimeout";
import { isValidMarket, sanitizeSymbol } from "@/lib/security/validation";
import type { Market } from "@/types/stock";

export type PricePoint = {
  date: string;
  close: number;
};

type AlphaVantageDailyResponse = {
  "Time Series (Daily)"?: Record<string, { "4. close"?: string }>;
};

export async function fetchAlphaVantageDailyPrices(symbol: string): Promise<PricePoint[] | null> {
  const safeSymbol = sanitizeSymbol(symbol);
  if (!safeSymbol) return null;

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) return null;

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

function toPricePoint(date: string | undefined, close: string | undefined): PricePoint | null {
  const parsedClose = Number(close);
  if (!date || !Number.isFinite(parsedClose) || parsedClose <= 0) return null;
  return { date, close: parsedClose };
}
