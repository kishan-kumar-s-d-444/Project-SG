import React, { useState } from 'react';

const Step2_5TokenValidation = ({ 
  token, 
  sessionId,
  onValidateToken, 
  onBack, 
  validationResult, 
  onProceed, 
  onValidateAgain,
  backendUrl = 'http://localhost:8000' // Replace with your backend URL
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [validationDetails, setValidationDetails] = useState(null);

const handleValidateToken = async () => {
  setIsLoading(true);
  setErrorDetails(null);
  setValidationDetails(null);

  try {
    const response = await fetch(`${backendUrl}/api/token/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        token: token,
        session_id: sessionId  // ✅ Include sessionId here
      })
    });

    const data = await response.json();

    if (response.ok) {
      setValidationDetails(data);
      onValidateToken(true, data);
    } else {
      setErrorDetails(data.error || 'Validation failed');
      onValidateToken(false, data);
    }
  } catch (error) {
    setErrorDetails(`Network error: ${error.message}`);
    onValidateToken(false, { error: error.message });
  } finally {
    setIsLoading(false);
  }
};


  const handleValidateAgain = async () => {
    setValidationDetails(null);
    setErrorDetails(null);
    await handleValidateToken();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Token Validation
          </h2>
          <p className="text-gray-600">Step 2.5: Verify your token with the resource server</p>
        </div>

        {/* Token Display */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Generated Token:
          </label>
          <div className="relative">
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto border">
              {token}
            </pre>
            <div className="absolute top-2 right-2">
              <button
                onClick={() => navigator.clipboard.writeText(token)}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title="Copy token"
              >
                📋
              </button>
            </div>
          </div>
        </div>

        {/* Validation Status */}
        <div className="mb-8">
          {validationResult === null && !isLoading && (
            <button
              onClick={handleValidateToken}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span className="flex items-center justify-center space-x-2">
                <span>🚀</span>
                <span>Send Token to Resource Server</span>
              </span>
            </button>
          )}

          {isLoading && (
            <div className="flex items-center justify-center space-x-3 py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-blue-600 font-medium">Validating token...</span>
            </div>
          )}

          {validationResult === true && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <span className="text-3xl">✅</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    Token Successfully Validated!
                  </h3>
                  <p className="text-green-600">
                    Your token has been verified by the resource server.
                  </p>
                </div>
              </div>
              {validationDetails && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-green-700 hover:text-green-800 font-medium">
                    View validation details
                  </summary>
                  <pre className="mt-2 bg-green-100 p-3 rounded text-xs overflow-x-auto text-green-800">
                    {JSON.stringify(validationDetails, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          {validationResult === false && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <span className="text-3xl">❌</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800">
                    Token Validation Failed!
                  </h3>
                  <p className="text-red-600">
                    The resource server rejected your token.
                  </p>
                </div>
              </div>
              {errorDetails && (
                <div className="mt-4 p-3 bg-red-100 rounded text-sm text-red-700">
                  <strong>Error Details:</strong> {errorDetails}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          {validationResult === true && (
            <>
              <button
                onClick={onProceed}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <span className="flex items-center space-x-2">
                  <span>▶️</span>
                  <span>Proceed to Nonce Reception</span>
                </span>
              </button>
              <button
                onClick={handleValidateAgain}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <span className="flex items-center space-x-2">
                  <span>🔄</span>
                  <span>Validate Again</span>
                </span>
              </button>
            </>
          )}

          {validationResult === false && (
            <button
              onClick={handleValidateToken}
              disabled={isLoading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-300 disabled:to-orange-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span className="flex items-center space-x-2">
                <span>🔄</span>
                <span>Retry Validation</span>
              </span>
            </button>
          )}

          <button
            onClick={onBack}
            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <span className="flex items-center space-x-2">
              <span>⬅️</span>
              <span>Back to Token Generation</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step2_5TokenValidation;