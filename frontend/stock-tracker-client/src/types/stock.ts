export type ConditionType = "GreaterThanOrEqual" | "LessThanOrEqual";

export type StockStatus = "NoPrice" | "Waiting" | "TargetMet";

export interface TrackedStock {
  symbol: string;
  targetPrice: number;
  condition: ConditionType;
  currentPrice: number | null;
  previousPrice: number | null;
  status: StockStatus;
  addedAtUtc: string;
  lastUpdatedUtc: string | null;
}

export interface AddStockRequest {
  symbol: string;
  targetPrice: number;
  condition: ConditionType;
}
