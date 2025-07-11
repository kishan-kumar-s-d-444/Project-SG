import React from 'react';

const Step2TokenExchange = ({ onGenerateToken, error }) => (
  <div className="step-container">
    <h2>🔐 Step 2: Token Exchange</h2>
    <button style={{ width: '100%' }} onClick={onGenerateToken}>🪙 Generate Access Token</button>
    {error && <div className="error-box" style={{ marginTop: 16 }}>{error}</div>}
  </div>
);

export default Step2TokenExchange;
