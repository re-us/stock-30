import { fetchWithTimeout } from "@/lib/api/fetchWithTimeout";
import { sanitizeSearchQuery, sanitizeSymbol } from "@/lib/security/validation";

type NaverDataLabResponse = {
  results?: Array<{
    data?: Array<{
      period: string;
      ratio: number;
    }>;
  }>;
};

export type NaverDataLabResult = {
  searchScore: number;
  momentumScore: number;
  trend7d: number[];
};

export async function fetchNaverDataLab({
  name,
  symbol,
}: {
  name: string;
  symbol: string;
}): Promise<NaverDataLabResult | null> {
  const safeSymbol = sanitizeSymbol(symbol);
  const safeName = sanitizeSearchQuery(name);
  if (!safeSymbol || !safeName) return null;

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret || clientId === "dummy" || clientSecret === "dummy") return null;

  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 7);

  const data = await fetchWithTimeout<NaverDataLabResponse>(
    "https://openapi.naver.com/v1/datalab/search",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      body: JSON.stringify({
        startDate: toDateString(startDate),
        endDate: toDateString(endDate),
        timeUnit: "date",
        keywordGroups: [{ groupName: safeName, keywords: [safeName, safeSymbol] }],
      }),
    },
    5000,
  );

  const ratios = data?.results?.[0]?.data?.map((item) => item.ratio).filter(Number.isFinite);
  if (!ratios?.length) return null;

  const first = ratios[0] ?? 0;
  const last = ratios.at(-1) ?? 0;

  return {
    searchScore: Math.round(last),
    momentumScore: Math.max(0, Math.min(100, Math.round(50 + (last - first)))),
    trend7d: ratios.slice(-7).map((ratio) => Math.round(ratio)),
  };
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
