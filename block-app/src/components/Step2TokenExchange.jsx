import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, Key } from 'lucide-react';

const Step2TokenExchange = ({ 
  sessionId, 
  onGenerateToken, 
  onTokenValidated,
  error, 
  isLoading = false 
}) => {
  const [tokenData, setTokenData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [localError, setLocalError] = useState('');

  const handleGenerateToken = async () => {
    if (!sessionId) {
      setLocalError('No session ID available');
      return;
    }

    setIsGenerating(true);
    setLocalError('');
    setTokenData(null);

    try {
      const response = await fetch('http://localhost:8000/api/token/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId
        })
      });

      const data = await response.json();

      if (data.success) {
        setTokenData({
          token: data.token,
          step: data.step,
          message: data.message
        });
        
        // Call the parent callback
        if (onGenerateToken) {
          onGenerateToken(data.token);
        }
      } else {
        setLocalError(data.error || 'Token generation failed');
      }
    } catch (err) {
      setLocalError(`Network error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleValidateToken = async () => {
    if (!sessionId || !tokenData?.token) {
      setLocalError('No token available to validate');
      return;
    }

    setIsValidating(true);
    setLocalError('');
    setValidationResult(null);

    try {
      const response = await fetch('http://localhost:8000/api/token/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId
        })
      });

      const data = await response.json();

      if (data.success) {
        setValidationResult({
          isValid: true,
          message: data.message,
          step: data.step,
          tokenDetails: data.token_details
        });
        
        // Call the parent callback
        if (onTokenValidated) {
          onTokenValidated(true, data);
        }
      } else {
        setValidationResult({
          isValid: false,
          message: data.error || 'Token validation failed'
        });
        
        if (onTokenValidated) {
          onTokenValidated(false, data);
        }
      }
    } catch (err) {
      const errorMsg = `Network error: ${err.message}`;
      setValidationResult({
        isValid: false,
        message: errorMsg
      });
      
      if (onTokenValidated) {
        onTokenValidated(false, { error: errorMsg });
      }
    } finally {
      setIsValidating(false);
    }
  };

  const displayError = error || localError;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
          <Key className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Step 2: Token Exchange</h3>
          <p className="text-sm text-gray-600">Generate and validate your access token</p>
        </div>
      </div>

      {/* Error Display */}
      {displayError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-red-700 text-sm">{displayError}</span>
        </div>
      )}

      {/* Token Generation Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Access Token</span>
          <button
            onClick={handleGenerateToken}
            disabled={isGenerating || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                Generate Token
              </>
            )}
          </button>
        </div>

        {/* Token Display */}
        {tokenData && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-700">Token Generated Successfully</span>
            </div>
            <div className="text-xs text-gray-600 mb-2">
              <span className="font-medium">Token:</span>
            </div>
            <div className="bg-white p-2 rounded border text-xs font-mono break-all text-gray-800">
              {tokenData.token}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {tokenData.message}
            </div>
          </div>
        )}

        {/* Token Validation Section */}
        {tokenData && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Token Validation</span>
              <button
                onClick={handleValidateToken}
                disabled={isValidating || !tokenData.token}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Validate Token
                  </>
                )}
              </button>
            </div>

            {/* Validation Result */}
            {validationResult && (
              <div className={`p-3 rounded-lg border ${
                validationResult.isValid 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {validationResult.isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    validationResult.isValid ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {validationResult.isValid ? 'Token Valid' : 'Token Invalid'}
                  </span>
                </div>
                <div className={`text-xs ${
                  validationResult.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validationResult.message}
                </div>
                
                {/* Token Details */}
                {validationResult.tokenDetails && (
                  <div className="mt-3 p-2 bg-white rounded border">
                    <div className="text-xs font-medium text-gray-700 mb-1">Token Details:</div>
                    <div className="text-xs text-gray-600 font-mono">
                      {JSON.stringify(validationResult.tokenDetails, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Session Info */}
      {sessionId && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <span className="font-medium">Session ID:</span> {sessionId}
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2TokenExchange;