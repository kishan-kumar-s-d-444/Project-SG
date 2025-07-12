import React from 'react';

const TamperDetectionDemo = ({ tamperTestResults, onBack, onNext }) => {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      <div
        style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        }}
      >
        <h2>🛡️ Tamper Detection Demo</h2>
        <p>
          Each file uploaded has its hash stored on a simulated blockchain. Later, the file's hash
          is recalculated and compared to detect tampering.
        </p>

        {Object.keys(tamperTestResults).length === 0 ? (
          <p style={{ marginTop: 40, color: '#666' }}>
            🔍 Upload files and test their integrity to see tamper detection in action.
          </p>
        ) : (
          <div>
            <h3>Results</h3>
            {Object.entries(tamperTestResults).map(([fileName, result]) => (
              <div
                key={fileName}
                style={{
                  marginBottom: 16,
                  padding: 16,
                  border: '1px solid #ccc',
                  borderRadius: 6,
                  backgroundColor: result.isTampered ? '#fee2e2' : '#ecfdf5',
                }}
              >
                <strong>{fileName}</strong>: {result.status === 'testing' ? 'Testing...' : ''}
                {result.status === 'complete' &&
                  (result.isTampered ? '❌ Tamper Detected' : '✅ Verified')}
                <br />
                <small>{result.details}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onBack}>← Back</button>
        <button onClick={onNext}>Complete →</button>
      </div>
    </div>
  );
};

export default TamperDetectionDemo;
