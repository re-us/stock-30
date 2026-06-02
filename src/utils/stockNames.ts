import type { StockItem } from "@/types/stock";

const STOCK_DISPLAY_NAMES: Record<string, string> = {
  NVDA: "엔비디아",
  TSLA: "테슬라",
  AAPL: "애플",
  MSFT: "마이크로소프트",
  AMD: "AMD",
  META: "메타 플랫폼스",
  AMZN: "아마존닷컴",
  PLTR: "팔란티어 테크놀로지스",
  GOOGL: "알파벳 A",
  AVGO: "브로드컴",
  NFLX: "넷플릭스",
  ORCL: "오라클",
  INTC: "인텔",
  COIN: "코인베이스 글로벌",
  MSTR: "마이크로스트래티지",
  "005930": "삼성전자",
  "000660": "SK하이닉스",
  "005380": "현대차",
  "000270": "기아",
  "035420": "네이버",
  "035720": "카카오",
  "373220": "LG에너지솔루션",
  "068270": "셀트리온",
  "005490": "포스코홀딩스",
  "012450": "한화에어로스페이스",
  "207940": "삼성바이오로직스",
  "006400": "삼성SDI",
  "047810": "한국항공우주",
  "105560": "KB금융",
  "055550": "신한지주",
};

export function getStockDisplayName(stock: Pick<StockItem, "symbol" | "name">): string {
  return STOCK_DISPLAY_NAMES[stock.symbol] ?? stock.name;
}
