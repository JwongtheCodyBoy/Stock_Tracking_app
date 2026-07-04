import type { ConditionResult, StockSignalSnapshot } from "../types/conditions";
import type { TrackedStock } from "../types/stocks";
import { evaluateCondition } from "../conditions/conditionDefinitions";
import { formatCurrency } from "../utils/format";

interface StockCardProps {
  stock: TrackedStock;
  snapshot: StockSignalSnapshot | undefined;
  onRemove: (stockId: string) => void;
}

export function StockCard({ stock, snapshot, onRemove }: StockCardProps) {
  const fallbackSnapshot: StockSignalSnapshot = snapshot ?? {
    symbol: stock.symbol,
    currentPrice: null,
    previousClose: null,
    closes: [],
    rsiByPeriod: {},
    emaByPeriod: {},
    lastUpdatedUtc: null,
    error: null
  };
  const results = stock.conditions.map((condition) => evaluateCondition(condition, fallbackSnapshot));
  const metCount = results.filter((result) => result.isMet).length;
  const allMet = results.length > 0 && metCount === results.length;

  return (
    <article className={`stock-card ${allMet ? "stock-card-met" : ""}`}>
      <div className="stock-card-header">
        <div>
          <h3>{stock.symbol}</h3>
          {stock.notes && <p>{stock.notes}</p>}
        </div>
        <div className="condition-summary" tabIndex={0} aria-label={`${metCount} of ${results.length} conditions met`}>
          <span>{metCount}/{results.length}</span>
          <ConditionPopover results={results} />
        </div>
      </div>

      <div className="quote-row">
        <div>
          <span className="quote-label">Price</span>
          <strong>{formatCurrency(fallbackSnapshot.currentPrice)}</strong>
        </div>
        <div>
          <span className="quote-label">Previous</span>
          <strong>{formatCurrency(fallbackSnapshot.previousClose)}</strong>
        </div>
      </div>

      {fallbackSnapshot.error && <div className="alert alert-warning py-2 mb-3">{fallbackSnapshot.error}</div>}

      <ul className="condition-results">
        {results.map((result) => (
          <li key={result.conditionId} className={result.isMet ? "text-success fw-semibold" : ""}>
            <span>{result.label}</span>
            <small>{result.detail}</small>
          </li>
        ))}
      </ul>

      <div className="stock-card-footer">
        <small>{fallbackSnapshot.lastUpdatedUtc ? `Updated ${new Date(fallbackSnapshot.lastUpdatedUtc).toLocaleString()}` : "Not updated yet"}</small>
        <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => onRemove(stock.id)}>
          Remove
        </button>
      </div>
    </article>
  );
}

function ConditionPopover({ results }: { results: ConditionResult[] }) {
  return (
    <div className="condition-popover">
      {results.map((result) => (
        <div key={result.conditionId} className={result.isMet ? "text-success fw-semibold" : ""}>
          {result.label}
        </div>
      ))}
    </div>
  );
}
