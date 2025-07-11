import React, { useState } from 'react';

const Step3ResourceAccess = ({ mode, token, onRequestTelemetry, telemetryData, onBack, onSkip, onDownloadFile, fileDownloadResult }) => {
  const [filename, setFilename] = useState('latest_update');
  const [version, setVersion] = useState('1');

  return (
    <div className="step-container">
      <h2>📡 Step 3: Resource Access</h2>
      {mode === '1' ? (
        <>
          <div className="info-box">🚗 Request real-time vehicle telemetry data</div>
          <details style={{ marginTop: 8 }}>
            <summary>🔑 Current Token</summary>
            <pre>{token}</pre>
          </details>
          <button style={{ width: '100%', marginTop: 16 }} onClick={onRequestTelemetry}>📡 Request Telemetry Data</button>
          {telemetryData && (
            <>
              <div className="success-box" style={{ marginTop: 16 }}>✅ Telemetry data received successfully!</div>
              <pre style={{ background: '#f8f9fa', padding: 8, borderRadius: 4 }}>{JSON.stringify(telemetryData, null, 2)}</pre>
            </>
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <button onClick={onBack}>⬅️ Back</button>
            <button onClick={onSkip}>⏭️ Skip to Complete</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <input value={filename} onChange={e => setFilename(e.target.value)} placeholder="Filename" />
            <input value={version} onChange={e => setVersion(e.target.value)} placeholder="Version" />
            <button onClick={() => onDownloadFile(filename, version)}>📥 Download File</button>
          </div>
          {fileDownloadResult && (
            <div className="success-box" style={{ marginTop: 16 }}>✅ File saved to {fileDownloadResult}</div>
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <button onClick={onBack}>⬅️ Back</button>
            <button onClick={onSkip}>⏭️ Skip to Complete</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Step3ResourceAccess;
