/**
 * Fetches and combines standard and custom attributes from Infobip API
 */

/**
 * Fetches a sample person profile to extract standard attributes
 * @param {string} baseUrl - Base API URL
 * @param {string} apiKey - API authentication key
 * @returns {Promise<Array>} Array of standard attribute objects
 */
async function fetchStandardAttributes(baseUrl, apiKey) {
  const url = `${baseUrl}/people/2/persons?limit=1`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `App ${apiKey}`,
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
    { name: 'id', type: 'string' },
    { name: 'externalId', type: 'string' },
    { name: 'firstName', type: 'string' },
    { name: 'lastName', type: 'string' },
    { name: 'middleName', type: 'string' },
    { name: 'gender', type: 'string' },
    { name: 'birthDate', type: 'date' },
    { name: 'address', type: 'string' },
    { name: 'city', type: 'string' },
    { name: 'country', type: 'string' },
    { name: 'preferredLanguage', type: 'string' },
    { name: 'profilePicture', type: 'string' },
    { name: 'tags', type: 'array' },
    { name: 'type', type: 'string' },
    { name: 'origin', type: 'string' },
    { name: 'createdAt', type: 'date' },
    { name: 'modifiedAt', type: 'date' },
    { name: 'modifiedFrom', type: 'string' },
  ];

  return standardFields.map(field => ({
    name: field.name,
    type: field.type,
    isCustom: false,
  }));
}

/**
 * Fetches custom attributes from Infobip API
 * @param {string} baseUrl - Base API URL
 * @param {string} apiKey - API authentication key
 * @returns {Promise<Array>} Array of custom attribute objects
 */
async function fetchCustomAttributes(baseUrl, apiKey) {
  const url = `${baseUrl}/people/2/customAttributes`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `App ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    // 404 likely means no custom attributes are defined yet
    if (response.status === 404) {
      return []; // Return empty array instead of throwing error
    }
    throw new Error(`Failed to fetch custom attributes: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Transform custom attributes to our format
  if (data.customAttributes && Array.isArray(data.customAttributes)) {
    return data.customAttributes.map(attr => ({
      name: `customAttributes.${attr.name}`,
      type: (attr.dataType || 'string').toLowerCase(), // Normalize to lowercase
      isCustom: true,
    }));
  }

  return [];
}

/**
 * Fetches and combines all available attributes (standard + custom)
 * @param {string} baseUrl - Base API URL
 * @param {string} apiKey - API authentication key
 * @returns {Promise<Object>} Object with attributes array and any errors
 */
export async function fetchAllAttributes(baseUrl, apiKey) {
  try {
    // Make both API calls in parallel
    const [standardAttrs, customAttrs] = await Promise.allSettled([
      fetchStandardAttributes(baseUrl, apiKey),
      fetchCustomAttributes(baseUrl, apiKey),
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

    // If we got no attributes at all, throw an error
    if (attributes.length === 0) {
      throw new Error('Failed to fetch any attributes. Please check your API key and base URL.');
    }

    return {
      attributes,
      errors: errors.length > 0 ? errors : null,
    };
  } catch (error) {
    throw new Error(`Failed to fetch attributes: ${error.message}`);
  }
}
