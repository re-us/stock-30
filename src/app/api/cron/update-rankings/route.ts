import { NextRequest, NextResponse } from "next/server";
import { updateRankingsCache } from "@/lib/scheduler/updateRankings";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const limit = rateLimit(`cron:${ip}`, 5, 60_000);

  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  const secret = process.env.CRON_SECRET;
  const isProduction = process.env.NODE_ENV === "production";
  const authorization = request.headers.get("authorization");

  if (!secret && isProduction) {
    return NextResponse.json({ ok: false, error: "Cron is not configured" }, { status: 500 });
  }

  if (secret && authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rankings = await updateRankingsCache();
    return NextResponse.json({
      ok: true,
      updatedAt: rankings.updatedAt,
      nextUpdateAt: rankings.nextUpdateAt,
      updateIntervalHours: rankings.updateIntervalHours,
      stockCount: rankings.stocks.length,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to update rankings" }, { status: 500 });
  }
}
