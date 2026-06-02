import { getFallbackRankings, setCachedRankings } from "@/lib/ranking/rankingCache";
import { getRankings } from "@/lib/ranking/rankingService";
import type { RankingsResponse } from "@/types/stock";

export async function updateRankingsCache(): Promise<RankingsResponse> {
  try {
    return setCachedRankings(await getRankings());
  } catch {
    return setCachedRankings(getFallbackRankings());
  }
}
