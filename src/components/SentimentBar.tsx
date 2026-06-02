import type { StockItem } from "@/types/stock";

type SentimentBarProps = {
  sentiment: StockItem["sentiment"];
  compact?: boolean;
};

export function SentimentBar({ sentiment, compact = false }: SentimentBarProps) {
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
        <span className="bg-emerald-400" style={{ width: `${sentiment.positive}%` }} />
        <span className="bg-slate-300" style={{ width: `${sentiment.neutral}%` }} />
        <span className="bg-rose-300" style={{ width: `${sentiment.negative}%` }} />
      </div>
      {!compact && (
        <p className="mt-2 text-xs font-bold text-slate-500">
          긍정 {sentiment.positive}% · 중립 {sentiment.neutral}% · 부정 {sentiment.negative}%
        </p>
      )}
    </div>
  );
}
