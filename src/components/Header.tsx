type HeaderProps = {
  onRefresh: () => void;
  isRefreshing: boolean;
  updatedAt: string | null;
};

export function Header({ onRefresh, isRefreshing, updatedAt }: HeaderProps) {
  return (
    <header>
      <div className="rounded-[20px] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.035)] sm:px-6 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-black leading-none tracking-normal text-[#191f28] sm:text-4xl">STOCK 30</h1>
          <p className="mt-2 text-xs font-bold leading-4 text-slate-400 sm:text-sm">최근 {formatKoreanTime(updatedAt)}</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="새로고침"
          className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-full bg-[#191f28] text-white transition active:scale-[0.96]"
        >
          <svg
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 3v6h-6" />
          </svg>
        </button>
      </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 px-1">
        <p className="text-sm font-black leading-5 text-slate-600">온라인 언급 기반 주식 TOP 30</p>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-normal text-slate-500">
          made by re-us
        </span>
      </div>
    </header>
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
