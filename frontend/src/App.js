
import React, { useState, useEffect } from 'react';
import Step1ClientConfig from './components/Step1ClientConfig';
import Step1_5AuthCode from './components/Step1_5AuthCode';
import Step2TokenExchange from './components/Step2TokenExchange';
import Step2_5TokenValidation from './components/Step2_5TokenValidation';
import Step2_75Nonce from './components/Step2_75Nonce';
import Step2_8SignNonce from './components/Step2_8SignNonce';
import Step3ResourceAccess from './components/Step3ResourceAccess';
import Step4Complete from './components/Step4Complete';
import './App.css';
import { Wallet, solidityKeccak256, arrayify } from 'ethers';

function App() {
  // Centralized state for all steps
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({});
  const [client, setClient] = useState(null); // Not used directly, but for parity
  const [generatedAuthCode, setGeneratedAuthCode] = useState('');
  const [inputAuthCode, setInputAuthCode] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [token, setToken] = useState('');
  const [tokenValidation, setTokenValidation] = useState(null);
  const [nonce, setNonce] = useState(null);
  const [signature, setSignature] = useState(null);
  const [signedMessage, setSignedMessage] = useState(null);
  const [signatureVerification, setSignatureVerification] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);
  const [fileDownloadResult, setFileDownloadResult] = useState(null);
  const [lastData, setLastData] = useState(null);
  const [error, setError] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPrivateKey, setClientPrivateKey] = useState('');
  const [mode, setMode] = useState('1');
  const [scopes, setScopes] = useState(['engine_start', 'door_unlock']);

  // Sync private key from config
  useEffect(() => {
    if (config.privateKey) setClientPrivateKey(config.privateKey);
  }, [config.privateKey]);

  // Step 1: Client Config
  const handleInitAuth = async () => {
    setError('');
    try {
      const scopeString = config.mode === '1' ? (config.scopes || []).join(' ') : 'file_download';
      // Save mode and scopes for later
      setMode(config.mode);
      setScopes(config.scopes || ['engine_start', 'door_unlock']);
      // Request auth code
      const res = await fetch(`${config.authServer}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          scope: scopeString
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setGeneratedAuthCode(data.code);
      setStep(1.5);
    } catch (err) {
      setError('Failed to get authorization code: ' + err.message);
    }
  };

  // Step 1.5: Validate Auth Code
  const handleValidateAuthCode = (code) => {
    if (code === generatedAuthCode) {
      setAuthCode(code);
      setStep(2);
      setError('');
    } else {
      setError('❌ Invalid authorization code!');
    }
  };

  // Step 2: Token Exchange
  const handleGenerateToken = async () => {
    setError('');
    try {
      const res = await fetch(`${config.authServer}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: authCode,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          grant_type: 'authorization_code'
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setToken(data.access_token);
      setStep(2.5);
    } catch (err) {
      setError('Failed to get token: ' + err.message);
    }
  };

  // Step 2.5: Token Validation (JWT check, simplified)
  const handleValidateToken = async () => {
    setError('');
    try {
      // For demo, just check if token is non-empty
      if (token && token.length > 0) {
        setTokenValidation(true);
      } else {
        setTokenValidation(false);
      }
    } catch (err) {
      setTokenValidation(false);
      setError('Token validation failed: ' + err.message);
    }
  };

  // Step 2.75: Request Nonce
  const handleRequestNonce = async () => {
    setError('');
    try {
      // For demo, just use a random nonce or fetch from server
      const res = await fetch(`${config.resourceServer}/get-nonce`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setNonce(data.nonce);
      setClientAddress(data.address || '');
    } catch (err) {
      setError('Failed to fetch nonce from server: ' + err.message);
    }
  };

  // Step 2.8: Sign Nonce
  const handleSignNonce = async () => {
    setError('');
    try {
      if (!nonce || !clientPrivateKey) throw new Error('Missing nonce or private key');
      const wallet = new Wallet(clientPrivateKey);
      const message = `Nonce: ${nonce}`;
      const messageBytes = new TextEncoder().encode(message);
      const signedMessage = await wallet.signMessage(messageBytes);
      setSignature(signedMessage);
      setSignedMessage(message);
      // Verify signature
      const recovered = Wallet.verifyMessage(messageBytes, signedMessage);
      if (recovered.toLowerCase() === wallet.address.toLowerCase()) {
        setSignatureVerification(true);
      } else {
        setSignatureVerification(false);
      }
    } catch (err) {
      setError('Failed to sign nonce: ' + err.message);
      setSignatureVerification(false);
    }
  };

  // Step 3: Resource Access (Telemetry or File)
  const handleRequestTelemetry = async () => {
    setError('');
    try {
      if (!nonce || !signature) throw new Error('Missing nonce or signature');
      const headers = {
        'X-Nonce': nonce,
        'X-Signature': signature,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const url = `${config.resourceServer}/mercedes/telemetry/${config.clientId}`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTelemetryData(data);
      setLastData(data);
    } catch (err) {
      setError('Failed to fetch telemetry data: ' + err.message);
    }
  };

  const handleDownloadFile = async (filename, version) => {
    setError('');
    try {
      // Implement file download logic if needed
      setFileDownloadResult(`downloads/${config.clientId || 'client'}_${filename}.txt`);
      setStep(4);
    } catch (err) {
      setError('Failed to download file: ' + err.message);
    }
  };

  // Step 4: Restart
  const handleRestart = () => {
    setStep(1);
    setConfig({});
    setGeneratedAuthCode('');
    setInputAuthCode('');
    setAuthCode('');
    setToken('');
    setTokenValidation(null);
    setNonce(null);
    setSignature(null);
    setSignedMessage(null);
    setSignatureVerification(null);
    setTelemetryData(null);
    setFileDownloadResult(null);
    setLastData(null);
    setError('');
    setClientAddress('');
    setClientPrivateKey('');
    setMode('1');
    setScopes(['engine_start', 'door_unlock']);
  };

  // Step navigation
  const goToStep = (n) => setStep(n);

  // UI rendering for each step
  return (
    <div className="App">
      <div className="header"><h1>🔐 Secure Car API Access</h1></div>
      <div style={{ maxWidth: 700, margin: '0 auto', marginTop: 32 }}>
        {step === 1 && (
          <Step1ClientConfig
            onNext={handleInitAuth}
            setConfig={setConfig}
            config={config}
          />
        )}
        {step === 1.5 && (
          <Step1_5AuthCode
            generatedAuthCode={generatedAuthCode}
            onValidate={handleValidateAuthCode}
            onBack={() => goToStep(1)}
          />
        )}
        {step === 2 && (
          <Step2TokenExchange
            onGenerateToken={handleGenerateToken}
            error={error}
          />
        )}
        {step === 2.5 && (
          <Step2_5TokenValidation
            token={token}
            onValidateToken={handleValidateToken}
            onBack={() => goToStep(2)}
            validationResult={tokenValidation}
            onProceed={() => goToStep(2.75)}
            onValidateAgain={() => setTokenValidation(null)}
          />
        )}
        {step === 2.75 && (
          <Step2_75Nonce
            nonce={nonce}
            onRequestNonce={handleRequestNonce}
            onProceed={() => goToStep(2.8)}
            onRequestAgain={() => setNonce(null)}
            onBack={() => goToStep(2.5)}
            clientAddress={clientAddress}
            clientPrivateKey={clientPrivateKey}
          />
        )}
        {step === 2.8 && (
          <Step2_8SignNonce
            nonce={nonce}
            signature={signature}
            signedMessage={signedMessage}
            onSignNonce={handleSignNonce}
            onProceed={() => goToStep(3)}
            onSignAgain={() => {
              setSignature(null);
              setSignedMessage(null);
              setSignatureVerification(null);
            }}
            onBack={() => goToStep(2.75)}
            verificationResult={signatureVerification}
          />
        )}
        {step === 3 && (
          <Step3ResourceAccess
            mode={mode}
            token={token}
            onRequestTelemetry={handleRequestTelemetry}
            telemetryData={telemetryData}
            onBack={() => goToStep(2.8)}
            onSkip={() => goToStep(4)}
            onDownloadFile={handleDownloadFile}
            fileDownloadResult={fileDownloadResult}
          />
        )}
        {step === 4 && (
          <Step4Complete
            onRestart={handleRestart}
            onViewResults={() => {}}
            mode={mode}
            lastData={lastData}
            clientId={config.clientId}
          />
        )}
        {error && <div className="error-box" style={{ marginTop: 16 }}>{error}</div>}
      </div>
    </div>
  );
}

export default App;
