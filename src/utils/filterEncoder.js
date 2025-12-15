/**
 * Builds and encodes filter strings for Infobip API queries
 */

/**
 * Builds a filter JSON object from an array of conditions
 * @param {Array} conditions - Array of filter condition objects {field, operator, value}
 * @param {string} logic - Logic operator to use for multiple conditions ('and' or 'or')
 * @returns {string} JSON string of the filter structure
 */
export function buildFilterString(conditions, logic = 'and') {
  if (!conditions || conditions.length === 0) {
    return '';
  }

  // Filter out incomplete conditions
  const validConditions = conditions.filter(
    c => c.field && c.operator && c.value !== undefined && c.value !== ''
  );

  if (validConditions.length === 0) {
    return '';
  }

  // Build filter conditions in Infobip JSON format
  const filterConditions = validConditions.map(condition => {
    const { field, operator, value } = condition;

    // Check if this is a comparison operator or implicit equality
    if (operator === '#eq') {
      // Simple equality: {"fieldName": "value"}
      return { [field]: value };
    } else {
      // Operator-based: {"#operator": {"fieldName": "value"}}
      return { [operator]: { [field]: value } };
    }
  });

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
    description: 'Matches values that are equal to a specified value',
    types: ['string', 'integer', 'decimal', 'date', 'number'],
  },
  {
    value: '#ne',
    label: 'not equals',
    description: 'Matches all values that are not equal to a specified value',
    types: ['string', 'integer', 'decimal', 'date', 'number'],
  },
  {
    value: '#contains',
    label: 'contains',
    description: 'Matches records that contain the specified value',
    types: ['string', 'array'],
  },
  {
    value: '#notContain',
    label: 'not contain',
    description: 'Matches records that do not contain the specified value',
    types: ['string'],
  },
  {
    value: '#startsWith',
    label: 'starts with',
    description: 'Matches records that start with a specified value',
    types: ['string'],
  },
  {
    value: '#endsWith',
    label: 'ends with',
    description: 'Matches records that end with a specified value',
    types: ['string'],
  },
  {
    value: '#gt',
    label: 'greater than',
    description: 'Matches values that are greater than a specified value',
    types: ['integer', 'decimal', 'date', 'number'],
  },
  {
    value: '#gte',
    label: 'greater than or equal',
    description: 'Matches values that are greater than or equal to a specified value',
    types: ['integer', 'decimal', 'date', 'number'],
  },
  {
    value: '#lt',
    label: 'less than',
    description: 'Matches values that are less than a specified value',
    types: ['integer', 'decimal', 'date', 'number'],
  },
  {
    value: '#lte',
    label: 'less than or equal',
    description: 'Matches values that are less than or equal to a specified value',
    types: ['integer', 'decimal', 'date', 'number'],
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

  // Filter operators that support this type
  return FILTER_OPERATORS.filter(op =>
    op.types.includes(mappedType) ||
    op.types.includes('string') // String operators work for most types
  );
}
