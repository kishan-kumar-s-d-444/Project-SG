import React, { useState, useEffect } from 'react';

const Step1_5AuthCode = ({ sessionId, generatedAuthCode, onValidate, onBack, config }) => {
  const [inputAuthCode, setInputAuthCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch session data on component mount
  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    } else {
      setError('❌ No session ID provided. Please go back and start over.');
    }
  }, [sessionId]);

  const fetchSessionData = async () => {
    if (!sessionId) {
      setError('❌ No session ID available');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/session/${sessionId}`, {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        setSessionData(data.session_data);
        setError(''); // Clear any previous errors
      } else {
        setError(`❌ Failed to fetch session: ${data.error}`);
      }
    } catch (err) {
      console.error('Session fetch error:', err);
      setError('🚨 Unable to fetch session data');
    }
  };

  const handleValidate = async () => {
    if (!inputAuthCode.trim()) {
      setError('⚠️ Please enter the authorization code.');
      return;
    }

    if (!sessionId) {
      setError('❌ No session available. Please go back and try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/validate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          session_id: sessionId,
          auth_code: inputAuthCode.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        // Pass the validated code and step info to parent
        onValidate({
          authCode: inputAuthCode.trim(),
          step: data.step,
          sessionId: sessionId
        });
      } else {
        setError(`❌ ${data.error || 'Invalid authorization code!'}`);
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError('🚨 Server error while validating code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleValidate();
    }
  };

  const copyToClipboard = async () => {
    if (generatedAuthCode) {
      try {
        await navigator.clipboard.writeText(generatedAuthCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handlePasteCode = () => {
    if (generatedAuthCode) {
      setInputAuthCode(generatedAuthCode);
    }
  };

  // Show loading state if no session ID
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-orange-600 rounded-full mb-4 shadow-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Session Available</h2>
            <p className="text-gray-600 text-sm mb-6">
              Please go back and create a session first.
            </p>
            <button
              onClick={onBack}
              className="w-full py-3 px-6 rounded-xl font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              ← Back to Configuration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 transform hover:scale-105 transition-all duration-300">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
              <span className="text-2xl">🔑</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Authorization Code Validation
            </h2>
            <p className="text-gray-600 text-sm">
              Enter the authorization code to proceed with {config?.mode === '1' ? 'telemetry access' : 'file download'}
            </p>
          </div>

          {/* Configuration Summary */}
          {config && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
              <div className="text-sm text-purple-800 font-medium mb-2">Configuration Summary:</div>
              <div className="text-xs text-purple-600 space-y-1">
                <div>Client: {config.client_id || config.clientId}</div>
                <div>Mode: {config.mode === '1' ? 'Telemetry Data' : 'File Download'}</div>
                <div>Scopes: {config.scopes?.join(', ')}</div>
              </div>
            </div>
          )}

          {/* Generated Code Display */}
          {generatedAuthCode && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">Generated Code:</span>
                <div className="flex space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="text-green-600 hover:text-green-800 transition-colors"
                    title="Copy to clipboard"
                  >
                    <span className="text-xs">{copySuccess ? '✅' : '📋'}</span>
                  </button>
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="text-green-600 hover:text-green-800 transition-colors"
                  >
                    <span className="text-xs">💡</span>
                  </button>
                </div>
              </div>
              <div className="font-mono text-sm font-bold text-green-700 bg-white/60 p-3 rounded-lg border border-green-200 select-all break-all">
                {generatedAuthCode}
              </div>
              {showHint && (
                <div className="mt-2 text-xs text-green-600 bg-white/40 p-2 rounded-lg border border-green-200">
                  💡 Copy this code and paste it in the input field below, or click the "Auto-Fill" button
                </div>
              )}
              <button
                onClick={handlePasteCode}
                className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
              >
                🔄 Auto-Fill Code
              </button>
            </div>
          )}

          {/* No Generated Code Warning */}
          {!generatedAuthCode && (
            <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
              <div className="flex items-center">
                <span className="text-yellow-600 mr-2">⚠️</span>
                <span className="text-yellow-800 text-sm">No authorization code generated yet. Please go back and configure first.</span>
              </div>
            </div>
          )}

          {/* Input Field */}
          <div className="mb-6">
            <label htmlFor="authCode" className="block text-sm font-medium text-gray-700 mb-2">
              Authorization Code
            </label>
            <div className="relative">
              <textarea
                id="authCode"
                value={inputAuthCode}
                onChange={(e) => setInputAuthCode(e.target.value.trim())}
                onKeyPress={handleKeyPress}
                placeholder="Enter or paste authorization code (e.g., wk0VfdCqnAMTwQSuXdgS4fwvmknQH_kGanRYKRjBmDs)"
                className="w-full px-4 py-3 bg-white/70 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 text-gray-800 placeholder-gray-400 font-mono text-sm resize-none"
                disabled={loading}
                rows={2}
                style={{ minHeight: '60px' }}
              />
              <div className="absolute top-3 right-3 flex items-center">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
            {inputAuthCode && (
              <div className="mt-1 text-xs text-gray-500 text-center">
                {inputAuthCode.length} characters
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">❌</span>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Session Status */}
          {sessionData && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-blue-700 text-sm">
                    Session Step: {sessionData.step}
                  </span>
                </div>
                <span className="text-blue-600 text-xs">
                  {sessionData.last_activity ? new Date(sessionData.last_activity).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleValidate}
              disabled={loading || !inputAuthCode.trim() || !sessionId || !generatedAuthCode}
              className={`w-full py-3 px-6 rounded-xl font-medium text-white transition-all duration-300 transform hover:scale-105 shadow-lg ${
                loading || !inputAuthCode.trim() || !sessionId || !generatedAuthCode
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/25'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Validating Code...
                </div>
              ) : !sessionId ? (
                '⏳ No Session Available'
              ) : !generatedAuthCode ? (
                '⏳ No Code Generated'
              ) : (
                '🔍 Validate Authorization Code'
              )}
            </button>

            <button
              onClick={onBack}
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-md"
            >
              ← Back to Configuration
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Step 1.5 of 4</span>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/20">
            <div className={`w-2 h-2 rounded-full mr-2 ${sessionId ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-600">
              {sessionId ? `Session: ${sessionId.substring(0, 8)}...` : 'No Session'}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 text-center">
          <button
            onClick={fetchSessionData}
            disabled={!sessionId}
            className="text-xs text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
          >
            🔄 Refresh Session Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step1_5AuthCode;