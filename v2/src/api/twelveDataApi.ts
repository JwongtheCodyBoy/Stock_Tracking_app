import type { StockSignalSnapshot } from "../types/conditions";
import type { TrackedStock } from "../types/stocks";
import { conditionDefinitions } from "../conditions/conditionDefinitions";
import { calculateEma, calculateRsi } from "../conditions/indicators";

interface TwelveDataTimeSeriesValue {
  datetime: string;
  close: string;
}

interface TwelveDataTimeSeriesResponse {
  values?: TwelveDataTimeSeriesValue[];
  status?: string;
  message?: string;
  code?: number;
}

export interface RefreshOptions {
  apiKey: string;
  outputSize: number;
  interval: "1day" | "1h" | "15min" | "5min" | "1min";
}

export async function fetchStockSnapshot(stock: TrackedStock, options: RefreshOptions): Promise<StockSignalSnapshot> {
  const symbol = stock.symbol.trim().toUpperCase();
  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", options.interval);
  url.searchParams.set("outputsize", String(options.outputSize));
  url.searchParams.set("apikey", options.apiKey);

  try {
    const response = await fetch(url);
    const data = (await response.json()) as TwelveDataTimeSeriesResponse;

    if (!response.ok || data.status === "error") {
      throw new Error(data.message || `Twelve Data request failed for ${symbol}.`);
    }

    const closes =
      data.values
        ?.slice()
        .reverse()
        .map((value) => Number(value.close))
        .filter((value) => Number.isFinite(value)) ?? [];

    if (closes.length === 0) {
      throw new Error(`No close prices returned for ${symbol}.`);
    }

    return buildSnapshot(symbol, closes, stock);
  } catch (error) {
    return {
      symbol,
      currentPrice: null,
      previousClose: null,
      closes: [],
      rsiByPeriod: {},
      emaByPeriod: {},
      lastUpdatedUtc: new Date().toISOString(),
      error: error instanceof Error ? error.message : `Failed to refresh ${symbol}.`
    };
  }
}

export async function refreshStockSnapshots(stocks: TrackedStock[], options: RefreshOptions) {
  const limitedStocks = stocks.slice(0, 8);
  const snapshots: Record<string, StockSignalSnapshot> = {};

  for (const stock of limitedStocks) {
    snapshots[stock.id] = await fetchStockSnapshot(stock, options);
  }

  return snapshots;
}

function buildSnapshot(symbol: string, closes: number[], stock: TrackedStock): StockSignalSnapshot {
  const periods = collectRequestedPeriods(stock);
  const rsiByPeriod: Record<number, number | null> = {};
  const emaByPeriod: Record<number, number[]> = {};

  periods.rsi.forEach((period) => {
    rsiByPeriod[period] = calculateRsi(closes, period);
  });

  periods.ema.forEach((period) => {
    emaByPeriod[period] = calculateEma(closes, period);
  });

  return {
    symbol,
    currentPrice: closes[closes.length - 1] ?? null,
    previousClose: closes[closes.length - 2] ?? null,
    closes,
    rsiByPeriod,
    emaByPeriod,
    lastUpdatedUtc: new Date().toISOString(),
    error: null
  };
}

function collectRequestedPeriods(stock: TrackedStock) {
  const rsi = new Set<number>();
  const ema = new Set<number>();

  stock.conditions.forEach((condition) => {
    const definition = conditionDefinitions[condition.type];
    const params = condition.params;
    if (definition.type === "rsiAbove70" || definition.type === "rsiBelow30") {
      rsi.add("period" in params ? params.period : 14);
    }

    if (definition.type === "priceCrossesAboveEma" || definition.type === "priceCrossesBelowEma") {
      ema.add("period" in params ? params.period : 20);
    }
  });

  return { rsi: Array.from(rsi), ema: Array.from(ema) };
}
