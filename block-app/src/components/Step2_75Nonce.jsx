import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, ArrowLeft, ArrowRight, Shield, Key, Hash } from 'lucide-react';

const Step2_75Nonce = ({ 
  sessionId, 
  onProceed, 
  onBack, 
  initialNonce = null,
  initialAddress = null 
}) => {
  const [nonce, setNonce] = useState(initialNonce);
  const [address, setAddress] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(initialNonce ? 2.8 : 2.75);

  // Auto-load nonce if session exists but no nonce is provided
  useEffect(() => {
    if (sessionId && !nonce) {
      checkSessionState();
    }
  }, [sessionId]);

  const checkSessionState = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/session/${sessionId}`);
      const data = await response.json();
      
      if (data.success && data.session_data) {
        const sessionData = data.session_data;
        if (sessionData.nonce !== undefined) {
          setNonce(sessionData.nonce);
          setAddress(sessionData.blockchain_address);
          setStep(sessionData.step || 2.8);
        }
      }
    } catch (err) {
      console.error('Error checking session state:', err);
    }
  };

  const requestNonce = async () => {
    if (!sessionId) {
      setError('Session ID is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:8000/api/nonce/request', {
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
        setNonce(data.nonce);
        setAddress(data.address);
        setStep(data.step);
        setSuccess('Nonce retrieved successfully from blockchain!');
      } else {
        setError(data.error || 'Failed to request nonce');
      }
    } catch (err) {
      setError('Network error: Unable to request nonce');
      console.error('Nonce request error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (nonce !== null && address) {
      onProceed({
        nonce,
        address,
        step
      });
    }
  };

  const handleRequestAgain = () => {
    setNonce(null);
    setAddress(null);
    setSuccess('');
    setError('');
    requestNonce();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white mb-4">
              <Hash className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Blockchain Nonce Request
            </h2>
            <p className="text-gray-600">
              Request a nonce from the blockchain for transaction signing
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-green-700">{success}</span>
            </div>
          )}

          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Step 2.75</span>
              <span className="text-sm text-gray-500">Nonce Request</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: '75%' }}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Request Nonce Button */}
            {!nonce && (
              <div className="text-center">
                <button
                  onClick={requestNonce}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Requesting Nonce...
                    </>
                  ) : (
                    <>
                      <Hash className="w-5 h-5" />
                      Request Nonce from Blockchain
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Click to retrieve the current nonce for your blockchain address
                </p>
              </div>
            )}

            {/* Nonce Display */}
            {nonce !== null && (
              <div className="space-y-4">
                {/* Nonce Value */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Hash className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Current Nonce</h3>
                      <p className="text-sm text-gray-600">Transaction counter for your address</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 font-mono text-2xl font-bold text-center text-gray-800 border-2 border-blue-200">
                    {nonce}
                  </div>
                </div>

                {/* Account Details */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">Account Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Key className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Address:</span>
                    </div>
                    <div className="bg-white rounded-xl p-3 font-mono text-sm break-all text-gray-800 border">
                      {address || 'Loading...'}
                    </div>
                    <div className="flex items-center gap-3">
                      <Hash className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Transaction Count:</span>
                      <span className="font-semibold text-gray-800">{nonce}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleProceed}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-4 px-6 rounded-2xl hover:from-green-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-3"
                  >
                    <ArrowRight className="w-5 h-5" />
                    Proceed to Sign Nonce
                  </button>
                  <button
                    onClick={handleRequestAgain}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold py-4 px-6 rounded-2xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Request New Nonce
                  </button>
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={onBack}
                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-2xl hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-3"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Token Validation
              </button>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">What is a Nonce?</h4>
            <p className="text-sm text-blue-700">
              A nonce (number used once) is a transaction counter that prevents replay attacks. 
              Each blockchain address has a nonce that increments with every transaction sent from that address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2_75Nonce;