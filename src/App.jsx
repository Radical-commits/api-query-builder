import { useState } from 'react';
import ConfigSection from './components/ConfigSection';
import FilterBuilder from './components/FilterBuilder';
import FilterPreview from './components/FilterPreview';
import ResultsPanel from './components/ResultsPanel';
import { fetchAllAttributes } from './utils/attributeFetcher';
import { buildAndEncodeFilter } from './utils/filterEncoder';
import { testFilterQuery, validateApiConfig } from './utils/apiClient';
import './App.css';

function App() {
  // Configuration state
  const [baseUrl, setBaseUrl] = useState('https://api.infobip.com');
  const [apiKey, setApiKey] = useState('');

  // Attributes state
  const [attributes, setAttributes] = useState([]);
  const [attributesLoaded, setAttributesLoaded] = useState(false);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [attributeError, setAttributeError] = useState(null);

  // Filter conditions state
  const [conditions, setConditions] = useState([]);
  const [filterLogic, setFilterLogic] = useState('and'); // 'and' or 'or'

  // API test results state
  const [testResult, setTestResult] = useState(null);
  const [isTestingQuery, setIsTestingQuery] = useState(false);

  /**
   * Load attributes from Infobip API
   */
  const handleLoadAttributes = async () => {
    // Validate configuration
    const validation = validateApiConfig(baseUrl, apiKey);
    if (!validation.isValid) {
      alert(`Configuration errors:\n${validation.errors.join('\n')}`);
      return;
    }

    setIsLoadingAttributes(true);
    setAttributeError(null);

    try {
      const result = await fetchAllAttributes(baseUrl, apiKey);

      setAttributes(result.attributes);
      setAttributesLoaded(true);

      // Show warning if some attributes failed to load
      if (result.errors) {
        setAttributeError(`Partial success: ${result.errors.join('; ')}`);
      }
    } catch (error) {
      setAttributeError(error.message);
      setAttributesLoaded(false);
    } finally {
      setIsLoadingAttributes(false);
    }
  };

  /**
   * Test the constructed filter query
   */
  const handleTestQuery = async () => {
    // Validate configuration
    const validation = validateApiConfig(baseUrl, apiKey);
    if (!validation.isValid) {
      alert(`Configuration errors:\n${validation.errors.join('\n')}`);
      return;
    }

    setIsTestingQuery(true);
    setTestResult(null);

    try {
      const { encoded } = buildAndEncodeFilter(conditions, filterLogic);
      const result = await testFilterQuery(baseUrl, apiKey, encoded);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        status: 0,
        statusText: 'Error',
        data: null,
        responseTime: 0,
        error: error.message,
      });
    } finally {
      setIsTestingQuery(false);
    }
  };

  // Calculate filter preview
  const { raw: rawFilter, encoded: encodedFilter } = buildAndEncodeFilter(conditions, filterLogic);

  // Determine if user can test query
  const canTestQuery = attributesLoaded && conditions.length > 0 && rawFilter.length > 0;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Infobip API Filter Builder</h1>
            <p className="app-subtitle">
              Visual builder for GET person API filter queries
            </p>
          </div>
          {attributesLoaded && (
            <div className="status-indicator">
              <span className="status-dot"></span>
              Connected
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        <div className="column-left">
          {/* Configuration Section */}
          <ConfigSection
            baseUrl={baseUrl}
            setBaseUrl={setBaseUrl}
            apiKey={apiKey}
            setApiKey={setApiKey}
            onLoadAttributes={handleLoadAttributes}
            isLoading={isLoadingAttributes}
            attributesLoaded={attributesLoaded}
          />

          {attributeError && (
            <div className="error-banner">
              <strong>⚠️ Warning:</strong> {attributeError}
            </div>
          )}

          {/* Filter Builder */}
          <FilterBuilder
            attributes={attributes}
            conditions={conditions}
            setConditions={setConditions}
            filterLogic={filterLogic}
            setFilterLogic={setFilterLogic}
            attributesLoaded={attributesLoaded}
          />
        </div>

        <div className="column-right">
          {attributesLoaded && (
            <>
              {/* Filter Preview */}
              <FilterPreview rawFilter={rawFilter} encodedFilter={encodedFilter} />

              {/* Results Panel */}
              <ResultsPanel
                result={testResult}
                isLoading={isTestingQuery}
                onTestQuery={handleTestQuery}
                canTest={canTestQuery}
              />
            </>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Need help? Check the{' '}
          <a
            href="https://www.infobip.com/docs/api/customer-engagement/people/person-profile/get-a-single-person-or-a-list-of-people"
            target="_blank"
            rel="noopener noreferrer"
          >
            API documentation
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
