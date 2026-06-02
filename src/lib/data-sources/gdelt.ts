import { fetchWithTimeout } from "@/lib/api/fetchWithTimeout";
import { sanitizeSearchQuery, sanitizeText } from "@/lib/security/validation";

export type GdeltArticle = {
  title: string;
  url: string;
  seendate: string;
  sourceCountry?: string;
  domain?: string;
};

type GdeltResponse = {
  articles?: GdeltArticle[];
};

export type GdeltResult = {
  articlesCount: number;
  headlines: string[];
};

export async function fetchGdeltArticles(query: string): Promise<GdeltResult | null> {
  const safeQuery = sanitizeSearchQuery(query);
  if (!safeQuery) return null;

  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", safeQuery);
  url.searchParams.set("mode", "ArtList");
  url.searchParams.set("format", "json");
  url.searchParams.set("maxrecords", "50");
  url.searchParams.set("sort", "DateDesc");

  const data = await fetchWithTimeout<GdeltResponse>(url.toString());
  if (!data?.articles) return null;

  return {
    articlesCount: data.articles.length,
    headlines: data.articles.map((article) => sanitizeText(article.title)).filter(Boolean).slice(0, 3),
  };
}
