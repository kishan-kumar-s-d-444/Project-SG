import React, { useState } from 'react';
import Step1ClientConfig from './components/Step1ClientConfig';
import Step1_5AuthCode from './components/Step1_5AuthCode';
import Step2TokenExchange from './components/Step2TokenExchange';
import Step2_5TokenValidation from './components/Step2_5TokenValidation';
import Step2_75Nonce from './components/Step2_75Nonce';
import Step2_8SignNonce from './components/Step2_8SignNonce';
import Step3ResourceAccess from './components/Step3ResourceAccess';
import Step4Complete from './components/Step4Complete';
import FileUploadComponent from './components/FileUploadComponent';
import TamperDetectionDemo from './components/TamperDetectionDemo';
import './App.css';

function App() {
  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState(null);

  const [config, setConfig] = useState({});
  const [generatedAuthCode, setGeneratedAuthCode] = useState('123456');
  const [authCode, setAuthCode] = useState('');
  const [token, setToken] = useState('');
  const [tokenValidation, setTokenValidation] = useState(null);
  const [nonce, setNonce] = useState(null);
  const [clientAddress, setClientAddress] = useState('0x123...');
  const [clientPrivateKey, setClientPrivateKey] = useState('abcdef1234567890');
  const [signature, setSignature] = useState(null);
  const [signedMessage, setSignedMessage] = useState(null);
  const [signatureVerification, setSignatureVerification] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);
  const [fileDownloadResult, setFileDownloadResult] = useState(null);
  const [lastData, setLastData] = useState(null);
  const [error, setError] = useState('');

  // File Upload & Blockchain Hashing
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [fileHashes, setFileHashes] = useState({});
  const [tamperTestResults, setTamperTestResults] = useState({});

  // Navigation
  const nextStep = () => setStep((s) => s + 0.5);
  const goToStep = (n) => setStep(n);

  // Session handler
  const handleSessionCreate = (newSessionId) => {
    setSessionId(newSessionId);
  };

  // OAuth & API Step Handlers
  const handleInitAuth = (configData) => {
    setConfig(configData);
    if (configData.authCode) {
      setGeneratedAuthCode(configData.authCode);
    }
    nextStep();
  };

  const handleValidateAuthCode = (validationData) => {
    setAuthCode(validationData.authCode);
    if (validationData.sessionId) {
      setSessionId(validationData.sessionId);
    }
    nextStep();
  };

  const handleGenerateToken = () => {
    setToken('mock.jwt.token');
    nextStep();
  };
  
  const handleValidateToken = () => {
    setTokenValidation(true);
  };
  
  const handleRequestNonce = (generatedNonce) => {
    const newNonce = generatedNonce || Math.floor(Math.random() * 1000);
    setNonce(newNonce);
    setClientAddress('0x123...');
    setClientPrivateKey('abcdef1234567890');
    return newNonce;
  };
  
  const handleSignNonce = () => {
    if (nonce) {
      setSignature('0xsignature');
      setSignedMessage(`Nonce: ${nonce}`);
      setSignatureVerification(true);
    } else {
      console.error('No nonce available for signing');
    }
  };
  
  const handleRequestTelemetry = () => {
    const data = { speed: 100, battery: 80 };
    setTelemetryData(data);
    setLastData(data);
  };
  
  const handleDownloadFile = (filename) => {
    setFileDownloadResult(`downloads/${config.clientId || 'client'}_${filename}.txt`);
  };

  // File Upload and Hashing
  const generateFileHash = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const simulateBlockchainStorage = (filename, hash) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setFileHashes((prev) => ({
          ...prev,
          [filename]: {
            hash,
            blockNumber: Math.floor(Math.random() * 100000),
            timestamp: Date.now(),
            txHash: `0x${Math.random().toString(16).substring(2, 64)}`
          }
        }));
        resolve(true);
      }, 1500);
    });
  };

  const handleFileUpload = async (files) => {
    for (const file of files) {
      const fileId = `${file.name}-${Date.now()}`;
      setUploadProgress((prev) => ({ ...prev, [fileId]: { status: 'hashing', progress: 10 } }));
      try {
        const hash = await generateFileHash(file);
        setUploadProgress((prev) => ({ ...prev, [fileId]: { status: 'uploading', progress: 50 } }));
        await new Promise((res) => setTimeout(res, 1000));
        setUploadProgress((prev) => ({ ...prev, [fileId]: { status: 'blockchain', progress: 80 } }));
        await simulateBlockchainStorage(file.name, hash);
        setUploadedFiles((prev) => [...prev, {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          hash,
          uploadTime: new Date().toISOString()
        }]);
        setUploadProgress((prev) => ({ ...prev, [fileId]: { status: 'complete', progress: 100 } }));
      } catch (err) {
        setUploadProgress((prev) => ({ ...prev, [fileId]: { status: 'error', progress: 0, error: err.message } }));
      }
    }
  };

  const handleTamperTest = async (fileName) => {
    setTamperTestResults((prev) => ({ ...prev, [fileName]: { status: 'testing', progress: 0 } }));
    for (let i = 0; i <= 100; i += 20) {
      await new Promise((res) => setTimeout(res, 200));
      setTamperTestResults((prev) => ({ ...prev, [fileName]: { status: 'testing', progress: i } }));
    }
    const isTampered = Math.random() < 0.3;
    setTamperTestResults((prev) => ({
      ...prev,
      [fileName]: {
        status: 'complete',
        progress: 100,
        isTampered,
        details: isTampered
          ? 'File hash mismatch detected! File may have been tampered with.'
          : 'File integrity verified. Hash matches blockchain record.'
      }
    }));
  };

  const handleRestart = () => {
    setStep(1);
    setSessionId(null);
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
    setUploadedFiles([]);
    setUploadProgress({});
    setFileHashes({});
    setTamperTestResults({});
  };

  return (
    <div className="App min-h-screen bg-gray-100 text-gray-900 font-sans">
      <header className="bg-amber-950 text-white py-6 shadow-md">
        <h1 className="text-2xl font-bold text-center">🔐 Secure Car API Access</h1>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6 bg-white shadow-md mt-8 rounded-lg">
        {step === 1 && (
          <Step1ClientConfig
            sessionId={sessionId}
            onNext={handleInitAuth}
            setConfig={setConfig}
            config={config}
            onSessionCreate={handleSessionCreate}
          />
        )}
        {step === 1.5 && (
          <Step1_5AuthCode
            sessionId={sessionId}
            generatedAuthCode={generatedAuthCode}
            onValidate={handleValidateAuthCode}
            onBack={() => goToStep(1)}
            config={config}
          />
        )}
        {step === 2 && (
          <Step2TokenExchange
            sessionId={sessionId}
            onGenerateToken={(generatedToken) => {
              setToken(generatedToken);
              setTokenValidation(null);
              goToStep(2.5);
            }}
            error={error}
          />
        )}
        {step === 2.5 && (
          <Step2_5TokenValidation
            sessionId={sessionId}
            token={token}
            onValidateToken={(result, data) => {
              setTokenValidation(result);
            }}
            onBack={() => goToStep(2)}
            validationResult={tokenValidation}
            onProceed={() => goToStep(2.75)}
            onValidateAgain={() => setTokenValidation(null)}
          />
        )}
        {step === 2.75 && (
          <Step2_75Nonce
            sessionId={sessionId}
            initialNonce={nonce}
            initialAddress={clientAddress}
            onProceed={(nonceData) => {
              // Update state with the nonce data from Step2_75Nonce
              if (nonceData.nonce !== undefined) {
                setNonce(nonceData.nonce);
              }
              if (nonceData.address) {
                setClientAddress(nonceData.address);
              }
              goToStep(2.8);
            }}
            onBack={() => goToStep(2.5)}
          />
        )}
        {step === 2.8 && (
          <Step2_8SignNonce
            sessionId={sessionId}
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
            clientAddress={clientAddress}
          />
        )}
        {step === 3 && (
          <Step3ResourceAccess
            sessionId={sessionId}
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
        {/* {step === 3.5 && (
          <FileUploadComponent
            sessionId={sessionId}
            uploadedFiles={uploadedFiles}
            uploadProgress={uploadProgress}
            fileHashes={fileHashes}
            onFileUpload={handleFileUpload}
            onTamperTest={handleTamperTest}
            tamperTestResults={tamperTestResults}
            onNext={() => goToStep(3.75)}
            onBack={() => goToStep(3)}
          />
        )}
        {step === 3.75 && (
          <TamperDetectionDemo
            sessionId={sessionId}
            tamperTestResults={tamperTestResults}
            onBack={() => goToStep(3.5)}
            onNext={() => goToStep(4)}
          />
        )} */}
        {step === 4 && (
          <Step4Complete
            sessionId={sessionId}
            onRestart={handleRestart}
            onViewResults={() => {}}
            mode={config.mode}
            lastData={lastData}
            clientId={config.clientId}
          />
        )}
      </main>
    </div>
  );
}

export default App;