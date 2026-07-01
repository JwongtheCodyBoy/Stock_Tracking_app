interface FinnhubSymbolSearchResponse {
  result?: Array<{
    symbol?: string;
    displaySymbol?: string;
    type?: string;
  }>;
}

export class SymbolValidator {
  constructor(private readonly apiKey: string | undefined) {}

  async validate(symbol: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error("Finnhub API key is required before adding stocks.");
    }

    const url = new URL("https://finnhub.io/api/v1/search");
    url.searchParams.set("q", symbol);
    url.searchParams.set("token", this.apiKey);

    let response: Response;

    try {
      response = await fetch(url);
    } catch {
      throw new Error("Could not validate stock symbol right now.");
    }

    if (!response.ok) {
      throw new Error("Could not validate stock symbol right now.");
    }

    const body = (await response.json()) as FinnhubSymbolSearchResponse;
    const normalizedSymbol = symbol.toUpperCase();
    const hasExactMatch = body.result?.some((item) => {
      const itemSymbol = item.symbol?.toUpperCase();
      const displaySymbol = item.displaySymbol?.toUpperCase();

      return itemSymbol === normalizedSymbol || displaySymbol === normalizedSymbol;
    });

    if (!hasExactMatch) {
      throw new Error(`${symbol} was not found by Finnhub.`);
    }
  }
}
