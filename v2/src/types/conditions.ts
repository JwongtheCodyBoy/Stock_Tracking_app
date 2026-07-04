export type ConditionType =
  | "priceBelowTarget"
  | "priceAboveTarget"
  | "rsiAbove70"
  | "rsiBelow30"
  | "priceCrossesAboveEma"
  | "priceCrossesBelowEma";

export interface PriceTargetParams {
  targetPrice: number;
}

export interface RsiParams {
  period: number;
}

export interface EmaCrossParams {
  period: number;
}

export type ConditionParams = PriceTargetParams | RsiParams | EmaCrossParams;

export interface StockCondition {
  id: string;
  type: ConditionType;
  params: ConditionParams;
}

export interface ConditionResult {
  conditionId: string;
  type: ConditionType;
  label: string;
  isMet: boolean;
  detail: string;
}

export interface ConditionDefinition<TParams extends ConditionParams = ConditionParams> {
  type: ConditionType;
  name: string;
  shortName: string;
  defaultParams: TParams;
  makeLabel: (params: TParams) => string;
  evaluate: (params: TParams, snapshot: StockSignalSnapshot) => ConditionResultDetails;
}

export interface ConditionResultDetails {
  isMet: boolean;
  detail: string;
}

export interface StockSignalSnapshot {
  symbol: string;
  currentPrice: number | null;
  previousClose: number | null;
  closes: number[];
  rsiByPeriod: Record<number, number | null>;
  emaByPeriod: Record<number, number[]>;
  lastUpdatedUtc: string | null;
  error: string | null;
}
