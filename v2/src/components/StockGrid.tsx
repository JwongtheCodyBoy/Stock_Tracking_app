import type { StockSignalSnapshot } from "../types/conditions";
import type { TrackedStock } from "../types/stocks";
import { StockCard } from "./StockCard";

interface StockGridProps {
  stocks: TrackedStock[];
  snapshots: Record<string, StockSignalSnapshot>;
  onRemove: (stockId: string) => void;
}

export function StockGrid({ stocks, snapshots, onRemove }: StockGridProps) {
  if (stocks.length === 0) {
    return <div className="empty-state">No stocks in this profile yet.</div>;
  }

  return (
    <section className="stock-grid">
      {stocks.map((stock) => (
        <StockCard key={stock.id} stock={stock} snapshot={snapshots[stock.id]} onRemove={onRemove} />
      ))}
    </section>
  );
}
