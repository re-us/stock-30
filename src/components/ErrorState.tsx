export function ErrorState() {
  return (
    <div className="rounded-3xl border border-rose-100 bg-white p-6 text-center shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
      <p className="font-black text-slate-900">데이터를 불러오지 못했습니다</p>
      <p className="mt-2 text-sm font-medium text-slate-500">현재 화면은 더미 데이터 기반이며, 실제 연동 단계에서 재시도 흐름을 연결할 예정입니다.</p>
    </div>
  );
}
