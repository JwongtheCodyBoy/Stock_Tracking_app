import type { ConditionType, StockCondition } from "../types/conditions";
import { conditionDefinitions, conditionOptions, createDefaultCondition } from "../conditions/conditionDefinitions";

interface ConditionEditorProps {
  condition: StockCondition;
  onChange: (condition: StockCondition) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function ConditionEditor({ condition, onChange, onRemove, canRemove }: ConditionEditorProps) {
  const definition = conditionDefinitions[condition.type];

  function handleTypeChange(type: ConditionType) {
    onChange({
      ...createDefaultCondition(type),
      id: condition.id
    });
  }

  function updateNumberParam(key: "targetPrice" | "period", value: string) {
    const numericValue = Number(value);
    onChange({
      ...condition,
      params: {
        ...condition.params,
        [key]: Number.isFinite(numericValue) ? numericValue : 0
      }
    });
  }

  return (
    <div className="condition-row">
      <select
        className="form-select"
        value={condition.type}
        onChange={(event) => handleTypeChange(event.target.value as ConditionType)}
        aria-label="Condition type"
      >
        {conditionOptions.map((option) => (
          <option key={option.type} value={option.type}>
            {option.name}
          </option>
        ))}
      </select>

      {"targetPrice" in condition.params && (
        <div className="input-group">
          <span className="input-group-text">$</span>
          <input
            className="form-control"
            type="number"
            min="0"
            step="0.01"
            value={condition.params.targetPrice}
            onChange={(event) => updateNumberParam("targetPrice", event.target.value)}
            aria-label="Target price"
          />
        </div>
      )}

      {"period" in condition.params && (
        <div className="input-group">
          <span className="input-group-text">Period</span>
          <input
            className="form-control"
            type="number"
            min="2"
            step="1"
            value={condition.params.period}
            onChange={(event) => updateNumberParam("period", event.target.value)}
            aria-label={`${definition.shortName} period`}
          />
        </div>
      )}

      <button className="btn btn-outline-danger icon-button" type="button" onClick={onRemove} disabled={!canRemove} title="Remove condition">
        x
      </button>
    </div>
  );
}
