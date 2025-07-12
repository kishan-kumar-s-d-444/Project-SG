import React, { useState, useEffect } from 'react';

const Step1ClientConfig = ({ sessionId, onNext, setConfig, config, onSessionCreate }) => {
  const [clientId, setClientId] = useState(config?.clientId || 'tesla_models_3');
  const [clientSecret, setClientSecret] = useState(config?.clientSecret || 'tesla_secret_3');
  const [authServer, setAuthServer] = useState(config?.authServer || 'http://localhost:5001');
  const [resourceServer, setResourceServer] = useState(config?.resourceServer || 'http://localhost:5002');
  const [mode, setMode] = useState(config?.mode || '1');
  const [scopes, setScopes] = useState(config?.scopes || ['engine_start', 'door_unlock']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);

  // Create session on component mount if no session exists
  useEffect(() => {
    if (!currentSessionId) {
      createSession();
    }
  }, []);

  const createSession = async () => {
    setCreatingSession(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setCurrentSessionId(data.session_id);
        if (onSessionCreate) {
          onSessionCreate(data.session_id);
        }
      } else {
        setError(`❌ Session creation failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Session creation error:', err);
      setError('🚨 Server error while creating session. Please try again.');
    } finally {
      setCreatingSession(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentSessionId) {
      setError('❌ No session available. Please wait for session creation.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          session_id: currentSessionId,
          client_id: clientId,
          client_secret: clientSecret,
          auth_server: authServer,
          resource_server: resourceServer,
          mode: mode,
          scopes: scopes
        })
      });

      const data = await response.json();

      if (data.success) {
        const configData = {
          clientId,
          clientSecret,
          authServer,
          resourceServer,
          mode,
          scopes,
          authCode: data.auth_code,
          config: data.config
        };
        setConfig(configData);
        onNext(configData);
      } else {
        setError(`❌ ${data.error || 'Configuration failed'}`);
        if (data.traceback) {
          console.error('Server traceback:', data.traceback);
        }
      }
    } catch (err) {
      console.error('Configuration error:', err);
      setError('🚨 Server error while configuring client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScopeChange = (scope) => {
    setScopes(prev => 
      prev.includes(scope) 
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  const handleRetrySession = () => {
    setCurrentSessionId(null);
    createSession();
  };

  // Show session creation loading state
  if (creatingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full mb-4 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Creating Session...
          </h2>
          <p className="text-gray-600">
            Initializing your secure session
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 transform hover:scale-105 transition-all duration-300">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full mb-4 shadow-lg">
              <span className="text-2xl">🚀</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Client Configuration
            </h2>
            <p className="text-gray-600">
              Set up your OAuth client credentials and preferences
            </p>
          </div>

          {/* Session Status */}
          {currentSessionId && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-green-700 text-sm font-medium">
                    Session Active: {currentSessionId.substring(0, 8)}...
                  </span>
                </div>
                <button
                  onClick={handleRetrySession}
                  className="text-green-600 hover:text-green-800 text-sm underline"
                >
                  New Session
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">❌</span>
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
                {!currentSessionId && (
                  <button
                    onClick={createSession}
                    className="text-red-600 hover:text-red-800 text-sm underline"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Configuration starts here */}
          <div>
            {/* Main Configuration Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
                    Client ID
                  </label>
                  <div className="relative">
                    <input
                      id="clientId"
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full px-4 py-3 bg-white/70 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-300"
                      required
                      disabled={loading || !currentSessionId}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <span className="text-gray-400">🆔</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="authServer" className="block text-sm font-medium text-gray-700 mb-2">
                    Authorization Server URL
                  </label>
                  <div className="relative">
                    <input
                      id="authServer"
                      type="url"
                      value={authServer}
                      onChange={(e) => setAuthServer(e.target.value)}
                      className="w-full px-4 py-3 bg-white/70 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-300"
                      required
                      disabled={loading || !currentSessionId}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <span className="text-gray-400">🔐</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 mb-2">
                    Client Secret
                  </label>
                  <div className="relative">
                    <input
                      id="clientSecret"
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      className="w-full px-4 py-3 bg-white/70 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-300"
                      required
                      disabled={loading || !currentSessionId}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <span className="text-gray-400">🔑</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="resourceServer" className="block text-sm font-medium text-gray-700 mb-2">
                    Resource Server URL
                  </label>
                  <div className="relative">
                    <input
                      id="resourceServer"
                      type="url"
                      value={resourceServer}
                      onChange={(e) => setResourceServer(e.target.value)}
                      className="w-full px-4 py-3 bg-white/70 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-300"
                      required
                      disabled={loading || !currentSessionId}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <span className="text-gray-400">🌐</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Access Mode Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Access Mode</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  mode === '1' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 bg-white/50 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="mode"
                    value="1"
                    checked={mode === '1'}
                    onChange={() => setMode('1')}
                    className="sr-only"
                    disabled={loading || !currentSessionId}
                  />
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      mode === '1' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                    }`}>
                      {mode === '1' && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                    </div>
                    <span className="text-2xl mr-3">📊</span>
                    <div>
                      <div className="font-medium text-gray-800">Telemetry Data</div>
                      <div className="text-sm text-gray-500">Access vehicle telemetry and sensor data</div>
                    </div>
                  </div>
                </label>

                <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  mode === '2' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 bg-white/50 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="mode"
                    value="2"
                    checked={mode === '2'}
                    onChange={() => setMode('2')}
                    className="sr-only"
                    disabled={loading || !currentSessionId}
                  />
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      mode === '2' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                    }`}>
                      {mode === '2' && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                    </div>
                    <span className="text-2xl mr-3">📥</span>
                    <div>
                      <div className="font-medium text-gray-800">File Download</div>
                      <div className="text-sm text-gray-500">Download files and updates</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Scopes Selection */}
            {mode === '1' ? (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Scopes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['engine_start', 'door_unlock'].map((scope) => (
                    <label key={scope} className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      scopes.includes(scope) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-white/50 hover:border-gray-300'
                    }`}>
                      <input
                        type="checkbox"
                        checked={scopes.includes(scope)}
                        onChange={() => handleScopeChange(scope)}
                        className="sr-only"
                        disabled={loading || !currentSessionId}
                      />
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
                          scopes.includes(scope) ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                          {scopes.includes(scope) && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className="text-xl mr-3">
                          {scope === 'engine_start' ? '🚗' : '🔓'}
                        </span>
                        <div>
                          <div className="font-medium text-gray-800 capitalize">
                            {scope.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {scope === 'engine_start' ? 'Start and stop the engine' : 'Lock and unlock doors'}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-8">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📥</span>
                    <div>
                      <div className="font-medium text-blue-800">File Download Mode Selected</div>
                      <div className="text-sm text-blue-600">Using file_download scope automatically</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !currentSessionId}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 shadow-lg ${
                loading || !currentSessionId
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 shadow-purple-500/25'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                  Initializing Authorization...
                </div>
              ) : !currentSessionId ? (
                '⏳ Waiting for Session...'
              ) : (
                '🚀 Initialize Authorization'
              )}
            </button>

            {/* Progress Indicator */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Step 1 of 4</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1ClientConfig;