import { fetchWithTimeout } from "@/lib/api/fetchWithTimeout";
import { sanitizeSymbol, sanitizeText } from "@/lib/security/validation";
import type { Sentiment } from "@/types/stock";

type AlphaVantageResponse = {
  feed?: Array<{
    title?: string;
    url?: string;
    overall_sentiment_score?: number;
  }>;
};

export type AlphaVantageResult = {
  feedCount: number;
  sentiment?: Sentiment;
  headlines: string[];
};

export async function fetchAlphaVantageNews(symbol: string): Promise<AlphaVantageResult | null> {
  const safeSymbol = sanitizeSymbol(symbol);
  if (!safeSymbol) return null;

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "NEWS_SENTIMENT");
  url.searchParams.set("tickers", safeSymbol);
  url.searchParams.set("sort", "LATEST");
  url.searchParams.set("limit", "50");
  url.searchParams.set("apikey", apiKey);

  const data = await fetchWithTimeout<AlphaVantageResponse>(url.toString());
  if (!data?.feed) return null;

  const scores = data.feed.map((item) => item.overall_sentiment_score).filter((score): score is number => typeof score === "number");
  const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

  return {
    feedCount: data.feed.length,
    sentiment: sentimentFromScore(average),
    headlines: data.feed.map((item) => (item.title ? sanitizeText(item.title) : "")).filter(Boolean).slice(0, 3),
  };
}

function sentimentFromScore(score: number): Sentiment {
  if (score > 0.2) return { positive: 58, neutral: 30, negative: 12 };
  if (score < -0.2) return { positive: 24, neutral: 36, negative: 40 };
  return { positive: 38, neutral: 46, negative: 16 };
}
