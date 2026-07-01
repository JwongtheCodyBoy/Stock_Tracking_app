import { EventEmitter } from "node:events";
import type { AddStockRequest, AppState, ConditionType, StockStatus, TrackedStock } from "./types.js";
import { JsonStateStore } from "./stateStore.js";
import { SymbolValidator } from "./symbolValidator.js";

export interface StockQuote {
  price: number;
  previousClose: number | null;
  timestampMs: number;
}

interface StockManagerEvents {
  stocksUpdated: [TrackedStock[]];
}

export declare interface StockManager {
  on<EventName extends keyof StockManagerEvents>(
    eventName: EventName,
    listener: (...args: StockManagerEvents[EventName]) => void
  ): this;

  emit<EventName extends keyof StockManagerEvents>(
    eventName: EventName,
    ...args: StockManagerEvents[EventName]
  ): boolean;
}

export class StockManager extends EventEmitter {
  private state: AppState = {
    settings: {
      darkMode: false
    },
    stocks: []
  };

  private lastCheckpointUtc = 0;
  private readonly lastBroadcastBySymbol = new Map<string, number>();

  constructor(
    private readonly store: JsonStateStore,
    private readonly symbolValidator: SymbolValidator
  ) {
    super();
  }

  async initialize(): Promise<void> {
    this.state = await this.store.load();
    this.normalizeState();
  }

  getStocks(): TrackedStock[] {
    return copyStocks(this.state.stocks);
  }

  getSymbols(): string[] {
    return [...new Set(this.state.stocks.map((stock) => stock.symbol))];
  }

  async addStock(request: AddStockRequest, initialQuote?: StockQuote): Promise<TrackedStock[]> {
    const symbol = normalizeSymbol(request.symbol);

    if (!symbol) {
      throw new Error("Stock symbol is required.");
    }

    if (!Number.isFinite(request.targetPrice) || request.targetPrice <= 0) {
      throw new Error("Target price must be greater than 0.");
    }

    if (!isConditionType(request.condition)) {
      throw new Error("Condition is invalid.");
    }

    const alreadyExists = this.state.stocks.some(
      (stock) => stock.symbol.toUpperCase() === symbol
    );

    if (alreadyExists) {
      throw new Error(`${symbol} is already being tracked.`);
    }

    await this.symbolValidator.validate(symbol);

    const stock: TrackedStock = {
      symbol,
      targetPrice: request.targetPrice,
      condition: request.condition,
      currentPrice: null,
      previousPrice: null,
      status: "NoPrice",
      addedAtUtc: new Date().toISOString(),
      lastUpdatedUtc: null
    };

    if (initialQuote) {
      stock.currentPrice = initialQuote.price;
      stock.previousPrice = initialQuote.previousClose;
      stock.lastUpdatedUtc = new Date(initialQuote.timestampMs).toISOString();
      stock.status = evaluateStatus(stock);
    }

    this.state.stocks.push(stock);

    await this.saveAndBroadcast();
    return this.getStocks();
  }

  async updateFromQuote(symbol: string, quote: StockQuote): Promise<void> {
    const normalizedSymbol = normalizeSymbol(symbol);
    const stock = this.state.stocks.find(
      (trackedStock) => trackedStock.symbol.toUpperCase() === normalizedSymbol
    );

    if (!stock) {
      return;
    }

    stock.previousPrice = stock.currentPrice ?? quote.previousClose;
    stock.currentPrice = quote.price;
    stock.lastUpdatedUtc = new Date(quote.timestampMs).toISOString();
    stock.status = evaluateStatus(stock);

    await this.saveAndBroadcast();
  }

  async removeStock(symbol: string): Promise<TrackedStock[]> {
    const normalizedSymbol = normalizeSymbol(symbol);
    this.state.stocks = this.state.stocks.filter(
      (stock) => stock.symbol.toUpperCase() !== normalizedSymbol
    );

    await this.saveAndBroadcast();
    return this.getStocks();
  }

  async updateFromTrade(symbol: string, price: number, timestampMs: number): Promise<void> {
    const normalizedSymbol = normalizeSymbol(symbol);
    const stock = this.state.stocks.find(
      (trackedStock) => trackedStock.symbol.toUpperCase() === normalizedSymbol
    );

    if (!stock) {
      return;
    }

    const oldStatus = stock.status;
    stock.previousPrice = stock.currentPrice;
    stock.currentPrice = price;
    stock.lastUpdatedUtc = new Date(timestampMs).toISOString();
    stock.status = evaluateStatus(stock);

    const now = Date.now();
    const statusChanged = oldStatus !== stock.status;
    const shouldCheckpoint = now - this.lastCheckpointUtc > 60_000;

    if (statusChanged || shouldCheckpoint) {
      this.lastCheckpointUtc = now;
      await this.store.save(this.state);
    }

    const lastBroadcast = this.lastBroadcastBySymbol.get(stock.symbol) ?? 0;

    if (statusChanged || now - lastBroadcast > 1_000) {
      this.lastBroadcastBySymbol.set(stock.symbol, now);
      this.emit("stocksUpdated", this.getStocks());
    }
  }

  private async saveAndBroadcast(): Promise<void> {
    await this.store.save(this.state);
    this.emit("stocksUpdated", this.getStocks());
  }

  private normalizeState(): void {
    this.state.settings ??= { darkMode: false };
    this.state.stocks ??= [];

    for (const stock of this.state.stocks) {
      stock.symbol = normalizeSymbol(stock.symbol);
      stock.currentPrice ??= null;
      stock.previousPrice ??= null;
      stock.lastUpdatedUtc ??= null;
      stock.addedAtUtc ||= new Date().toISOString();
      stock.status = evaluateStatus(stock);
    }
  }
}

function evaluateStatus(stock: TrackedStock): StockStatus {
  if (stock.currentPrice === null) {
    return "NoPrice";
  }

  if (stock.condition === "GreaterThanOrEqual") {
    return stock.currentPrice >= stock.targetPrice ? "TargetMet" : "Waiting";
  }

  return stock.currentPrice <= stock.targetPrice ? "TargetMet" : "Waiting";
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().split(/\s+/)[0]?.toUpperCase() ?? "";
}

function isConditionType(value: unknown): value is ConditionType {
  return value === "GreaterThanOrEqual" || value === "LessThanOrEqual";
}

function copyStocks(stocks: TrackedStock[]): TrackedStock[] {
  return stocks.map((stock) => ({ ...stock }));
}
