import { getMockRankings } from "@/lib/ranking/rankingService";
import type { RankingsResponse } from "@/types/stock";

let cachedRankings: RankingsResponse | null = null;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export function getCachedRankings(): RankingsResponse | null {
  return cachedRankings;
}

export function setCachedRankings(data: RankingsResponse): RankingsResponse {
  cachedRankings = data;
  return cachedRankings;
}

export function isRankingCacheFresh(data: RankingsResponse | null, ttlMs = CACHE_TTL_MS): boolean {
  if (!data) return false;
  const updatedAt = Date.parse(data.updatedAt);
  if (!Number.isFinite(updatedAt)) return false;
  return Date.now() - updatedAt < ttlMs;
}

export function getFallbackRankings(): RankingsResponse {
  return getMockRankings();
}
