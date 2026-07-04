import type { StockCondition } from "./conditions";

export interface TrackedStock {
  id: string;
  symbol: string;
  notes: string;
  conditions: StockCondition[];
  createdAtUtc: string;
}

export interface StockProfile {
  id: string;
  name: string;
  stocks: TrackedStock[];
  updatedAtUtc: string;
}

export interface ExportedStockProfiles {
  app: "stock-tracker-v2";
  version: 1;
  exportedAtUtc: string;
  profiles: StockProfile[];
}
