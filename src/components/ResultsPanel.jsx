import { useState } from 'react';

/**
 * Results panel for displaying API test results
 */
export default function ResultsPanel({
  result,
  isLoading,
  onTestQuery,
  canTest
}) {
  const [showFullResponse, setShowFullResponse] = useState(false);

  return (
    <div className="results-panel">
      <div className="results-header">
        <h2>Test Query</h2>
        <button
          className="btn btn-primary"
          onClick={onTestQuery}
          disabled={!canTest || isLoading}
        >
          {isLoading ? '⏳ Testing...' : '▶️ Test Query'}
        </button>
      </div>

      {!canTest && !result && (
        <div className="empty-state">
          <p>Add filter conditions and load attributes to test your query</p>
        </div>
      )}

      {result && (
        <div className={`result-container ${result.success ? 'success' : 'error'}`}>
          <div className="result-status-compact">
            <span className={`status-badge-compact ${result.success ? 'success' : 'error'}`}>
              {result.status} {result.statusText}
            </span>
            <span className="response-time-compact">⏱️ {result.responseTime}ms</span>
          </div>

          {result.error && (
            <div className="error-message-compact">
              <strong>Error:</strong> {result.error}
            </div>
          )}

          {result.data && (
            <div className="result-data-compact">
              {result.success && result.data.persons && (
                <div className="result-summary-compact">
                  <strong>
                    {result.data.totalCount !== undefined ? (
                      <>
                        Found {result.data.totalCount} matching profile(s)
                        {result.data.persons.length < result.data.totalCount && (
                          <span className="pagination-hint">
                            {' '}(showing {result.data.persons.length} on this page)
                          </span>
                        )}
                      </>
                    ) : (
                      <>Found {result.data.persons.length} profile(s)</>
                    )}
                  </strong>
                </div>
              )}

              <button
                className="btn-text-toggle"
                onClick={() => setShowFullResponse(!showFullResponse)}
              >
                {showFullResponse ? '▼ Hide full response' : '▶ Show full response'}
              </button>

              {showFullResponse && (
                <pre className="json-output-collapsible">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
