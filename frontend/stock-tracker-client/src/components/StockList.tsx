import type { TrackedStock } from "../types/stock";
import { StockCard } from "./StockCard";

interface StockListProps {
  stocks: TrackedStock[];
  onRemove: (symbol: string) => Promise<void>;
}

export function StockList({ stocks, onRemove }: StockListProps) {
  if (stocks.length === 0) {
    return (
      <div className="alert alert-info">
        No stocks are being tracked yet. Add a ticker above.
      </div>
    );
  }

  return (
    <div className="row g-3">
      {stocks.map((stock) => (
        <div className="col-12 col-md-6 col-xl-4" key={stock.symbol}>
          <StockCard stock={stock} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
