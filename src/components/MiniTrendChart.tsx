type MiniTrendChartProps = {
  values: number[];
  tall?: boolean;
};

export function MiniTrendChart({ values, tall = false }: MiniTrendChartProps) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);

  return (
    <div className={`flex items-end gap-1 ${tall ? "h-24" : "h-10"}`} aria-label="7일 언급량 추이">
      {values.map((value, index) => {
        const height = 24 + ((value - min) / range) * 76;
        return (
          <span
            key={`${value}-${index}`}
            className="w-full rounded-t-md bg-blue-400/70"
            style={{ height: `${height}%` }}
            title={`${index + 1}일차 ${value}`}
          />
        );
      })}
    </div>
  );
}
