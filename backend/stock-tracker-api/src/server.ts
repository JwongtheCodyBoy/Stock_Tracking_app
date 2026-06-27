import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { FinnhubWebSocketService } from "./finnhubWebSocketService.js";
import { JsonStateStore } from "./stateStore.js";
import { StockManager } from "./stockManager.js";
import { SymbolValidator } from "./symbolValidator.js";
import type { AddStockRequest } from "./types.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const port = Number(process.env.PORT ?? 5050);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
const stateFilePath = path.resolve(
  projectRoot,
  process.env.STATE_FILE_PATH ?? "State/appstate.json"
);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: frontendOrigin,
    methods: ["GET", "POST", "DELETE"]
  }
});

app.use(cors({ origin: frontendOrigin }));
app.use(express.json());

const stateStore = new JsonStateStore(stateFilePath);
const symbolValidator = new SymbolValidator(process.env.FINNHUB_API_KEY);
const stockManager = new StockManager(stateStore, symbolValidator);
await stockManager.initialize();

stockManager.on("stocksUpdated", (stocks) => {
  io.emit("stocksUpdated", stocks);
});

io.on("connection", (socket) => {
  socket.emit("stocksUpdated", stockManager.getStocks());
});

app.get("/api/stocks", (_request, response) => {
  response.json(stockManager.getStocks());
});

app.post("/api/stocks", async (request, response) => {
  try {
    const stocks = await stockManager.addStock(request.body as AddStockRequest);
    response.json(stocks);
  } catch (error) {
    response.status(400).json({
      error: error instanceof Error ? error.message : "Failed to add stock."
    });
  }
});

app.delete("/api/stocks/:symbol", async (request, response) => {
  const stocks = await stockManager.removeStock(request.params.symbol);
  response.json(stocks);
});

const finnhubService = new FinnhubWebSocketService(
  process.env.FINNHUB_API_KEY,
  stockManager
);

httpServer.listen(port, () => {
  console.log(`Stock tracker API listening on http://localhost:${port}`);
  finnhubService.start();
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown(): void {
  finnhubService.stop();
  httpServer.close(() => {
    process.exit(0);
  });
}
