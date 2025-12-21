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
      { id: Date.now(), field: '', operator: '#eq', value: '', fieldType: 'string' }
    ]);
  };

  const removeCondition = (id) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id, field, value) => {
    setConditions(
      conditions.map(c => {
        if (c.id === id) {
          const updated = { ...c, [field]: value };

          // If updating the field, reset the condition and set up for the new field
          if (field === 'field' && value) {
            const attribute = attributes.find(attr => attr.name === value);
            if (attribute) {
              updated.fieldType = attribute.type;
              // If it's a list, store the schema and initialize list-specific properties
              if (attribute.type === 'list' || attribute.isList) {
                updated.fieldType = 'list'; // Force to 'list'
                updated.schema = attribute.schema;
                updated.listMode = '#any'; // Reset to default
                updated.listLogic = 'and'; // Reset to default
                updated.listConditions = []; // Reset list conditions
                // Clear operator and value for lists
                updated.operator = null;
                updated.value = '';
              } else {
                // For non-list fields, reset to defaults
                updated.operator = '#eq';
                updated.value = '';
                // Clear any list-specific properties
                delete updated.listMode;
                delete updated.listLogic;
                delete updated.listConditions;
                delete updated.schema;
              }
            } else {
              updated.fieldType = 'string';
              updated.operator = '#eq';
              updated.value = '';
            }
          }

          // If updating the operator, reset the value if switching to/from #in or #notIn
          if (field === 'operator') {
            const wasListOperator = c.operator === '#in' || c.operator === '#notIn';
            const isListOperator = value === '#in' || value === '#notIn';
            if (wasListOperator !== isListOperator) {
              updated.value = '';
            }
          }

          return updated;
        }
        return c;
      })
    );
  };

  const getOperatorsForAttribute = (fieldName) => {
    const attribute = attributes.find(attr => attr.name === fieldName);
    if (!attribute) return FILTER_OPERATORS;

    // Tags array only supports #contains and #notContain
    if (fieldName === 'tags') {
      return FILTER_OPERATORS.filter(op =>
        op.value === '#contains' || op.value === '#notContain'
      );
    }

    // Enum fields only support #eq and #ne
    if (attribute.type === 'enum') {
      return FILTER_OPERATORS.filter(op =>
        op.value === '#eq' || op.value === '#ne'
      );
    }

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
 * Get input type based on attribute type and operator
 */
function getInputType(attributeType, operator) {
  if (!attributeType) return 'text';

  // For #in and #notIn operators, always use text input to allow comma-separated values
  if (operator === '#in' || operator === '#notIn') {
    return 'text';
  }

  const type = attributeType.toLowerCase();
  if (type === 'integer' || type === 'decimal' || type === 'number') {
    return 'number';
  }
  if (type === 'date' || type === 'date_time') {
    return 'date';
  }
  if (type === 'boolean') {
    return 'boolean';
  }
  return 'text';
}

/**
 * Parse value based on attribute type and operator
 * For #in and #notIn, keep as string - parsing happens in filterEncoder
 */
function parseValue(value, attributeType, operator) {
  if (value === undefined || value === null || !attributeType) return value;

  const type = attributeType.toLowerCase();

  // For #in and #notIn operators, keep as string - will be parsed in filterEncoder
  if (operator === '#in' || operator === '#notIn') {
    return value; // Keep as comma-separated string
  }

  // Single value handling
  if (type === 'integer') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? value : parsed;
  }
  if (type === 'decimal' || type === 'number') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? value : parsed;
  }
  if (type === 'boolean') {
    // Convert string representation to boolean
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    // Handle other string variations
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes') return true;
      if (lower === 'false' || lower === '0' || lower === 'no') return false;
    }
  }
  return value;
}

/**
 * Individual filter condition row
 */
function FilterCondition({ condition, attributes, operators, onUpdate, onRemove }) {
  const isExistenceCheck = condition.operator === '#exists' || condition.operator === '#notExist';
  const selectedAttribute = attributes.find(attr => attr.name === condition.field);
  // Check both condition's fieldType and attribute's type/isList to determine if it's a list
  const isList = condition.fieldType === 'list' || selectedAttribute?.type === 'list' || selectedAttribute?.isList;

  const addListCondition = () => {
    const listConditions = condition.listConditions || [];
    const newCondition = { id: Date.now(), field: '', operator: '#eq', value: '' };
    onUpdate(condition.id, 'listConditions', [...listConditions, newCondition]);
  };

  const removeListCondition = (listCondId) => {
    const listConditions = condition.listConditions || [];
    onUpdate(condition.id, 'listConditions', listConditions.filter(c => c.id !== listCondId));
  };

  const updateListCondition = (listCondId, field, value) => {
    const listConditions = condition.listConditions || [];
    onUpdate(condition.id, 'listConditions',
      listConditions.map(c => {
        if (c.id === listCondId) {
          const updated = { ...c, [field]: value };

          // If updating the operator, reset the value if switching to/from #in or #notIn
          if (field === 'operator') {
            const wasListOperator = c.operator === '#in' || c.operator === '#notIn';
            const isListOperator = value === '#in' || value === '#notIn';
            if (wasListOperator !== isListOperator) {
              updated.value = '';
            }
          }

          return updated;
        }
        return c;
      })
    );
  };

  return (
    <div className={`filter-condition ${isExistenceCheck ? 'no-value' : ''} ${isList ? 'list-condition' : ''}`}>
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

          {/* Standard Attributes */}
          <optgroup label="Standard Attributes">
            {attributes
              .filter(attr => !attr.isCustom)
              .map(attr => (
                <option key={attr.name} value={attr.name}>
                  {attr.displayName || attr.name} ({attr.type})
                </option>
              ))}
          </optgroup>

          {/* Custom Attributes (including lists) */}
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

      {isList ? (
        <>
          <div className="condition-list-mode">
            <label>Filter Mode</label>
            <select
              value={condition.listMode || '#any'}
              onChange={(e) => onUpdate(condition.id, 'listMode', e.target.value)}
            >
              <option value="#any">Any item matches</option>
              <option value="#all">All items match</option>
            </select>
          </div>

          <div className="list-conditions-wrapper">
            <div className="list-conditions-header">
              <label>Item Conditions</label>
              {condition.listConditions && condition.listConditions.length >= 2 && (
                <select
                  value={condition.listLogic || 'and'}
                  onChange={(e) => onUpdate(condition.id, 'listLogic', e.target.value)}
                  className="list-logic-selector"
                >
                  <option value="and">AND</option>
                  <option value="or">OR</option>
                </select>
              )}
            </div>

            {(!condition.listConditions || condition.listConditions.length === 0) && (
              <div className="empty-list-conditions">
                <p>No item conditions. Click "+ Add Item Condition" below.</p>
              </div>
            )}

            {condition.listConditions && condition.listConditions.map((listCond) => {
              // Use schema from condition first, then from selectedAttribute
              const listSchema = condition.schema || selectedAttribute?.schema || {};
              const schemaFields = Object.keys(listSchema)
                .filter(key => key !== '__id') // Filter out internal __id property
                .map(key => ({
                  name: key,
                  type: listSchema[key]?.type || 'string'
                }));

              return (
                <div key={listCond.id} className="list-item-condition">
                  <button
                    className="btn-delete-list-condition"
                    onClick={() => removeListCondition(listCond.id)}
                    aria-label="Remove item condition"
                  >
                    ✕
                  </button>

                  <select
                    value={listCond.field}
                    onChange={(e) => updateListCondition(listCond.id, 'field', e.target.value)}
                    className="list-item-field"
                  >
                    <option value="">Select property...</option>
                    {schemaFields.map(field => (
                      <option key={field.name} value={field.name}>
                        {field.name} ({field.type})
                      </option>
                    ))}
                  </select>

                  <select
                    value={listCond.operator}
                    onChange={(e) => updateListCondition(listCond.id, 'operator', e.target.value)}
                    className="list-item-operator"
                  >
                    <option value="#eq">equals</option>
                    <option value="#ne">not equals</option>
                    <option value="#contains">contains</option>
                    <option value="#gt">greater than</option>
                    <option value="#lt">less than</option>
                    <option value="#in">is one of</option>
                    <option value="#notIn">is not one of</option>
                  </select>

                  {listSchema[listCond.field]?.type?.toLowerCase() === 'boolean' ? (
                    <select
                      value={listCond.value === true ? 'true' : listCond.value === false ? 'false' : ''}
                      onChange={(e) => {
                        const value = parseValue(e.target.value, listSchema[listCond.field]?.type, listCond.operator);
                        updateListCondition(listCond.id, 'value', value);
                      }}
                      className="list-item-value"
                    >
                      <option value="">Select value...</option>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <input
                      type={getInputType(listSchema[listCond.field]?.type, listCond.operator)}
                      value={listCond.value || ''}
                      onChange={(e) => {
                        const value = parseValue(e.target.value, listSchema[listCond.field]?.type, listCond.operator);
                        updateListCondition(listCond.id, 'value', value);
                      }}
                      placeholder={
                        listCond.operator === '#in' || listCond.operator === '#notIn'
                          ? 'Comma-separated...'
                          : 'Value...'
                      }
                      className="list-item-value"
                    />
                  )}
                </div>
              );
            })}

            <button className="btn btn-secondary btn-sm" onClick={addListCondition}>
              + Add Item Condition
            </button>
          </div>
        </>
      ) : (
        <>
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

          {condition.operator !== '#exists' && condition.operator !== '#notExist' && (
            <div className="condition-value">
              <label>Value</label>
              {selectedAttribute?.type?.toLowerCase() === 'boolean' ? (
                <select
                  value={condition.value === true ? 'true' : condition.value === false ? 'false' : ''}
                  onChange={(e) => {
                    const value = parseValue(e.target.value, selectedAttribute?.type, condition.operator);
                    onUpdate(condition.id, 'value', value);
                  }}
                >
                  <option value="">Select value...</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : selectedAttribute?.type === 'enum' && selectedAttribute?.enumValues ? (
                <select
                  value={condition.value || ''}
                  onChange={(e) => {
                    onUpdate(condition.id, 'value', e.target.value);
                  }}
                >
                  <option value="">Select value...</option>
                  {selectedAttribute.enumValues.map(enumVal => (
                    <option key={enumVal} value={enumVal}>
                      {enumVal}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={getInputType(selectedAttribute?.type, condition.operator)}
                  value={condition.value || ''}
                  onChange={(e) => {
                    const value = parseValue(e.target.value, selectedAttribute?.type, condition.operator);
                    onUpdate(condition.id, 'value', value);
                  }}
                  placeholder={
                    condition.operator === '#in' || condition.operator === '#notIn'
                      ? 'Enter comma-separated values...'
                      : 'Enter value...'
                  }
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
