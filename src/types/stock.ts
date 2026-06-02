export type Market = "US" | "KR";

export type Sentiment = {
  positive: number;
  neutral: number;
  negative: number;
};

export type SourceStatusValue = "live" | "failed" | "disabled" | "mock";

export type SourceStatus = {
  gdelt: SourceStatusValue;
  googleNews: SourceStatusValue;
  yahooFinance: SourceStatusValue;
  hackerNews: SourceStatusValue;
  naverDataLab: SourceStatusValue;
  alphaVantage: SourceStatusValue;
  stocktwits: SourceStatusValue;
};

export type AttentionPriceCorrelation = {
  mentionPriceCorrelation: number | null;
  lastWeekMentionChangeRate: number | null;
  lastWeekPriceChangeRate: number | null;
  attentionPriceScore: number;
  confidence: "low" | "medium" | "high";
  label: string;
};

export type SignalHorizon = "6H" | "24H" | "3D" | "5D";

export type SignalConfidence = "low" | "medium" | "high";

export type HorizonSignal = {
  horizon: SignalHorizon;
  mentionChangeRate: number | null;
  mentionZScore: number | null;
  priceReturn: number | null;
  excessReturn: number | null;
  pearsonCorrelation: number | null;
  spearmanCorrelation: number | null;
  hitRate: number | null;
  sampleSize: number;
  confidence: SignalConfidence;
};

export type QuantSignal = {
  score: number;
  primaryHorizon: SignalHorizon;
  confidence: SignalConfidence;
  label: string;
  horizons: HorizonSignal[];
};

export type ProbabilityGrade = "conservative" | "neutral" | "positive" | "strong";

export type DataQuality = "limited" | "normal" | "rich";

export type WeeklyUpsideProbability = {
  probability: number;
  grade: ProbabilityGrade;
  dataQuality: DataQuality;
  label: string;
  summary: string;
  factors: {
    name: string;
    score: number;
    description: string;
  }[];
};

export type StockItem = {
  id: string;
  rank: number;
  previousRank: number | null;
  symbol: string;
  name: string;
  market: Market;
  sector: string;
  mentionScore: number;
  mentionChangeRate: number;
  communityMentions: number;
  newsCount: number;
  searchScore: number;
  sentiment: Sentiment;
  trend7d: number[];
  keywords: string[];
  reason: string;
  relatedSymbols: string[];
  headlines: string[];
  correlation?: AttentionPriceCorrelation;
  quantSignal?: QuantSignal;
  weeklyUpsideProbability?: WeeklyUpsideProbability;
};

export type RankingsResponse = {
  updatedAt: string;
  nextUpdateAt?: string;
  updateIntervalHours: 6;
  sourceStatus: SourceStatus;
  stocks: StockItem[];
};

export type FilterKey = "all" | "us" | "kr" | "rising" | "positive" | "negative";
