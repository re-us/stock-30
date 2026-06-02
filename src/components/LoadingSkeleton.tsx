export function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-40 animate-pulse rounded-[24px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
          <div className="h-4 w-20 rounded bg-slate-100" />
          <div className="mt-5 h-5 w-2/3 rounded bg-slate-100" />
          <div className="mt-5 h-3 w-full rounded bg-slate-100" />
          <div className="mt-3 h-3 w-4/5 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
