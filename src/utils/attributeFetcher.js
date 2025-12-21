/**
 * Fetches and combines standard and custom attributes from Infobip API
 */

/**
 * Sanitizes API key by removing non-ASCII characters and trimming
 * @param {string} apiKey - Raw API key
 * @returns {string} Sanitized API key
 */
function sanitizeApiKey(apiKey) {
  if (!apiKey) return '';
  // Remove any non-ASCII characters and trim whitespace
  return apiKey.trim().replace(/[^\x00-\x7F]/g, '');
}

/**
 * Fetches a sample person profile to extract standard attributes
 * @param {string} baseUrl - Base API URL
 * @param {string} apiKey - API authentication key
 * @returns {Promise<Array>} Array of standard attribute objects
 */
async function fetchStandardAttributes(baseUrl, apiKey) {
  const url = `${baseUrl}/people/2/persons?limit=1`;
  const cleanApiKey = sanitizeApiKey(apiKey);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `App ${cleanApiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch person profile: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Return all standard fields from OpenAPI spec (IamPersonV2)
  // We show all fields regardless of whether they're populated in the sample profile
  const standardFields = [
    { name: 'id', displayName: 'id', type: 'string' },
    { name: 'externalId', displayName: 'externalId', type: 'string' },
    { name: 'firstName', displayName: 'firstName', type: 'string' },
    { name: 'lastName', displayName: 'lastName', type: 'string' },
    { name: 'middleName', displayName: 'middleName', type: 'string' },
    { name: 'gender', displayName: 'gender', type: 'enum', enumValues: ['MALE', 'FEMALE'] },
    { name: 'birthDate', displayName: 'birthDate', type: 'date' },
    { name: 'contactInformation.email.address', displayName: 'email', type: 'string' },
    { name: 'contactInformation.phone.number', displayName: 'phone', type: 'string' },
    { name: 'address', displayName: 'address', type: 'string' },
    { name: 'city', displayName: 'city', type: 'string' },
    { name: 'country', displayName: 'country', type: 'string' },
    { name: 'preferredLanguage', displayName: 'preferredLanguage', type: 'string' },
    { name: 'profilePicture', displayName: 'profilePicture', type: 'string' },
    { name: 'tags', displayName: 'tags', type: 'array' },
    { name: 'type', displayName: 'type', type: 'enum', enumValues: ['CUSTOMER', 'LEAD', 'AGENT', 'UNKNOWN'] },
    { name: 'origin', displayName: 'origin', type: 'string' },
    { name: 'createdAt', displayName: 'createdAt', type: 'date' },
    { name: 'modifiedAt', displayName: 'modifiedAt', type: 'date' },
    { name: 'modifiedFrom', displayName: 'modifiedFrom', type: 'string' },
  ];

  return standardFields.map(field => ({
    name: field.name,
    displayName: field.displayName,
    type: field.type,
    isCustom: false,
    enumValues: field.enumValues,
  }));
}

/**
 * Fetches custom attributes from Infobip API with pagination support
 * @param {string} baseUrl - Base API URL
 * @param {string} apiKey - API authentication key
 * @returns {Promise<Array>} Array of custom attribute objects
 */
async function fetchCustomAttributes(baseUrl, apiKey) {
  const cleanApiKey = sanitizeApiKey(apiKey);
  const allAttributes = [];
  let page = 1; // Pages start from 1, not 0
  const limit = 1000; // Maximum allowed
  let hasMore = true;

  while (hasMore) {
    const url = `${baseUrl}/people/2/customAttributes?limit=${limit}&page=${page}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `App ${cleanApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // 404 likely means no custom attributes are defined yet
      if (response.status === 404) {
        break;
      }
      throw new Error(`Failed to fetch custom attributes: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform custom attributes to our format
    if (data.customAttributes && Array.isArray(data.customAttributes)) {
      const attributes = data.customAttributes.map(attr => {
        const dataType = (attr.dataType || 'string').toLowerCase();
        // Detect list attributes
        const isList = dataType === 'list_of_objects' || dataType.includes('list');

        // Extract schema for list attributes
        let schema = {};
        if (isList && attr.objectSchema) {
          // Convert objectSchema format to our format
          // objectSchema is like: { "productName": "STRING", "productPrice": "DECIMAL" }
          schema = Object.keys(attr.objectSchema).reduce((acc, key) => {
            acc[key] = {
              type: (attr.objectSchema[key] || 'string').toLowerCase(),
              description: ''
            };
            return acc;
          }, {});
        }

        // Use 'data' prefix for list attributes, 'customAttributes' for others
        const fieldPrefix = isList ? 'data' : 'customAttributes';

        return {
          name: `${fieldPrefix}.${attr.name}`,
          displayName: attr.name, // Show just the custom attribute name
          type: isList ? 'list' : dataType, // Normalize list types to 'list'
          isCustom: true,
          isList: isList,
          schema: schema, // Store normalized schema
          _originalType: attr.dataType, // Keep original for reference
        };
      });

      allAttributes.push(...attributes);

      // Check if there are more pages
      hasMore = data.customAttributes.length === limit;
      page++;
    } else {
      hasMore = false;
    }
  }

  return allAttributes;
}

/**
 * Fetches lists from Infobip API with pagination support
 * @param {string} baseUrl - Base API URL
 * @param {string} apiKey - API authentication key
 * @returns {Promise<Array>} Array of list objects with their schemas
 */
async function fetchLists(baseUrl, apiKey) {
  const cleanApiKey = sanitizeApiKey(apiKey);
  const allLists = [];
  let page = 1; // Pages start from 1, not 0
  const limit = 1000; // Maximum allowed
  let hasMore = true;

  while (hasMore) {
    const url = `${baseUrl}/people/3/lists?limit=${limit}&page=${page}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `App ${cleanApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // 404 or 400 likely means lists are not available or not enabled
      if (response.status === 404 || response.status === 400) {
        break;
      }
      throw new Error(`Failed to fetch lists: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform lists to our format
    if (data.results && Array.isArray(data.results)) {
      const lists = data.results.map(list => {
        // Extract schema properties from the list's element schema
        const schemaProperties = {};

        // Lists may have elementSchema or schema.properties
        const elementSchema = list.elementSchema || list.schema;
        if (elementSchema && elementSchema.properties) {
          Object.keys(elementSchema.properties).forEach(key => {
            const prop = elementSchema.properties[key];
            schemaProperties[key] = {
              type: prop.type || 'string',
              description: prop.description || ''
            };
          });
        }

        return {
          name: `data\u0001${list.name}`,
          displayName: list.name,
          type: 'list', // Always 'list' regardless of what API returns
          isCustom: false,
          isList: true, // Flag to identify lists
          schema: schemaProperties, // Store normalized schema
          _originalType: list.type, // Keep original for debugging
        };
      });

      allLists.push(...lists);

      // Check if there are more pages
      hasMore = data.results.length === limit;
      page++;
    } else {
      hasMore = false;
    }
  }

  return allLists;
}

/**
 * Fetches and combines all available attributes (standard + custom + lists)
 * @param {string} baseUrl - Base API URL
 * @param {string} apiKey - API authentication key
 * @returns {Promise<Object>} Object with attributes array and any errors
 */
export async function fetchAllAttributes(baseUrl, apiKey) {
  try {
    // Make all API calls in parallel
    const [standardAttrs, customAttrs, lists] = await Promise.allSettled([
      fetchStandardAttributes(baseUrl, apiKey),
      fetchCustomAttributes(baseUrl, apiKey),
      fetchLists(baseUrl, apiKey),
    ]);

    const attributes = [];
    const errors = [];

    // Process standard attributes
    if (standardAttrs.status === 'fulfilled') {
      attributes.push(...standardAttrs.value);
    } else {
      errors.push(`Standard attributes: ${standardAttrs.reason.message}`);
    }

    // Process custom attributes
    if (customAttrs.status === 'fulfilled') {
      attributes.push(...customAttrs.value);
    } else {
      errors.push(`Custom attributes: ${customAttrs.reason.message}`);
    }

    // Process lists (optional - don't show error if not available)
    if (lists.status === 'fulfilled') {
      attributes.push(...lists.value);
    }
    // Lists are optional, so we don't add errors if they fail

    // If we got no attributes at all, throw an error with details
    if (attributes.length === 0) {
      const errorDetails = errors.length > 0
        ? `\n${errors.join('\n')}`
        : '';
      throw new Error(`Failed to fetch any attributes. Please check your API key and base URL.${errorDetails}`);
    }

    return {
      attributes,
      errors: errors.length > 0 ? errors : null,
    };
  } catch (error) {
    throw new Error(`Failed to fetch attributes: ${error.message}`);
  }
}
