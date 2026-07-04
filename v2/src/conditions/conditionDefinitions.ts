import type {
  ConditionDefinition,
  ConditionParams,
  ConditionResult,
  ConditionType,
  EmaCrossParams,
  PriceTargetParams,
  RsiParams,
  StockCondition,
  StockSignalSnapshot
} from "../types/conditions";
import { formatCurrency, formatNumber } from "../utils/format";

function currentAndPrevious(values: number[]) {
  if (values.length < 2) {
    return { current: null, previous: null };
  }

  return {
    current: values[values.length - 1],
    previous: values[values.length - 2]
  };
}

export const conditionDefinitions: Record<ConditionType, ConditionDefinition> = {
  priceBelowTarget: {
    type: "priceBelowTarget",
    name: "Price <=",
    shortName: "Below target",
    defaultParams: { targetPrice: 100 },
    makeLabel: (params) => `Price below ${formatCurrency((params as PriceTargetParams).targetPrice)}`,
    evaluate: (params, snapshot) => {
      const targetPrice = (params as PriceTargetParams).targetPrice;
      const currentPrice = snapshot.currentPrice;

      return {
        isMet: currentPrice !== null && currentPrice < targetPrice,
        detail: `Current ${formatCurrency(currentPrice)} vs target ${formatCurrency(targetPrice)}`
      };
    }
  },
  priceAboveTarget: {
    type: "priceAboveTarget",
    name: "Price >=",
    shortName: "Above target",
    defaultParams: { targetPrice: 100 },
    makeLabel: (params) => `Price above ${formatCurrency((params as PriceTargetParams).targetPrice)}`,
    evaluate: (params, snapshot) => {
      const targetPrice = (params as PriceTargetParams).targetPrice;
      const currentPrice = snapshot.currentPrice;

      return {
        isMet: currentPrice !== null && currentPrice > targetPrice,
        detail: `Current ${formatCurrency(currentPrice)} vs target ${formatCurrency(targetPrice)}`
      };
    }
  },
  rsiAbove70: {
    type: "rsiAbove70",
    name: "RSI above 70, overbought",
    shortName: "RSI > 70",
    defaultParams: { period: 14 },
    makeLabel: (params) => `RSI(${(params as RsiParams).period}) above 70`,
    evaluate: (params, snapshot) => {
      const period = (params as RsiParams).period;
      const rsi = snapshot.rsiByPeriod[period] ?? null;

      return {
        isMet: rsi !== null && rsi > 70,
        detail: `RSI(${period}) is ${formatNumber(rsi)}`
      };
    }
  },
  rsiBelow30: {
    type: "rsiBelow30",
    name: "RSI below 30, oversold",
    shortName: "RSI < 30",
    defaultParams: { period: 14 },
    makeLabel: (params) => `RSI(${(params as RsiParams).period}) below 30`,
    evaluate: (params, snapshot) => {
      const period = (params as RsiParams).period;
      const rsi = snapshot.rsiByPeriod[period] ?? null;

      return {
        isMet: rsi !== null && rsi < 30,
        detail: `RSI(${period}) is ${formatNumber(rsi)}`
      };
    }
  },
  priceCrossesAboveEma: {
    type: "priceCrossesAboveEma",
    name: "Price crosses above an EMA",
    shortName: "Cross above EMA",
    defaultParams: { period: 20 },
    makeLabel: (params) => `Price crosses above EMA(${(params as EmaCrossParams).period})`,
    evaluate: (params, snapshot) => {
      const period = (params as EmaCrossParams).period;
      const emaValues = snapshot.emaByPeriod[period] ?? [];
      const price = currentAndPrevious(snapshot.closes);
      const ema = currentAndPrevious(emaValues);
      const hasCross =
        price.previous !== null &&
        price.current !== null &&
        ema.previous !== null &&
        ema.current !== null &&
        price.previous <= ema.previous &&
        price.current > ema.current;

      return {
        isMet: hasCross,
        detail: `Close ${formatCurrency(price.current)} vs EMA(${period}) ${formatCurrency(ema.current)}`
      };
    }
  },
  priceCrossesBelowEma: {
    type: "priceCrossesBelowEma",
    name: "Price crosses below an EMA",
    shortName: "Cross below EMA",
    defaultParams: { period: 20 },
    makeLabel: (params) => `Price crosses below EMA(${(params as EmaCrossParams).period})`,
    evaluate: (params, snapshot) => {
      const period = (params as EmaCrossParams).period;
      const emaValues = snapshot.emaByPeriod[period] ?? [];
      const price = currentAndPrevious(snapshot.closes);
      const ema = currentAndPrevious(emaValues);
      const hasCross =
        price.previous !== null &&
        price.current !== null &&
        ema.previous !== null &&
        ema.current !== null &&
        price.previous >= ema.previous &&
        price.current < ema.current;

      return {
        isMet: hasCross,
        detail: `Close ${formatCurrency(price.current)} vs EMA(${period}) ${formatCurrency(ema.current)}`
      };
    }
  }
};

export const conditionOptions = Object.values(conditionDefinitions);

export function createDefaultCondition(type: ConditionType): StockCondition {
  const definition = conditionDefinitions[type];

  return {
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    type,
    params: { ...definition.defaultParams } as ConditionParams
  };
}

export function evaluateCondition(condition: StockCondition, snapshot: StockSignalSnapshot): ConditionResult {
  const definition = conditionDefinitions[condition.type];
  const result = definition.evaluate(condition.params, snapshot);

  return {
    conditionId: condition.id,
    type: condition.type,
    label: definition.makeLabel(condition.params),
    isMet: result.isMet,
    detail: result.detail
  };
}
