import { fetchWithTimeout } from "@/lib/api/fetchWithTimeout";
import { isValidMarket, sanitizeSymbol, sanitizeText } from "@/lib/security/validation";
import type { Market } from "@/types/stock";

export type YahooFinanceRssResult = {
  itemCount: number;
  headlines: string[];
};

export async function fetchYahooFinanceRss(symbol: string, market: Market): Promise<YahooFinanceRssResult | null> {
  if (!isValidMarket(market)) return null;
  const safeSymbol = sanitizeSymbol(symbol);
  if (!safeSymbol) return null;

  const yahooSymbol = market === "KR" ? `${safeSymbol}.KS` : safeSymbol;
  const url = new URL("https://feeds.finance.yahoo.com/rss/2.0/headline");
  url.searchParams.set("s", yahooSymbol);
  url.searchParams.set("region", market === "KR" ? "KR" : "US");
  url.searchParams.set("lang", market === "KR" ? "ko-KR" : "en-US");

  const xml = await fetchWithTimeout<string>(url.toString(), {}, 5000);
  if (!xml) return null;

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]);
  const headlines = items
    .map((item) => item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/)?.[1])
    .filter((title): title is string => Boolean(title))
    .map((title) => sanitizeText(decodeXml(title)))
    .slice(0, 3);

  return {
    itemCount: items.length,
    headlines,
  };
}

function decodeXml(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}
