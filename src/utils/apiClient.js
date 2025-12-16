/**
 * API client for testing filter queries against Infobip API
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
 * Tests a filter query against the Infobip GET person API
 * @param {string} baseUrl - Base API URL
 * @param {string} apiKey - API authentication key
 * @param {string} encodedFilter - URL-encoded filter string
 * @returns {Promise<Object>} Response object with status, data, time, and any errors
 */
export async function testFilterQuery(baseUrl, apiKey, encodedFilter) {
  const startTime = performance.now();

  try {
    // Construct the full URL with filter parameter and includeTotalCount
    let url = `${baseUrl}/people/2/persons?includeTotalCount=true`;
    if (encodedFilter) {
      url += `&filter=${encodedFilter}`;
    }

    const cleanApiKey = sanitizeApiKey(apiKey);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `App ${cleanApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
      responseTime,
      error: response.ok ? null : parseErrorMessage(data),
    };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    return {
      success: false,
      status: 0,
      statusText: 'Network Error',
      data: null,
      responseTime,
      error: `Network error: ${error.message}. This might be a CORS issue - check browser console.`,
    };
  }
}

/**
 * Parses error message from API response
 * @param {Object} errorData - Error response data from API
 * @returns {string} Human-readable error message
 */
function parseErrorMessage(errorData) {
  // Handle Infobip-specific error format
  if (errorData.requestError) {
    const { serviceException } = errorData.requestError;
    if (serviceException) {
      const { messageId, text } = serviceException;
      return `${text} (Error code: ${messageId})`;
    }
  }

  // Handle generic error structure
  if (errorData.message) {
    return errorData.message;
  }

  if (errorData.error) {
    return errorData.error;
  }

  // Provide helpful messages for common HTTP status codes
  return 'Request failed. Please check your filter syntax and API credentials.';
}

/**
 * Validates API configuration before making requests
 * @param {string} baseUrl - Base API URL
 * @param {string} apiKey - API authentication key
 * @returns {Object} Validation result with isValid flag and error message
 */
export function validateApiConfig(baseUrl, apiKey) {
  const errors = [];

  if (!baseUrl || baseUrl.trim() === '') {
    errors.push('Base URL is required');
  } else {
    try {
      new URL(baseUrl);
    } catch (e) {
      errors.push('Base URL must be a valid URL');
    }
  }

  if (!apiKey || apiKey.trim() === '') {
    errors.push('API Key is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
