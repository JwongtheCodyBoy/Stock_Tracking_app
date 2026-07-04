import { useState, type FormEvent } from "react";
import type { StockCondition, ConditionType } from "../types/conditions";
import type { TrackedStock } from "../types/stocks";
import { conditionOptions, createDefaultCondition } from "../conditions/conditionDefinitions";
import { createId } from "../utils/id";
import { ConditionEditor } from "./ConditionEditor";

interface AddStockFormProps {
  onAddStock: (stock: TrackedStock) => void;
  disabled: boolean;
}

export function AddStockForm({ onAddStock, disabled }: AddStockFormProps) {
  const [symbol, setSymbol] = useState("");
  const [notes, setNotes] = useState("");
  const [conditions, setConditions] = useState<StockCondition[]>([createDefaultCondition("priceBelowTarget")]);

  function updateCondition(updatedCondition: StockCondition) {
    setConditions((current) => current.map((condition) => (condition.id === updatedCondition.id ? updatedCondition : condition)));
  }

  function removeCondition(conditionId: string) {
    setConditions((current) => current.filter((condition) => condition.id !== conditionId));
  }

  function addCondition(type: ConditionType) {
    setConditions((current) => [...current, createDefaultCondition(type)]);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalizedSymbol = symbol.trim().toUpperCase();
    if (!normalizedSymbol || conditions.length === 0) {
      return;
    }

    onAddStock({
      id: createId("stock"),
      symbol: normalizedSymbol,
      notes: notes.trim(),
      conditions,
      createdAtUtc: new Date().toISOString()
    });

    setSymbol("");
    setNotes("");
    setConditions([createDefaultCondition("priceBelowTarget")]);
  }

  return (
    <form className="tool-panel" onSubmit={handleSubmit}>
      <div className="panel-header">
        <h2>Add Stock</h2>
      </div>

      <div className="row g-3">
        <div className="col-md-3">
          <label className="form-label" htmlFor="symbol">
            Symbol
          </label>
          <input
            id="symbol"
            className="form-control text-uppercase"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
            placeholder="AAPL"
            maxLength={12}
            disabled={disabled}
          />
        </div>
        <div className="col-md-9">
          <label className="form-label" htmlFor="notes">
            Notes
          </label>
          <input
            id="notes"
            className="form-control"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional setup notes"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="condition-list">
        {conditions.map((condition) => (
          <ConditionEditor
            key={condition.id}
            condition={condition}
            onChange={updateCondition}
            onRemove={() => removeCondition(condition.id)}
            canRemove={conditions.length > 1}
          />
        ))}
      </div>

      <div className="d-flex flex-wrap gap-2 align-items-center">
        <select className="form-select condition-picker" onChange={(event) => addCondition(event.target.value as ConditionType)} value="">
          <option value="" disabled>
            Add condition
          </option>
          {conditionOptions.map((option) => (
            <option key={option.type} value={option.type}>
              {option.shortName}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" type="submit" disabled={disabled || !symbol.trim()}>
          Add Stock
        </button>
      </div>
    </form>
  );
}
