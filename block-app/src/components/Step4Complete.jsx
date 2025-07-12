import React, { useState, useEffect } from 'react';

const Step4Complete = ({ 
  sessionId, 
  onRestart, 
  onViewResults, 
  mode, 
  lastData, 
  clientId,
  apiBaseUrl = 'http://localhost:8000' 
}) => {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Fetch session data on component mount
  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  const fetchSessionData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/session/${sessionId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSessionData(data.session_data);
      } else {
        setError(data.error || 'Failed to fetch session data');
      }
    } catch (err) {
      setError(`Error fetching session data: ${err.message}`);
      console.error('Error fetching session data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Reset the current session
      const resetResponse = await fetch(`${apiBaseUrl}/api/session/${sessionId}/reset`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!resetResponse.ok) {
        throw new Error(`HTTP error! status: ${resetResponse.status}`);
      }

      const resetData = await resetResponse.json();
      
      if (resetData.success) {
        // Call the parent's onRestart function
        onRestart();
      } else {
        setError(resetData.error || 'Failed to reset session');
      }
    } catch (err) {
      setError(`Error resetting session: ${err.message}`);
      console.error('Error resetting session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = () => {
    setShowResults(!showResults);
    if (onViewResults) {
      onViewResults();
    }
  };

  const handleCleanupSessions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/sessions/cleanup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ ${data.message}`);
      } else {
        setError(data.error || 'Failed to cleanup sessions');
      }
    } catch (err) {
      setError(`Error cleaning up sessions: ${err.message}`);
      console.error('Error cleaning up sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString();
    } catch (err) {
      return timestamp;
    }
  };

  const getStepDescription = (step) => {
    const steps = {
      1: 'Initial Configuration',
      1.5: 'Authorization Code Received',
      2: 'Authorization Code Validated',
      2.5: 'Access Token Generated',
      2.75: 'Token Validated',
      2.8: 'Nonce Requested',
      3: 'Nonce Signed',
      4: 'Resource Access Complete'
    };
    return steps[step] || `Step ${step}`;
  };

  return (
    <div className="step-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', color: '#1976d2', marginBottom: '20px' }}>
        🏁 Process Complete
      </h2>
      
      {/* F1 Car Animation */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        overflow: 'hidden',
        position: 'relative',
        height: '100px'
      }}>
        <div 
          className="f1-car" 
          style={{ 
            fontSize: '80px', 
            animation: 'drive 3s linear infinite', 
            whiteSpace: 'nowrap',
            position: 'absolute',
            left: '-100px'
          }}
        >
          🏎️
        </div>
      </div>

      {/* Success Message */}
      <div style={{ 
        background: '#1976d2', 
        color: 'white', 
        borderRadius: '8px', 
        margin: '20px 0', 
        textAlign: 'center', 
        fontWeight: 'bold', 
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        🎉 All operations completed successfully!
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          background: '#f44336', 
          color: 'white', 
          borderRadius: '8px', 
          padding: '15px', 
          margin: '10px 0',
          wordBreak: 'break-word'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Session Summary */}
      <details style={{ marginTop: '20px', marginBottom: '20px' }}>
        <summary style={{ cursor: 'pointer', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
          📋 Session Summary
        </summary>
        <div style={{ padding: '15px', background: '#fafafa', borderRadius: '0 0 4px 4px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              🔄 Loading session data...
            </div>
          ) : sessionData ? (
            <div>
              <p><strong>Session ID:</strong> {sessionId}</p>
              <p><strong>Current Step:</strong> {sessionData.step} - {getStepDescription(sessionData.step)}</p>
              <p><strong>Created:</strong> {formatTimestamp(sessionData.created_at)}</p>
              <p><strong>Last Activity:</strong> {formatTimestamp(sessionData.last_activity)}</p>
              {sessionData.client_config && (
                <div>
                  <p><strong>Client ID:</strong> {sessionData.client_config.client_id}</p>
                  <p><strong>Mode:</strong> {sessionData.client_config.mode === '1' ? 'Telemetry' : 'File Download'}</p>
                  <p><strong>Scopes:</strong> {sessionData.client_config.scopes?.join(', ')}</p>
                </div>
              )}
              <ul style={{ marginTop: '10px' }}>
                <li style={{ color: sessionData.step >= 1.5 ? '#4caf50' : '#999' }}>
                  {sessionData.step >= 1.5 ? '✅' : '⏳'} Client Configuration
                </li>
                <li style={{ color: sessionData.step >= 2 ? '#4caf50' : '#999' }}>
                  {sessionData.step >= 2 ? '✅' : '⏳'} Authorization Code Validation
                </li>
                <li style={{ color: sessionData.step >= 2.5 ? '#4caf50' : '#999' }}>
                  {sessionData.step >= 2.5 ? '✅' : '⏳'} Token Generation
                </li>
                <li style={{ color: sessionData.step >= 2.75 ? '#4caf50' : '#999' }}>
                  {sessionData.step >= 2.75 ? '✅' : '⏳'} Token Validation
                </li>
                <li style={{ color: sessionData.step >= 3 ? '#4caf50' : '#999' }}>
                  {sessionData.step >= 3 ? '✅' : '⏳'} Blockchain Authentication
                </li>
                <li style={{ color: sessionData.step >= 4 ? '#4caf50' : '#999' }}>
                  {sessionData.step >= 4 ? '✅' : '⏳'} Resource Access
                </li>
              </ul>
            </div>
          ) : (
            <p>No session data available</p>
          )}
        </div>
      </details>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button 
          style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: '#1976d2', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
          onClick={handleRestart}
          disabled={loading}
        >
          {loading ? '🔄 Processing...' : '🔄 Start New Session'}
        </button>
        
        <button 
          style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: '#4caf50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onClick={handleViewResults}
        >
          📊 {showResults ? 'Hide' : 'View'} Results
        </button>

        <button 
          style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: '#ff9800', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
          onClick={handleCleanupSessions}
          disabled={loading}
        >
          🧹 Cleanup Old Sessions
        </button>
      </div>

      {/* Results Display */}
      {showResults && (
        <div style={{ marginTop: '20px' }}>
          {mode === '1' && (lastData || sessionData?.last_data) ? (
            <details style={{ marginTop: '15px' }} open>
              <summary style={{ cursor: 'pointer', padding: '10px', background: '#e3f2fd', borderRadius: '4px' }}>
                📊 Last Telemetry Data
              </summary>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '15px', 
                borderRadius: '4px', 
                overflow: 'auto',
                maxHeight: '300px',
                fontSize: '12px'
              }}>
                {JSON.stringify(lastData || sessionData?.last_data, null, 2)}
              </pre>
            </details>
          ) : mode === '2' && (clientId || sessionData?.client_config?.client_id) ? (
            <div style={{ 
              background: '#e8f5e8', 
              padding: '15px', 
              borderRadius: '4px',
              marginTop: '15px'
            }}>
              <h4>📁 File Download Information</h4>
              <p><strong>Downloaded to:</strong> downloads/{clientId || sessionData?.client_config?.client_id}_latest_update.txt</p>
              {sessionData?.downloaded_file && (
                <p><strong>Full path:</strong> {sessionData.downloaded_file}</p>
              )}
            </div>
          ) : (
            <div style={{ 
              background: '#fff3e0', 
              padding: '15px', 
              borderRadius: '4px',
              marginTop: '15px'
            }}>
              <p>No result data available for this session.</p>
            </div>
          )}
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes drive {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(calc(100vw + 100px)); }
        }
        
        .step-container {
          animation: fadeIn 0.5s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          transition: all 0.2s ease;
        }
        
        details summary {
          transition: background-color 0.2s ease;
        }
        
        details summary:hover {
          background-color: #e0e0e0;
        }
      `}</style>
    </div>
  );
};

export default Step4Complete;