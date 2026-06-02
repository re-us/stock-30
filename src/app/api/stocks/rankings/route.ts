import { NextResponse } from "next/server";
import { getCachedRankings, getFallbackRankings, isRankingCacheFresh, setCachedRankings } from "@/lib/ranking/rankingCache";
import { getRankings } from "@/lib/ranking/rankingService";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ip = getClientIp(request.headers);
  const limit = rateLimit(`rankings:${ip}`, 60, 60_000);

  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  try {
    const cached = getCachedRankings();
    const rankings = isRankingCacheFresh(cached) ? cached : setCachedRankings(await getRankings());
    return NextResponse.json(rankings, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(getFallbackRankings(), {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}
