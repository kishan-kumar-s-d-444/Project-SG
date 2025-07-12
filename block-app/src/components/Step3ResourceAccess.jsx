import React, { useState } from 'react';
import { Download, Radio, ArrowLeft, SkipForward, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const Step3ResourceAccess = ({ 
  mode, 
  token, 
  sessionId,
  onBack, 
  onSkip 
}) => {
  const [filename, setFilename] = useState('latest_update');
  const [version, setVersion] = useState('1');
  const [selectedScope, setSelectedScope] = useState('engine_start');
  const [telemetryData, setTelemetryData] = useState(null);
  const [fileDownloadResult, setFileDownloadResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const scopes = [
    { value: 'engine_start', label: 'Engine Start', icon: '🚗' },
    { value: 'door_unlock', label: 'Door Unlock', icon: '🔓' },
    { value: 'climate_control', label: 'Climate Control', icon: '🌡️' },
    { value: 'battery_status', label: 'Battery Status', icon: '🔋' }
  ];

  const handleRequestTelemetry = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/resource/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          scope: selectedScope
        })
      });

      const data = await response.json();

      if (data.success) {
        setTelemetryData(data.data);
      } else {
        setError(data.error || 'Failed to fetch telemetry data');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/resource/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          filename: filename,
          version: version
        })
      });

      const data = await response.json();

      if (data.success) {
        setFileDownloadResult(data.file_path);
      } else {
        setError(data.error || 'Failed to download file');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Radio className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Resource Access</h2>
            <p className="text-gray-600">Access protected resources using your validated token</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Token Display */}
          <div className="mb-8">
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Current Access Token</span>
                <span className="text-xs text-gray-500">Click to expand</span>
              </div>
              <details className="group">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {token ? `${token.substring(0, 50)}...` : 'No token available'}
                </summary>
                <div className="mt-2 p-3 bg-white rounded border text-xs font-mono text-gray-700 break-all">
                  {token}
                </div>
              </details>
            </div>
          </div>

          {/* Mode-specific content */}
          {mode === '1' ? (
            <div className="space-y-6">
              {/* Telemetry Section */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Radio className="w-5 h-5 mr-2 text-blue-600" />
                  Vehicle Telemetry Data
                </h3>
                
                {/* Scope Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Data Scope
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {scopes.map((scope) => (
                      <label key={scope.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="scope"
                          value={scope.value}
                          checked={selectedScope === scope.value}
                          onChange={(e) => setSelectedScope(e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {scope.icon} {scope.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleRequestTelemetry}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Radio className="w-5 h-5" />
                  )}
                  <span>{loading ? 'Requesting...' : 'Request Telemetry Data'}</span>
                </button>

                {/* Telemetry Results */}
                {telemetryData && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center space-x-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Telemetry data received successfully!</span>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">Raw Data Response</h4>
                      <pre className="text-sm text-gray-700 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(telemetryData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Download Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Download className="w-5 h-5 mr-2 text-green-600" />
                  File Download
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filename
                    </label>
                    <input
                      type="text"
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                      placeholder="Enter filename"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Version
                    </label>
                    <input
                      type="text"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="Enter version"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  onClick={handleDownloadFile}
                  disabled={loading || !filename.trim()}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-medium py-3 px-6 rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  <span>{loading ? 'Downloading...' : 'Download File'}</span>
                </button>

                {/* Download Results */}
                {fileDownloadResult && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center space-x-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">File downloaded successfully!</span>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">File Location</h4>
                      <p className="text-sm text-gray-700 font-mono bg-gray-50 p-2 rounded">
                        {fileDownloadResult}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex space-x-3">
              <button
                onClick={onSkip}
                className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                <span>Skip to Complete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3ResourceAccess;