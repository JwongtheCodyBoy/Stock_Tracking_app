import type { TrackedStock } from "../types/stock";

interface StockCardProps {
  stock: TrackedStock;
  onRemove: (symbol: string) => Promise<void>;
}

export function StockCard({ stock, onRemove }: StockCardProps) {
  const isTargetMet = stock.status === "TargetMet";

  const cardClass = isTargetMet
    ? "card border-success bg-success-subtle shadow-sm h-100"
    : stock.status === "NoPrice"
      ? "card border-secondary bg-light shadow-sm h-100"
      : "card border-secondary shadow-sm h-100";

  const badgeClass = isTargetMet
    ? "badge text-bg-success"
    : stock.status === "NoPrice"
      ? "badge text-bg-secondary"
      : "badge text-bg-warning";

  const conditionLabel =
    stock.condition === "GreaterThanOrEqual"
      ? `>= $${stock.targetPrice.toFixed(2)}`
      : `<= $${stock.targetPrice.toFixed(2)}`;

  const currentPriceLabel =
    stock.currentPrice === null
      ? "Waiting for price..."
      : `$${stock.currentPrice.toFixed(2)}`;

  const lastUpdatedLabel = stock.lastUpdatedUtc
    ? new Date(stock.lastUpdatedUtc).toLocaleString()
    : "Not updated yet";

  const tickChange =
    stock.currentPrice !== null && stock.previousPrice !== null
      ? stock.currentPrice - stock.previousPrice
      : null;

  return (
    <div className={cardClass}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h4 className="card-title mb-0">{stock.symbol}</h4>
            <small className="text-muted">Target {conditionLabel}</small>
          </div>

          <span className={badgeClass}>{stock.status}</span>
        </div>

        <div className="display-6 mb-2">{currentPriceLabel}</div>

        <div className="mb-3">
          <div className="small text-muted">Last tick change</div>
          <div>
            {tickChange === null
              ? "N/A"
              : `${tickChange >= 0 ? "+" : ""}$${tickChange.toFixed(4)}`}
          </div>
        </div>

        <div className="small text-muted mb-3">
          Last updated: {lastUpdatedLabel}
        </div>

        <button
          className="btn btn-outline-danger btn-sm"
          onClick={() => onRemove(stock.symbol)}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
