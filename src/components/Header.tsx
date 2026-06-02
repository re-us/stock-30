type HeaderProps = {
  onRefresh: () => void;
  isRefreshing: boolean;
};

export function Header({ onRefresh, isRefreshing }: HeaderProps) {
  return (
    <header className="rounded-[20px] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.035)] sm:px-6 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-black leading-none tracking-normal text-[#191f28] sm:text-4xl">STOCK 30</h1>
          <p className="mt-2 text-xs font-bold leading-4 text-slate-500 sm:text-sm">온라인 노출량 기반 · 6시간 업데이트</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="min-h-9 shrink-0 rounded-full bg-[#191f28] px-3.5 text-xs font-black text-white transition active:scale-[0.98] sm:min-h-10 sm:px-4"
        >
          {isRefreshing ? "확인 중" : "새로고침"}
        </button>
      </div>
    </header>
  );
}
