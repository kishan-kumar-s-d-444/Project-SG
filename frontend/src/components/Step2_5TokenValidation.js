import React from 'react';

const Step2_5TokenValidation = ({ token, onValidateToken, onBack, validationResult, onProceed, onValidateAgain }) => (
  <div className="step-container">
    <h2>🔒 Step 2.5: Token Validation</h2>
    <div>
      <b>Generated Token:</b>
      <pre>{token}</pre>
    </div>
    {!validationResult && (
      <button style={{ width: '100%', marginTop: 16 }} onClick={onValidateToken}>🚀 Send Token to Resource Server</button>
    )}
    {validationResult === true && (
      <div className="success-box" style={{ marginTop: 16 }}>✅ Token successfully validated by resource server!</div>
    )}
    {validationResult === false && (
      <div className="error-box" style={{ marginTop: 16 }}>❌ Token validation failed!</div>
    )}
    <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
      {validationResult === true && <button onClick={onProceed}>▶️ Proceed to Nonce Reception</button>}
      {validationResult === true && <button onClick={onValidateAgain}>🔄 Validate Again</button>}
      <button onClick={onBack}>⬅️ Back to Token Generation</button>
    </div>
  </div>
);

export default Step2_5TokenValidation;
