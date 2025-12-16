/**
 * Builds and encodes filter strings for Infobip API queries
 */

/**
 * Builds a nested object from a dot-separated path
 * @param {string} path - Dot-separated path (e.g., "contactInformation.email.address")
 * @param {*} value - Value to set at the end of the path
 * @returns {Object} Nested object structure
 */
function buildNestedObject(path, value) {
  const parts = path.split('.');

  // If no dots, return simple key-value
  if (parts.length === 1) {
    return { [path]: value };
  }

  // Build nested structure from the end backwards
  let result = value;
  for (let i = parts.length - 1; i >= 0; i--) {
    result = { [parts[i]]: result };
  }

  return result;
}

/**
 * Builds a filter JSON object from an array of conditions
 * @param {Array} conditions - Array of filter condition objects {field, operator, value, fieldType, listMode, listConditions}
 * @param {string} logic - Logic operator to use for multiple conditions ('and' or 'or')
 * @returns {string} JSON string of the filter structure
 */
export function buildFilterString(conditions, logic = 'and') {
  if (!conditions || conditions.length === 0) {
    return '';
  }

  // Filter out incomplete conditions
  // For #exists and #notExist, we don't need a value
  const validConditions = conditions.filter(c => {
    if (!c.field) {
      return false;
    }

    // List conditions need listConditions array with valid items
    if (c.fieldType === 'list' || c.isList) {
      if (!c.listConditions || c.listConditions.length === 0) {
        return false;
      }
      // Check if at least one list condition is valid
      const hasValidListCondition = c.listConditions.some(lc =>
        lc.field && lc.operator && lc.value !== undefined && lc.value !== ''
      );
      return hasValidListCondition;
    }

    // Non-list conditions need an operator
    if (!c.operator) {
      return false;
    }

    // #exists and #notExist don't require a value
    if (c.operator === '#exists' || c.operator === '#notExist') {
      return true;
    }
    // All other operators require a value
    return c.value !== undefined && c.value !== '';
  });

  if (validConditions.length === 0) {
    return '';
  }

  // Build filter conditions in Infobip JSON format
  const filterConditions = validConditions.map(condition => {
    const { field, operator, value, fieldType, listMode, listConditions, listLogic } = condition;

    // Special handling for list fields
    if (fieldType === 'list' && listConditions) {
      // Filter out incomplete list conditions
      const validListConditions = listConditions.filter(lc =>
        lc.field && lc.operator && lc.value !== undefined && lc.value !== ''
      );

      if (validListConditions.length === 0) {
        return null; // Skip this condition if no valid list conditions
      }

      // Build list item conditions (simple property: value pairs)
      const itemConditions = validListConditions.map(itemCond => {
        let itemValue = itemCond.value;

        // Special handling for #in and #notIn - parse comma-separated string to array
        if (itemCond.operator === '#in' || itemCond.operator === '#notIn') {
          if (typeof itemValue === 'string') {
            itemValue = itemValue.split(',').map(item => item.trim()).filter(item => item !== '');

            // Get field type from schema if available
            const itemFieldType = condition.schema?.[itemCond.field]?.type;
            if (itemFieldType) {
              const normalizedType = itemFieldType.toLowerCase();
              if (normalizedType === 'integer') {
                itemValue = itemValue.map(item => {
                  const parsed = parseInt(item, 10);
                  return isNaN(parsed) ? item : parsed;
                });
              } else if (normalizedType === 'decimal' || normalizedType === 'number') {
                itemValue = itemValue.map(item => {
                  const parsed = parseFloat(item);
                  return isNaN(parsed) ? item : parsed;
                });
              } else if (normalizedType === 'boolean') {
                itemValue = itemValue.map(item => {
                  const lower = item.toLowerCase();
                  if (lower === 'true' || lower === '1' || lower === 'yes') return true;
                  if (lower === 'false' || lower === '0' || lower === 'no') return false;
                  return item;
                });
              }
            }
          }
        }

        // For list items, we just use simple field: value or operator: {field: value}
        if (itemCond.operator === '#eq') {
          return { [itemCond.field]: itemValue };
        } else {
          return { [itemCond.operator]: { [itemCond.field]: itemValue } };
        }
      });

      // Wrap items with list logic (#and or #or)
      const itemLogicOperator = listLogic === 'or' ? '#or' : '#and';
      const listItemsWithLogic = { [itemLogicOperator]: itemConditions };

      // For list fields, use the field name directly with \u0001 delimiter
      // Convert dot notation to \u0001 if needed
      const listFieldName = field.replace(/\./g, '\u0001');
      const mode = listMode || '#any';

      // Build the structure: {mode: {fieldName: itemsWithLogic}}
      return { [mode]: { [listFieldName]: listItemsWithLogic } };
    }

    // Special handling for #exists and #notExist operators
    if (operator === '#exists' || operator === '#notExist') {
      const fieldObject = buildNestedObject(field, true);
      return { [operator]: fieldObject };
    }

    // Special handling for #in and #notIn operators - parse comma-separated string to array
    if (operator === '#in' || operator === '#notIn') {
      let arrayValue = value;

      // If value is a string, parse it as comma-separated
      if (typeof value === 'string') {
        arrayValue = value.split(',').map(item => item.trim()).filter(item => item !== '');

        // Parse each item based on field type
        if (fieldType === 'integer') {
          arrayValue = arrayValue.map(item => {
            const parsed = parseInt(item, 10);
            return isNaN(parsed) ? item : parsed;
          });
        } else if (fieldType === 'decimal' || fieldType === 'number') {
          arrayValue = arrayValue.map(item => {
            const parsed = parseFloat(item);
            return isNaN(parsed) ? item : parsed;
          });
        } else if (fieldType === 'boolean') {
          arrayValue = arrayValue.map(item => {
            const lower = item.toLowerCase();
            if (lower === 'true' || lower === '1' || lower === 'yes') return true;
            if (lower === 'false' || lower === '0' || lower === 'no') return false;
            return item;
          });
        }
      }

      const fieldObject = buildNestedObject(field, arrayValue);
      return { [operator]: fieldObject };
    }

    // For array fields, invert the structure: {field: {operator: value}}
    if (fieldType === 'array') {
      const operatorObject = { [operator]: value };
      return buildNestedObject(field, operatorObject);
    }

    // Build nested object structure for the field
    const fieldObject = buildNestedObject(field, value);

    // Check if this is a comparison operator or implicit equality
    if (operator === '#eq') {
      // Simple equality: {"fieldName": "value"} or nested structure
      return fieldObject;
    } else {
      // Operator-based: {"#operator": {"fieldName": "value"}} or nested structure
      return { [operator]: fieldObject };
    }
  }).filter(fc => fc !== null); // Filter out null conditions

  // If no valid conditions after filtering, return empty
  if (filterConditions.length === 0) {
    return '';
  }

  // If single condition, return it directly
  if (filterConditions.length === 1) {
    return JSON.stringify(filterConditions[0]);
  }

  // Multiple conditions: wrap with logic operator (#and or #or)
  const logicOperator = logic === 'or' ? '#or' : '#and';
  return JSON.stringify({
    [logicOperator]: filterConditions
  });
}

/**
 * URL encodes a filter string
 * @param {string} filterString - Raw filter string
 * @returns {string} URL-encoded filter string
 */
export function encodeFilterString(filterString) {
  if (!filterString) {
    return '';
  }

  return encodeURIComponent(filterString);
}

/**
 * Builds and encodes a filter string in one step
 * @param {Array} conditions - Array of filter condition objects
 * @param {string} logic - Logic operator to use for multiple conditions ('and' or 'or')
 * @returns {Object} Object with raw and encoded filter strings
 */
export function buildAndEncodeFilter(conditions, logic = 'and') {
  const rawFilter = buildFilterString(conditions, logic);
  const encodedFilter = encodeFilterString(rawFilter);

  return {
    raw: rawFilter,
    encoded: encodedFilter,
  };
}

/**
 * Available filter operators with descriptions
 */
export const FILTER_OPERATORS = [
  {
    value: '#eq',
    label: 'equals',
    description: 'Equals to a specified value',
    types: ['string', 'integer', 'decimal', 'date', 'number', 'boolean', 'date_time'],
  },
  {
    value: '#ne',
    label: 'not equals',
    description: 'Not equal to a specified value',
    types: ['string', 'integer', 'decimal', 'date', 'number', 'boolean', 'date_time'],
  },
  {
    value: '#contains',
    label: 'contains',
    description: 'Contains a specified value',
    types: ['string', 'array'],
  },
  {
    value: '#notContain',
    label: 'not contain',
    description: 'Does not contain a specified value',
    types: ['string', 'array'],
  },
  {
    value: '#startsWith',
    label: 'starts with',
    description: 'Starts with a specified value',
    types: ['string'],
  },
  {
    value: '#endsWith',
    label: 'ends with',
    description: 'Ends with a specified value',
    types: ['string'],
  },
  {
    value: '#gt',
    label: 'greater than',
    description: 'Is greater than a specified value',
    types: ['integer', 'decimal', 'date', 'number', 'date_time'],
  },
  {
    value: '#gte',
    label: 'greater than or equal',
    description: 'Is greater than or equal to a specified value',
    types: ['integer', 'decimal', 'date', 'number', 'date_time'],
  },
  {
    value: '#lt',
    label: 'less than',
    description: 'Is less than a specified value',
    types: ['integer', 'decimal', 'date', 'number', 'date_time'],
  },
  {
    value: '#lte',
    label: 'less than or equal',
    description: 'Is less than or equal to a specified value',
    types: ['integer', 'decimal', 'date', 'number', 'date_time'],
  },
  {
    value: '#in',
    label: 'is one of',
    description: 'Is equal to one of the values in a list',
    types: ['string', 'integer', 'decimal', 'date', 'number', 'date_time'],
  },
  {
    value: '#notIn',
    label: 'is not one of',
    description: 'Is not equal to any of the values in a list',
    types: ['string', 'integer', 'decimal', 'date', 'number', 'date_time'],
  },
  {
    value: '#exists',
    label: 'exists',
    description: 'Matches records where the field has a value',
    types: ['string', 'integer', 'decimal', 'date', 'number', 'array', 'boolean', 'date_time'],
  },
  {
    value: '#notExist',
    label: 'does not exist',
    description: 'Matches records where the field does not have a value',
    types: ['string', 'integer', 'decimal', 'date', 'number', 'array', 'boolean', 'date_time'],
  },
];

/**
 * Gets recommended operators based on attribute type
 * @param {string} attributeType - Type of the attribute (string, number, array, etc.)
 * @returns {Array} Filtered list of applicable operators
 */
export function getOperatorsForType(attributeType) {
  // Normalize type names
  const normalizedType = attributeType.toLowerCase();

  // Map common type variations
  const typeMap = {
    'number': 'integer',
    'float': 'decimal',
    'double': 'decimal',
  };

  const mappedType = typeMap[normalizedType] || normalizedType;

  // String-only operators that don't work with numeric types
  const stringOnlyOperators = ['#contains', '#notContain', '#startsWith', '#endsWith'];

  // For numeric types (integer, decimal), exclude string-only operators
  const isNumericType = mappedType === 'integer' || mappedType === 'decimal';

  // Filter operators that support this type
  return FILTER_OPERATORS.filter(op => {
    // Exclude string-only operators for numeric types
    if (isNumericType && stringOnlyOperators.includes(op.value)) {
      return false;
    }

    return op.types.includes(mappedType);
  });
}
