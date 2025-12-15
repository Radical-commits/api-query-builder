import { useState } from 'react';

/**
 * Configuration section for API credentials and attribute loading
 */
export default function ConfigSection({
  baseUrl,
  setBaseUrl,
  apiKey,
  setApiKey,
  onLoadAttributes,
  isLoading,
  attributesLoaded
}) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const canLoadAttributes = baseUrl && apiKey && !isLoading;

  return (
    <div className="config-section">
      <div className="section-header">
        <h2>Configuration</h2>
        {attributesLoaded && (
          <span className="section-badge success">✓ Connected</span>
        )}
      </div>

      <div className="config-warning">
        ⚠️ API key stored in browser memory only
      </div>

      <div className="config-form-horizontal">
        <div className="form-group">
          <label htmlFor="baseUrl">Base URL</label>
          <input
            id="baseUrl"
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.infobip.com"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="apiKey">API Key</label>
          <div className="api-key-input-group">
            <input
              id="apiKey"
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              disabled={isLoading}
            />
            <button
              type="button"
              className="btn-toggle-visibility"
              onClick={() => setShowApiKey(!showApiKey)}
              disabled={isLoading}
              aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={onLoadAttributes}
          disabled={!canLoadAttributes}
        >
          {isLoading ? 'Loading...' : 'Connect'}
        </button>
      </div>

      {showHelp && (
        <div className="config-help">
          <h4>Getting Started:</h4>
          <ol>
            <li>Enter your Infobip API base URL (default: https://api.infobip.com)</li>
            <li>Enter your API key (get it from your Infobip account)</li>
            <li>Click "Connect" to fetch available profile fields from your account</li>
            <li>Start building filter queries using the visual builder below</li>
          </ol>
        </div>
      )}

      <button
        className="btn-text"
        onClick={() => setShowHelp(!showHelp)}
      >
        {showHelp ? 'Hide' : 'Show'} setup instructions
      </button>
    </div>
  );
}
