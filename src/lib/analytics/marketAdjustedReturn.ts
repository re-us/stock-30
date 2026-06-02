export function calculateReturn(startPrice: number, endPrice: number): number | null {
  if (!Number.isFinite(startPrice) || !Number.isFinite(endPrice) || startPrice <= 0 || endPrice <= 0) return null;
  return ((endPrice - startPrice) / startPrice) * 100;
}

export function calculateExcessReturn({
  stockReturn,
  marketReturn,
}: {
  stockReturn: number | null;
  marketReturn: number | null;
}): number | null {
  if (stockReturn === null || !Number.isFinite(stockReturn)) return null;
  if (marketReturn === null || !Number.isFinite(marketReturn)) return stockReturn;
  return stockReturn - marketReturn;
}
