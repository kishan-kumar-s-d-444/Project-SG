import React, { useState, useEffect } from 'react';
import { Shield, FileText, CheckCircle, XCircle, RefreshCw, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

const Step2_8SignNonce = ({ 
  sessionId, 
  nonce, 
  signature, 
  signedMessage, 
  onProceed, 
  onBack, 
  verificationResult,
  onUpdateData
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Helper function to validate nonce
  const isValidNonce = (nonce) => {
    if (nonce === null || nonce === undefined) return false;
    
    // Handle string nonce
    if (typeof nonce === 'string') {
      return nonce.trim() !== '' && nonce !== 'null' && nonce !== 'undefined';
    }
    
    // Handle number nonce
    if (typeof nonce === 'number') {
      return !isNaN(nonce) && isFinite(nonce);
    }
    
    // Handle other types (convert to string and check)
    const nonceStr = String(nonce);
    return nonceStr !== '' && nonceStr !== 'null' && nonceStr !== 'undefined';
  };

  // Debug logging
  console.log('nonce:', nonce);
  console.log('typeof nonce:', typeof nonce);
  console.log('nonce length:', typeof nonce === 'string' ? nonce.length : 'N/A (not string)');
  console.log('nonce as string:', String(nonce));
  console.log('isValidNonce:', isValidNonce(nonce));

  // Sign the nonce
  const handleSignNonce = async () => {
    if (!sessionId) {
      setError('Session ID is required');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:8000/api/nonce/sign', {
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
        setSuccess('Nonce signed successfully!');
        // Update parent component with new data
        if (onUpdateData) {
          onUpdateData({
            signature: data.signature,
            signedMessage: data.message,
            verificationResult: data.verified,
            step: data.step
          });
        }
        
        // Auto-proceed to step 3 if verification is successful
        if (data.verified && onProceed) {
          setTimeout(() => {
            onProceed();
          }, 1500); // Wait 1.5 seconds to show success message
        }
      } else {
        setError(data.error || 'Failed to sign nonce');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign again (reset and re-sign)
  const handleSignAgain = async () => {
    if (onUpdateData) {
      onUpdateData({
        signature: null,
        signedMessage: null,
        verificationResult: null
      });
    }
    await handleSignNonce();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Step 2.8: Sign Nonce</h1>
              <p className="text-gray-600 mt-1">Cryptographically sign the blockchain nonce for authentication</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: '87%' }}></div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-800">Success</h3>
              <p className="text-green-700 mt-1">{success}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {!isValidNonce(nonce) ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Valid Nonce Found</h3>
              <p className="text-gray-600 mb-6">Please go back and request a nonce first.</p>
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Nonce Display */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Current Nonce</h3>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <code className="text-sm font-mono text-gray-800 break-all">{String(nonce)}</code>
                </div>
              </div>

              {/* Sign Button */}
              {!signature && (
                <div className="text-center">
                  <button
                    onClick={handleSignNonce}
                    disabled={isLoading}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        Sign Nonce
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Signature Results */}
              {signature && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Signature Details</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Signed Message
                        </label>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <code className="text-sm font-mono text-gray-800">{signedMessage}</code>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Digital Signature
                        </label>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <code className="text-xs font-mono text-gray-800 break-all">{signature}</code>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Verification Status */}
                  {verificationResult !== null && (
                    <div className={`rounded-xl p-6 ${verificationResult ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center gap-3">
                        {verificationResult ? (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-500" />
                        )}
                        <div>
                          <h3 className={`font-semibold ${verificationResult ? 'text-green-800' : 'text-red-800'}`}>
                            {verificationResult ? 'Signature Verified' : 'Verification Failed'}
                          </h3>
                          <p className={`mt-1 ${verificationResult ? 'text-green-700' : 'text-red-700'}`}>
                            {verificationResult 
                              ? 'The signature has been successfully verified and is authentic.'
                              : 'The signature verification failed. Please try signing again.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    {verificationResult === true && (
                      <button
                        onClick={onProceed}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <ArrowRight className="w-4 h-4" />
                        Continue to Step 3
                      </button>
                    )}
                    
                    <button
                      onClick={handleSignAgain}
                      disabled={isLoading}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Signing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Sign Again
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={onBack}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">About Nonce Signing</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                Digital signature of the blockchain nonce provides cryptographic proof of identity and prevents replay attacks. 
                The signature is created using your private key and can be verified by anyone using your public address.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2_8SignNonce;