import { useEffect } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../api/stocksApi";
import type { TrackedStock } from "../types/stock";

export function useStockHub(onStocksUpdated: (stocks: TrackedStock[]) => void) {
  useEffect(() => {
    const socket = io(API_BASE_URL, {
      transports: ["websocket"]
    });

    socket.on("stocksUpdated", (stocks: TrackedStock[]) => {
      onStocksUpdated(stocks);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection failed:", error);
    });

    return () => {
      socket.disconnect();
    };
  }, [onStocksUpdated]);
}
