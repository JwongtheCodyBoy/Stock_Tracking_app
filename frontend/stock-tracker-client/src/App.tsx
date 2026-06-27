import { useCallback, useEffect, useState } from "react";
import type { AddStockRequest, TrackedStock } from "./types/stock";
import { addStock, getStocks, removeStock } from "./api/stocksApi";
import { useStockHub } from "./hooks/useStockHub";
import { AddStockForm } from "./components/AddStockForm";
import { StockList } from "./components/StockList";

export default function App() {
  const [stocks, setStocks] = useState<TrackedStock[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleStocksUpdated = useCallback((updatedStocks: TrackedStock[]) => {
    setStocks(updatedStocks);
  }, []);

  useStockHub(handleStocksUpdated);

  useEffect(() => {
    async function loadStocks() {
      try {
        const loadedStocks = await getStocks();
        setStocks(loadedStocks);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stocks.");
      } finally {
        setIsLoading(false);
      }
    }

    loadStocks();
  }, []);

  async function handleAddStock(request: AddStockRequest) {
    setError(null);

    try {
      const updatedStocks = await addStock(request);
      setStocks(updatedStocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add stock.");
    }
  }

  async function handleRemoveStock(symbol: string) {
    setError(null);

    try {
      const updatedStocks = await removeStock(symbol);
      setStocks(updatedStocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove stock.");
    }
  }

  return (
    <div className="min-vh-100 bg-body-tertiary">
      <nav className="navbar navbar-expand-lg bg-dark navbar-dark mb-4">
        <div className="container">
          <span className="navbar-brand fw-bold">Personal Stock Tracker</span>
        </div>
      </nav>

      <main className="container pb-5">
        <div className="mb-4">
          <h1 className="mb-1">Watchlist</h1>
          <p className="text-muted mb-0">
            Add a stock, set a target, and the card turns green when the condition is met.
          </p>
        </div>

        <AddStockForm onAddStock={handleAddStock} />

        {error && <div className="alert alert-danger">{error}</div>}

        {isLoading ? (
          <div className="alert alert-secondary">Loading stocks...</div>
        ) : (
          <StockList stocks={stocks} onRemove={handleRemoveStock} />
        )}
      </main>
    </div>
  );
}
