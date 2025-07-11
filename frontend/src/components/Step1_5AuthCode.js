import React, { useState } from 'react';

const Step1_5AuthCode = ({ generatedAuthCode, onValidate, onBack }) => {
  const [inputAuthCode, setInputAuthCode] = useState('');
  const [error, setError] = useState('');

  const handleValidate = () => {
    if (inputAuthCode === generatedAuthCode) {
      setError('');
      onValidate(inputAuthCode);
    } else {
      setError('❌ Invalid authorization code!');
    }
  };

  return (
    <div className="step-container">
      <h2>🔑 Step 1.5: Authorization Code Validation</h2>
      <div>
        <b>Generated Authorization Code:</b>
        <pre>{generatedAuthCode}</pre>
      </div>
      <input
        placeholder="Enter Authorization Code"
        value={inputAuthCode}
        onChange={e => setInputAuthCode(e.target.value)}
        style={{ width: '100%', marginTop: 8 }}
      />
      {error && <div className="error-box" style={{ marginTop: 8 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
        <button onClick={handleValidate}>🔍 Validate Code</button>
        <button onClick={onBack}>🔄 Back to Configuration</button>
      </div>
    </div>
  );
};

export default Step1_5AuthCode;
