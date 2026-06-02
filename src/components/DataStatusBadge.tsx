import type { SourceStatus } from "@/types/stock";

type DataStatusBadgeProps = {
  dataState: "live" | "partial" | "mock";
  sourceStatus: SourceStatus;
  updatedAt: string | null;
  nextUpdateAt: string | null;
  updateIntervalHours: 6;
};

export function DataStatusBadge({
  dataState,
  sourceStatus,
  updatedAt,
  nextUpdateAt,
  updateIntervalHours,
}: DataStatusBadgeProps) {
  const label = dataState === "live" ? "Live" : dataState === "partial" ? "Partial" : "Mock";

  return (
    <section className="rounded-[22px] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-900">Data: {label}</p>
        <p className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">{updateIntervalHours}시간마다 업데이트</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold leading-5 text-slate-500">
        <p>마지막 {formatKoreanTime(updatedAt)}</p>
        <p>다음 {formatKoreanTime(nextUpdateAt)}</p>
        <p className="col-span-2 truncate">
          GDELT {sourceStatus.gdelt} · Google {sourceStatus.googleNews} · Yahoo {sourceStatus.yahooFinance} · Naver {sourceStatus.naverDataLab}
        </p>
      </div>
    </section>
  );
}

function formatKoreanTime(value: string | null): string {
  if (!value) return "확인 중";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
