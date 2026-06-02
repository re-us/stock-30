import type { StockItem } from "@/types/stock";

// mentionScore는 현재 더미 데이터의 0~100 점수입니다.
// 추후 API 연동 시 community score, news score, search trend score,
// momentum score, sentiment score를 정규화해 가중 합산할 예정입니다.
export const getMentionScore = (stock: StockItem): number => stock.mentionScore;
