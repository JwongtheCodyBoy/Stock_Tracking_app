import { useState } from "react";
import type { AddStockRequest, ConditionType } from "../types/stock";

interface AddStockFormProps {
  onAddStock: (request: AddStockRequest) => Promise<void>;
}

export function AddStockForm({ onAddStock }: AddStockFormProps) {
  const [symbol, setSymbol] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState<ConditionType>("GreaterThanOrEqual");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const parsedTargetPrice = Number(targetPrice);

    if (!symbol.trim() || Number.isNaN(parsedTargetPrice) || parsedTargetPrice <= 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onAddStock({
        symbol: symbol.trim().toUpperCase(),
        targetPrice: parsedTargetPrice,
        condition
      });

      setSymbol("");
      setTargetPrice("");
      setCondition("GreaterThanOrEqual");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="card shadow-sm mb-4" onSubmit={handleSubmit}>
      <div className="card-body">
        <h5 className="card-title mb-3">Add Stock</h5>

        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-3">
            <label className="form-label">Ticker</label>
            <input
              className="form-control"
              placeholder="AAPL"
              value={symbol}
              onChange={(event) => setSymbol(event.target.value)}
            />
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">Condition</label>
            <select
              className="form-select"
              value={condition}
              onChange={(event) => setCondition(event.target.value as ConditionType)}
            >
              <option value="GreaterThanOrEqual">Price &gt;= Target</option>
              <option value="LessThanOrEqual">Price &lt;= Target</option>
            </select>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">Target Price</label>
            <input
              className="form-control"
              type="number"
              step="0.01"
              min="0"
              placeholder="220.00"
              value={targetPrice}
              onChange={(event) => setTargetPrice(event.target.value)}
            />
          </div>

          <div className="col-12 col-md-3">
            <button className="btn btn-primary w-100" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Stock"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
