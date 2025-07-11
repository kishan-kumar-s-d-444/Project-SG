import React from 'react';

const Step4Complete = ({ onRestart, onViewResults, mode, lastData, clientId }) => (
  <div className="step-container">
    <h2>🏁 Process Complete</h2>
    <div className="f1-car" style={{ fontSize: 80, animation: 'drive 3s linear', whiteSpace: 'nowrap', position: 'relative' }}>🏎️</div>
    <div className="blue-success-box" style={{ background: '#1976d2', color: 'white', borderRadius: 5, margin: '10px 0', textAlign: 'center', fontWeight: 'bold', padding: 15 }}>
      🎉 All operations completed successfully!
    </div>
    <details style={{ marginTop: 16 }}>
      <summary>📋 Session Summary</summary>
      <ul>
        <li>✅ Client Configuration</li>
        <li>✅ Authorization Code Generation</li>
        <li>✅ Token Exchange</li>
        <li>✅ Resource Access</li>
      </ul>
    </details>
    <button style={{ width: '100%', marginTop: 16 }} onClick={onRestart}>🔄 Start New Session</button>
    <button style={{ width: '100%', marginTop: 8 }} onClick={onViewResults}>📊 View Last Results</button>
    {mode === '1' && lastData && (
      <details style={{ marginTop: 8 }} open>
        <summary>📊 Last Telemetry Data</summary>
        <pre>{JSON.stringify(lastData, null, 2)}</pre>
      </details>
    )}
    {mode !== '1' && clientId && (
      <div className="info-box" style={{ marginTop: 8 }}>📁 File was downloaded to: downloads/{clientId}_latest_update.txt</div>
    )}
  </div>
);

export default Step4Complete;
