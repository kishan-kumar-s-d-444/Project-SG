
import React, { useState } from 'react';
import Step1ClientConfig from './components/Step1ClientConfig';
import Step1_5AuthCode from './components/Step1_5AuthCode';
import Step2TokenExchange from './components/Step2TokenExchange';
import Step2_5TokenValidation from './components/Step2_5TokenValidation';
import Step2_75Nonce from './components/Step2_75Nonce';
import Step2_8SignNonce from './components/Step2_8SignNonce';
import Step3ResourceAccess from './components/Step3ResourceAccess';
import Step4Complete from './components/Step4Complete';
import './App.css';

function App() {
  // State for each step
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({});
  const [generatedAuthCode, setGeneratedAuthCode] = useState('123456'); // Placeholder
  const [authCode, setAuthCode] = useState('');
  const [token, setToken] = useState('');
  const [tokenValidation, setTokenValidation] = useState(null); // true/false/null
  const [nonce, setNonce] = useState(null);
  const [clientAddress, setClientAddress] = useState('0x123...'); // Placeholder
  const [clientPrivateKey, setClientPrivateKey] = useState('abcdef1234567890'); // Placeholder
  const [signature, setSignature] = useState(null);
  const [signedMessage, setSignedMessage] = useState(null);
  const [signatureVerification, setSignatureVerification] = useState(null); // true/false/null
  const [telemetryData, setTelemetryData] = useState(null);
  const [fileDownloadResult, setFileDownloadResult] = useState(null);
  const [lastData, setLastData] = useState(null);
  const [error, setError] = useState('');

  // Step navigation handlers
  const nextStep = () => setStep(s => s + 0.5);
  const prevStep = () => setStep(s => s - 0.5);
  const goToStep = (n) => setStep(n);

  // Placeholder API handlers (replace with real API calls)
  const handleInitAuth = () => {
    setGeneratedAuthCode('123456'); // Replace with backend call
    nextStep();
  };
  const handleValidateAuthCode = (code) => {
    setAuthCode(code);
    nextStep();
  };
  const handleGenerateToken = () => {
    setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'); // Replace with backend call
    nextStep();
  };
  const handleValidateToken = () => {
    setTokenValidation(true); // Replace with backend call
  };
  const handleProceedNonce = () => nextStep();
  const handleRequestNonce = () => {
    setNonce(42); // Replace with backend call
    setClientAddress('0x123...');
    setClientPrivateKey('abcdef1234567890');
  };
  const handleRequestNewNonce = () => setNonce(Math.floor(Math.random() * 1000));
  const handleSignNonce = () => {
    setSignature('0xdeadbeef');
    setSignedMessage(`Nonce: ${nonce}`);
    setSignatureVerification(true);
  };
  const handleSignAgain = () => {
    setSignature(null);
    setSignedMessage(null);
    setSignatureVerification(null);
  };
  const handleVerifySignature = () => setSignatureVerification(true);
  const handleRequestTelemetry = () => {
    const data = { speed: 100, battery: 80 };
    setTelemetryData(data);
    setLastData(data);
  };
  const handleDownloadFile = (filename, version) => {
    setFileDownloadResult(`downloads/${config.clientId || 'client'}_${filename}.txt`);
  };
  const handleRestart = () => {
    setStep(1);
    setConfig({});
    setGeneratedAuthCode('123456');
    setAuthCode('');
    setToken('');
    setTokenValidation(null);
    setNonce(null);
    setClientAddress('0x123...');
    setClientPrivateKey('abcdef1234567890');
    setSignature(null);
    setSignedMessage(null);
    setSignatureVerification(null);
    setTelemetryData(null);
    setFileDownloadResult(null);
    setLastData(null);
    setError('');
  };
  const handleViewResults = () => {
    // No-op for now
  };

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
            onRequestAgain={handleRequestNewNonce}
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
            onSignAgain={handleSignAgain}
            onBack={() => goToStep(2.75)}
            verificationResult={signatureVerification}
          />
        )}
        {step === 3 && (
          <Step3ResourceAccess
            mode={config.mode}
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
            onViewResults={handleViewResults}
            mode={config.mode}
            lastData={lastData}
            clientId={config.clientId}
          />
        )}
      </div>
    </div>
  );
}

export default App;
