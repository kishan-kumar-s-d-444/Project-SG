import React from 'react';

const Step2_75Nonce = ({ nonce, onRequestNonce, onProceed, onRequestAgain, onBack, clientAddress, clientPrivateKey }) => (
  <div className="step-container">
    <h2>🔢 Step 2.75: Receive Nonce</h2>
    {!nonce && <button style={{ width: '100%' }} onClick={onRequestNonce}>📥 Request Nonce</button>}
    {nonce && (
      <>
        <div className="nonce-box" style={{ marginTop: 16 }}>Current Nonce: {nonce}</div>
        <details style={{ marginTop: 8 }}>
          <summary>👤 Account Details</summary>
          <pre>
Address: {clientAddress}
Private Key: {clientPrivateKey?.slice(0, 10)}...
Current Nonce: {nonce}
          </pre>
        </details>
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <button onClick={onProceed}>▶️ Proceed to Sign Nonce</button>
          <button onClick={onRequestAgain}>🔄 Request New Nonce</button>
        </div>
      </>
    )}
    <button style={{ marginTop: 16 }} onClick={onBack}>⬅️ Back to Token Validation</button>
  </div>
);

export default Step2_75Nonce;
