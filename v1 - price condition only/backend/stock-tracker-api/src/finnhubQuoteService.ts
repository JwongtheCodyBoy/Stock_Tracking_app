import { StockManager } from "./stockManager.js";

interface FinnhubQuoteResponse {
  c?: number;
  pc?: number;
  t?: number;
}

export class FinnhubQuoteService {
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly apiKey: string | undefined,
    private readonly stockManager: StockManager
  ) {}

  async refreshSymbol(symbol: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error("Finnhub API key is required before fetching prices.");
    }

    const quote = await this.getQuote(symbol);
    await this.stockManager.updateFromQuote(symbol, quote);
  }

  async refreshAllSymbols(): Promise<void> {
    if (!this.apiKey) {
      return;
    }

    for (const symbol of this.stockManager.getSymbols()) {
      try {
        await this.refreshSymbol(symbol);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.warn(`Could not refresh quote for ${symbol}: ${message}`);
      }
    }
  }

  startPeriodicRefresh(intervalMs = 5 * 60 * 1_000): void {
    void this.refreshAllSymbols();
    this.refreshTimer = setInterval(() => {
      void this.refreshAllSymbols();
    }, intervalMs);
  }

  stop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  async getQuote(symbol: string): Promise<{ price: number; previousClose: number | null; timestampMs: number }> {
    if (!this.apiKey) {
      throw new Error("Finnhub API key is required before fetching prices.");
    }

    const url = new URL("https://finnhub.io/api/v1/quote");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("token", this.apiKey);

    let response: Response;

    try {
      response = await fetch(url);
    } catch {
      throw new Error("Could not fetch quote right now.");
    }

    if (!response.ok) {
      throw new Error("Could not fetch quote right now.");
    }

    const body = (await response.json()) as FinnhubQuoteResponse;
    const currentPrice = isPositiveNumber(body.c) ? body.c : null;
    const previousClose = isPositiveNumber(body.pc) ? body.pc : null;
    const price = currentPrice ?? previousClose;

    if (price === null) {
      throw new Error("Finnhub did not return a usable quote.");
    }

    return {
      price,
      previousClose,
      timestampMs: isPositiveNumber(body.t) ? body.t * 1_000 : Date.now()
    };
  }
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
