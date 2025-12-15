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
  // Note: \u0001 is the special delimiter Infobip uses for nested properties
  const standardFields = [
    { name: 'id', displayName: 'id', type: 'string' },
    { name: 'externalId', displayName: 'externalId', type: 'string' },
    { name: 'firstName', displayName: 'firstName', type: 'string' },
    { name: 'lastName', displayName: 'lastName', type: 'string' },
    { name: 'middleName', displayName: 'middleName', type: 'string' },
    { name: 'gender', displayName: 'gender', type: 'string' },
    { name: 'birthDate', displayName: 'birthDate', type: 'date' },
    { name: 'destinations\u0001email', displayName: 'email', type: 'string' },
    { name: 'destinations\u0001msisdn', displayName: 'phone', type: 'string' },
    { name: 'address', displayName: 'address', type: 'string' },
    { name: 'city', displayName: 'city', type: 'string' },
    { name: 'country', displayName: 'country', type: 'string' },
    { name: 'preferredLanguage', displayName: 'preferredLanguage', type: 'string' },
    { name: 'profilePicture', displayName: 'profilePicture', type: 'string' },
    { name: 'tags', displayName: 'tags', type: 'array' },
    { name: 'type', displayName: 'type', type: 'string' },
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
      displayName: attr.name, // Show just the custom attribute name, not the prefix
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
