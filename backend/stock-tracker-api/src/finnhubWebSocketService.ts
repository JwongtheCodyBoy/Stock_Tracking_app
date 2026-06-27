import WebSocket from "ws";
import type { FinnhubMessage } from "./types.js";
import { StockManager } from "./stockManager.js";

export class FinnhubWebSocketService {
  private socket: WebSocket | null = null;
  private subscribedSymbols = new Set<string>();
  private subscriptionTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isStopped = false;

  constructor(
    private readonly apiKey: string | undefined,
    private readonly stockManager: StockManager
  ) {}

  start(): void {
    if (!this.apiKey) {
      console.warn("Finnhub API key is missing. Set FINNHUB_API_KEY in backend/stock-tracker-api/.env.");
      return;
    }

    this.connect();
  }

  stop(): void {
    this.isStopped = true;

    if (this.subscriptionTimer) {
      clearInterval(this.subscriptionTimer);
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.socket?.close();
  }

  private connect(): void {
    if (!this.apiKey || this.isStopped) {
      return;
    }

    console.info("Connecting to Finnhub WebSocket...");

    this.socket = new WebSocket(`wss://ws.finnhub.io?token=${this.apiKey}`);

    this.socket.on("open", () => {
      console.info("Connected to Finnhub WebSocket.");
      this.subscribedSymbols = new Set<string>();
      this.syncSubscriptions();
      this.subscriptionTimer = setInterval(() => this.syncSubscriptions(), 5_000);
    });

    this.socket.on("message", (data) => {
      void this.handleMessage(data.toString());
    });

    this.socket.on("close", () => this.scheduleReconnect());
    this.socket.on("error", (error) => {
      console.error("Finnhub WebSocket error:", error.message);
    });
  }

  private scheduleReconnect(): void {
    if (this.isStopped) {
      return;
    }

    if (this.subscriptionTimer) {
      clearInterval(this.subscriptionTimer);
      this.subscriptionTimer = null;
    }

    this.socket = null;

    console.warn("Finnhub WebSocket disconnected. Reconnecting in 5 seconds...");
    this.reconnectTimer = setTimeout(() => this.connect(), 5_000);
  }

  private syncSubscriptions(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const wantedSymbols = new Set(this.stockManager.getSymbols());

    for (const symbol of wantedSymbols) {
      if (!this.subscribedSymbols.has(symbol)) {
        this.send({
          type: "subscribe",
          symbol
        });

        this.subscribedSymbols.add(symbol);
        console.info(`Subscribed to ${symbol}`);
      }
    }

    for (const symbol of [...this.subscribedSymbols]) {
      if (!wantedSymbols.has(symbol)) {
        this.send({
          type: "unsubscribe",
          symbol
        });

        this.subscribedSymbols.delete(symbol);
        console.info(`Unsubscribed from ${symbol}`);
      }
    }
  }

  private async handleMessage(message: string): Promise<void> {
    let parsedMessage: FinnhubMessage;

    try {
      parsedMessage = JSON.parse(message) as FinnhubMessage;
    } catch {
      console.warn("Could not parse Finnhub message:", message);
      return;
    }

    if (parsedMessage.type !== "trade" || !parsedMessage.data) {
      return;
    }

    for (const trade of parsedMessage.data) {
      if (!trade.s) {
        continue;
      }

      await this.stockManager.updateFromTrade(trade.s, trade.p, trade.t);
    }
  }

  private send(message: object): void {
    this.socket?.send(JSON.stringify(message));
  }
}
