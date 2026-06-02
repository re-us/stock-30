import type { Market } from "@/types/stock";

export function sanitizeSymbol(symbol: string): string | null {
  const normalized = symbol.trim().toUpperCase();
  if (!/^[A-Z0-9.-]{1,16}$/.test(normalized)) return null;
  return normalized;
}

export function sanitizeSearchQuery(query: string): string {
  return query.replace(/[<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function sanitizeText(value: string, maxLength = 140): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function isValidMarket(market: unknown): market is Market {
  return market === "US" || market === "KR";
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
