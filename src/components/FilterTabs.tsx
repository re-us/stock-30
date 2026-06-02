import type { FilterKey } from "@/types/stock";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "us", label: "미국" },
  { key: "kr", label: "한국" },
  { key: "rising", label: "급상승" },
  { key: "positive", label: "긍정 반응" },
  { key: "negative", label: "부정 급증" },
];

type FilterTabsProps = {
  active: FilterKey;
  onChange: (filter: FilterKey) => void;
};

export function FilterTabs({ active, onChange }: FilterTabsProps) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
      {filters.map((filter) => (
        <button
          key={filter.key}
          type="button"
          onClick={() => onChange(filter.key)}
          className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-black transition ${
            active === filter.key ? "bg-slate-900 text-white" : "bg-white text-slate-600 shadow-[0_4px_16px_rgba(15,23,42,0.035)]"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
