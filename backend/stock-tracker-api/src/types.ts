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

export interface AppSettings {
  darkMode: boolean;
}

export interface AppState {
  settings: AppSettings;
  stocks: TrackedStock[];
}

export interface AddStockRequest {
  symbol: string;
  targetPrice: number;
  condition: ConditionType;
}

export interface FinnhubTrade {
  s: string;
  p: number;
  t: number;
  v: number;
}

export interface FinnhubMessage {
  type: string;
  data?: FinnhubTrade[];
}
