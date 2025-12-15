import { FILTER_OPERATORS, getOperatorsForType } from '../utils/filterEncoder';

/**
 * Visual filter builder component for constructing query filters
 */
export default function FilterBuilder({
  attributes,
  conditions,
  setConditions,
  filterLogic,
  setFilterLogic,
  attributesLoaded
}) {
  const addCondition = () => {
    setConditions([
      ...conditions,
      { id: Date.now(), field: '', operator: '#eq', value: '' }
    ]);
  };

  const removeCondition = (id) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id, field, value) => {
    setConditions(
      conditions.map(c =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };

  const getOperatorsForAttribute = (fieldName) => {
    const attribute = attributes.find(attr => attr.name === fieldName);
    if (!attribute) return FILTER_OPERATORS;
    return getOperatorsForType(attribute.type);
  };

  if (!attributesLoaded) {
    return (
      <div className="filter-builder disabled">
        <h2>Filter Builder</h2>
        <div className="empty-state">
          <p>📋 Connect to the API first to start building filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="filter-builder">
      <h2>Filter Builder</h2>

      {attributes.length === 0 ? (
        <div className="empty-state">
          <p>No attributes found. Please check your API configuration.</p>
        </div>
      ) : (
        <>
          {conditions.length >= 2 && (
            <div className="logic-selector">
              <label>Combine conditions with:</label>
              <div className="logic-buttons">
                <button
                  className={`btn-logic ${filterLogic === 'and' ? 'active' : ''}`}
                  onClick={() => setFilterLogic('and')}
                >
                  AND
                </button>
                <button
                  className={`btn-logic ${filterLogic === 'or' ? 'active' : ''}`}
                  onClick={() => setFilterLogic('or')}
                >
                  OR
                </button>
              </div>
              <span className="logic-hint">
                {filterLogic === 'and'
                  ? 'All conditions must match'
                  : 'At least one condition must match'}
              </span>
            </div>
          )}

          <div className="conditions-list">
            {conditions.length === 0 ? (
              <div className="empty-state">
                <p>No filter conditions yet. Click "Add Condition" to start building your filter.</p>
              </div>
            ) : (
              conditions.map((condition) => (
                <FilterCondition
                  key={condition.id}
                  condition={condition}
                  attributes={attributes}
                  operators={getOperatorsForAttribute(condition.field)}
                  onUpdate={updateCondition}
                  onRemove={removeCondition}
                />
              ))
            )}
          </div>

          <button className="btn btn-primary" onClick={addCondition}>
            + Add Condition
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Individual filter condition row
 */
function FilterCondition({ condition, attributes, operators, onUpdate, onRemove }) {
  return (
    <div className="filter-condition">
      <button
        className="btn-delete-condition"
        onClick={() => onRemove(condition.id)}
        aria-label="Remove condition"
        title="Remove condition"
      >
        ✕
      </button>

      <div className="condition-field">
        <label>Field</label>
        <select
          value={condition.field}
          onChange={(e) => onUpdate(condition.id, 'field', e.target.value)}
        >
          <option value="">Select field...</option>
          <optgroup label="Standard Attributes">
            {attributes
              .filter(attr => !attr.isCustom)
              .map(attr => (
                <option key={attr.name} value={attr.name}>
                  {attr.displayName || attr.name} ({attr.type})
                </option>
              ))}
          </optgroup>
          {attributes.some(attr => attr.isCustom) && (
            <optgroup label="Custom Attributes">
              {attributes
                .filter(attr => attr.isCustom)
                .map(attr => (
                  <option key={attr.name} value={attr.name}>
                    {attr.displayName || attr.name} ({attr.type})
                  </option>
                ))}
            </optgroup>
          )}
        </select>
      </div>

      <div className="condition-operator">
        <label>Operator</label>
        <select
          value={condition.operator}
          onChange={(e) => onUpdate(condition.id, 'operator', e.target.value)}
        >
          {operators.map(op => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      <div className="condition-value">
        <label>Value</label>
        <input
          type="text"
          value={condition.value}
          onChange={(e) => onUpdate(condition.id, 'value', e.target.value)}
          placeholder="Enter value..."
        />
      </div>
    </div>
  );
}
