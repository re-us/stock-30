import { fetchWithTimeout } from "@/lib/api/fetchWithTimeout";
import { isValidMarket, sanitizeSearchQuery, sanitizeSymbol, sanitizeText } from "@/lib/security/validation";
import type { Market } from "@/types/stock";

export type GoogleNewsRssResult = {
  itemCount: number;
  headlines: string[];
};

export async function fetchGoogleNewsRss({
  name,
  symbol,
  market,
}: {
  name: string;
  symbol: string;
  market: Market;
}): Promise<GoogleNewsRssResult | null> {
  if (!isValidMarket(market)) return null;
  const safeSymbol = sanitizeSymbol(symbol);
  const safeName = sanitizeSearchQuery(name);
  if (!safeSymbol || !safeName) return null;

  const url = new URL("https://news.google.com/rss/search");
  const locale = market === "KR" ? { hl: "ko", gl: "KR", ceid: "KR:ko" } : { hl: "en-US", gl: "US", ceid: "US:en" };
  url.searchParams.set("q", `${safeName} OR ${safeSymbol}`);
  url.searchParams.set("hl", locale.hl);
  url.searchParams.set("gl", locale.gl);
  url.searchParams.set("ceid", locale.ceid);

  const xml = await fetchWithTimeout<string>(url.toString(), {}, 5000);
  if (!xml) return null;

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]);
  const headlines = items
    .map((item) => {
      const title = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/);
      return title?.[1] ?? title?.[2];
    })
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
