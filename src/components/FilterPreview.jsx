import { useState } from 'react';

/**
 * Preview component showing raw and encoded filter strings with tab interface
 */
export default function FilterPreview({ rawFilter, encodedFilter, baseUrl, apiKey }) {
  const [activeTab, setActiveTab] = useState('raw');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const hasFilter = rawFilter && rawFilter.length > 0;

  const getTabContent = () => {
    switch (activeTab) {
      case 'raw':
        return {
          label: 'Raw JSON',
          hint: 'The filter as a JSON object',
          content: rawFilter,
        };
      case 'encoded':
        return {
          label: 'URL Encoded',
          hint: 'Use this as the filter parameter value',
          content: encodedFilter,
        };
      case 'api':
        return {
          label: 'API Example',
          hint: 'Full API request example',
          content: `GET /people/2/persons?includeTotalCount=true&filter=${encodedFilter}\nAuthorization: App YOUR_API_KEY`,
          isMultiline: true,
        };
      case 'curl':
        const curlBaseUrl = baseUrl || 'https://your-base-url.api.infobip.com';
        const curlApiKey = apiKey || 'YOUR_API_KEY';
        return {
          label: 'cURL',
          hint: 'Ready-to-execute curl command',
          content: `curl -X GET "${curlBaseUrl}/people/2/persons?includeTotalCount=true&filter=${encodedFilter}" \\\n  -H "Authorization: App ${curlApiKey}"`,
          isMultiline: true,
        };
      default:
        return null;
    }
  };

  const currentTab = getTabContent();

  return (
    <div className="filter-preview">
      <h2>Filter Preview</h2>

      {!hasFilter ? (
        <div className="empty-state">
          <p>No filter conditions yet. Add conditions above to see the preview.</p>
        </div>
      ) : (
        <>
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'raw' ? 'active' : ''}`}
              onClick={() => setActiveTab('raw')}
            >
              Raw JSON
            </button>
            <button
              className={`tab ${activeTab === 'encoded' ? 'active' : ''}`}
              onClick={() => setActiveTab('encoded')}
            >
              URL Encoded
            </button>
            <button
              className={`tab ${activeTab === 'api' ? 'active' : ''}`}
              onClick={() => setActiveTab('api')}
            >
              API Example
            </button>
            <button
              className={`tab ${activeTab === 'curl' ? 'active' : ''}`}
              onClick={() => setActiveTab('curl')}
            >
              cURL
            </button>
          </div>

          <div className="tab-content">
            <div className="tab-content-header">
              <span className="tab-hint">{currentTab.hint}</span>
              <button
                className="btn btn-small btn-copy"
                onClick={() => copyToClipboard(currentTab.content)}
                aria-label={`Copy ${currentTab.label.toLowerCase()}`}
              >
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
            <div className="code-block">
              <code className={currentTab.isMultiline ? 'multiline' : ''}>
                {currentTab.content}
              </code>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
