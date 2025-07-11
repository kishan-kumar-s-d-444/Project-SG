import React, { useState } from 'react';

const Step1ClientConfig = ({ onNext, setConfig, config }) => {
  const [clientId, setClientId] = useState(config.clientId || 'tesla_models_3');
  const [clientSecret, setClientSecret] = useState(config.clientSecret || 'tesla_secret_3');
  const [authServer, setAuthServer] = useState(config.authServer || 'http://localhost:5001');
  const [resourceServer, setResourceServer] = useState(config.resourceServer || 'http://localhost:5002');
  const [mode, setMode] = useState(config.mode || '1');
  const [scopes, setScopes] = useState(config.scopes || ['engine_start', 'door_unlock']);

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfig({ clientId, clientSecret, authServer, resourceServer, mode, scopes });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="step-container">
      <h2>🚀 Step 1: Client Configuration</h2>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <label>Client ID<br/>
            <input value={clientId} onChange={e => setClientId(e.target.value)} required />
          </label><br/>
          <label>Authorization Server URL<br/>
            <input value={authServer} onChange={e => setAuthServer(e.target.value)} required />
          </label>
        </div>
        <div style={{ flex: 1 }}>
          <label>Client Secret<br/>
            <input type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} required />
          </label><br/>
          <label>Resource Server URL<br/>
            <input value={resourceServer} onChange={e => setResourceServer(e.target.value)} required />
          </label>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <label>
          <b>Select Access Mode</b><br/>
          <input type="radio" checked={mode === '1'} onChange={() => setMode('1')} /> 📊 Telemetry Data
          <input type="radio" checked={mode === '2'} onChange={() => setMode('2')} style={{ marginLeft: 16 }} /> 📥 File Download
        </label>
      </div>
      {mode === '1' ? (
        <div style={{ marginTop: 16 }}>
          <label><b>Select Scopes</b><br/>
            <select multiple value={scopes} onChange={e => setScopes(Array.from(e.target.selectedOptions, o => o.value))}>
              <option value="engine_start">engine_start</option>
              <option value="door_unlock">door_unlock</option>
            </select>
          </label>
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <div className="info-box">📥 File Download mode selected - using file_download scope</div>
        </div>
      )}
      <button type="submit" style={{ marginTop: 24, width: '100%' }}>🚀 Initialize Authorization</button>
    </form>
  );
};

export default Step1ClientConfig;
