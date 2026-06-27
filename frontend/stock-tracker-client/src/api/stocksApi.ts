import type { AddStockRequest, TrackedStock } from "../types/stock";

export const API_BASE_URL = "http://localhost:5050";

export async function getStocks(): Promise<TrackedStock[]> {
  const response = await fetch(`${API_BASE_URL}/api/stocks`);

  if (!response.ok) {
    throw new Error("Failed to load stocks.");
  }

  return response.json();
}

export async function addStock(request: AddStockRequest): Promise<TrackedStock[]> {
  const response = await fetch(`${API_BASE_URL}/api/stocks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error ?? "Failed to add stock.");
  }

  return response.json();
}

export async function removeStock(symbol: string): Promise<TrackedStock[]> {
  const response = await fetch(`${API_BASE_URL}/api/stocks/${encodeURIComponent(symbol)}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Failed to remove stock.");
  }

  return response.json();
}
