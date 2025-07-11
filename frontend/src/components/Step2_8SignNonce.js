import React from 'react';

const Step2_8SignNonce = ({ nonce, signature, signedMessage, onSignNonce, onProceed, onSignAgain, onBack, verificationResult }) => (
  <div className="step-container">
    <h2>✍️ Step 2.8: Sign Nonce</h2>
    {!nonce && <div className="error-box">⚠️ No nonce found. Please go back and request a nonce first.</div>}
    {nonce && (
      <>
        <div className="nonce-box" style={{ marginTop: 16 }}>Current Nonce: {nonce}</div>
        {!signature && <button style={{ width: '100%', marginTop: 16 }} onClick={onSignNonce}>📝 Sign Nonce</button>}
        {signature && (
          <>
            <div className="signature-box" style={{ marginTop: 16 }}>
              <b>Message:</b> {signedMessage}<br/><br/>
              <b>Signature:</b> {signature}
            </div>
            {verificationResult === true && <div className="success-box" style={{ marginTop: 16 }}>✅ Signature verified successfully!</div>}
            {verificationResult === false && <div className="error-box" style={{ marginTop: 16 }}>❌ Signature verification failed!</div>}
            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              {verificationResult === true && <button onClick={onProceed}>▶️ Proceed to Resource Access</button>}
              <button onClick={onSignAgain}>🔄 Sign Again</button>
              <button onClick={onBack}>⬅️ Back</button>
            </div>
          </>
        )}
      </>
    )}
  </div>
);

export default Step2_8SignNonce;
