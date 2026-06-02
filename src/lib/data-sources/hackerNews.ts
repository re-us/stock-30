import { fetchWithTimeout } from "@/lib/api/fetchWithTimeout";
import { sanitizeSearchQuery, sanitizeSymbol, sanitizeText } from "@/lib/security/validation";

type HackerNewsResponse = {
  nbHits?: number;
  hits?: Array<{
    title?: string;
    story_title?: string;
    comment_text?: string;
  }>;
};

export type HackerNewsResult = {
  mentionsCount: number;
  headlines: string[];
};

export async function fetchHackerNewsMentions({
  name,
  symbol,
}: {
  name: string;
  symbol: string;
}): Promise<HackerNewsResult | null> {
  const safeSymbol = sanitizeSymbol(symbol);
  const safeName = sanitizeSearchQuery(name);
  if (!safeSymbol || !safeName) return null;

  const since = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
  const url = new URL("https://hn.algolia.com/api/v1/search_by_date");
  url.searchParams.set("query", safeName);
  url.searchParams.set("tags", "(story,comment)");
  url.searchParams.set("numericFilters", `created_at_i>${since}`);
  url.searchParams.set("hitsPerPage", "20");

  const data = await fetchWithTimeout<HackerNewsResponse>(url.toString(), {}, 5000);
  if (!data?.hits) return null;

  const headlines = data.hits
    .map((hit) => hit.title ?? hit.story_title ?? stripHtml(hit.comment_text ?? ""))
    .filter(Boolean)
    .map((title) => sanitizeText(title, 100))
    .filter(Boolean)
    .slice(0, 3);

  return {
    mentionsCount: data.nbHits ?? data.hits.length,
    headlines,
  };
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
}
