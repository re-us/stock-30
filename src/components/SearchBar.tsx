type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <label className="block">
      <span className="sr-only">종목명 또는 티커 검색</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="종목명 또는 티커 검색"
        className="min-h-11 w-full rounded-full border-0 bg-white px-5 text-[15px] font-bold text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}
