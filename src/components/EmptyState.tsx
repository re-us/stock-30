export function EmptyState() {
  return (
    <div className="rounded-[24px] bg-white p-8 text-center shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <p className="text-lg font-black text-slate-900">검색 결과가 없습니다</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">필터를 바꾸거나 다른 종목명, 티커로 찾아보세요.</p>
    </div>
  );
}
