import { fetchWithTimeout } from "@/lib/api/fetchWithTimeout";
import { sanitizeSymbol } from "@/lib/security/validation";
import type { Sentiment } from "@/types/stock";

type StocktwitsResponse = {
  messages?: Array<{
    entities?: {
      sentiment?: {
        basic?: "Bullish" | "Bearish";
      };
    };
  }>;
};

export type StocktwitsResult = {
  communityMentions: number;
  sentiment?: Sentiment;
};

export async function fetchStocktwits(symbol: string): Promise<StocktwitsResult | null> {
  const safeSymbol = sanitizeSymbol(symbol);
  if (!safeSymbol) return null;

  const data = await fetchWithTimeout<StocktwitsResponse>(
    `https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(safeSymbol)}.json`,
    {},
    5000,
  );
  if (!data?.messages) return null;

  const bullish = data.messages.filter((message) => message.entities?.sentiment?.basic === "Bullish").length;
  const bearish = data.messages.filter((message) => message.entities?.sentiment?.basic === "Bearish").length;
  const known = bullish + bearish;

  return {
    communityMentions: data.messages.length,
    sentiment: known > 0 ? toSentiment(bullish, bearish, known) : undefined,
  };
}

function toSentiment(bullish: number, bearish: number, known: number): Sentiment {
  const positive = Math.round((bullish / known) * 100);
  const negative = Math.round((bearish / known) * 100);
  return {
    positive,
    negative,
    neutral: Math.max(0, 100 - positive - negative),
  };
}
