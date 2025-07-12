import React, { useState, useRef, useCallback } from 'react';

const FileUploadComponent = ({
  uploadedFiles,
  uploadProgress,
  fileHashes,
  onFileUpload,
  onTamperTest,
  tamperTestResults,
  onNext,
  onBack,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      onFileUpload(files);
    },
    [onFileUpload]
  );

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    onFileUpload(files);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h2>📁 Secure File Upload</h2>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragOver ? '#3b82f6' : '#d1d5db'}`,
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: isDragOver ? '#eff6ff' : 'transparent',
            cursor: 'pointer',
          }}
        >
          <p>Drag & drop files here, or click to select</p>
          <button>Select Files</button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>

        {Object.entries(uploadProgress).map(([fileId, progress]) => (
          <div key={fileId} style={{ marginTop: '16px' }}>
            <p>
              {fileId.split('-')[0]} - {progress.status} - {progress.progress}%
            </p>
            <div
              style={{
                height: '8px',
                width: '100%',
                background: '#ccc',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress.progress}%`,
                  backgroundColor: progress.status === 'error' ? 'red' : '#3b82f6',
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 0 10px #ddd' }}>
        <h2>📋 Uploaded Files</h2>
        {uploadedFiles.length === 0 ? (
          <p>No files uploaded yet</p>
        ) : (
          uploadedFiles.map((file) => (
            <div key={file.id} style={{ marginBottom: 16, padding: 12, border: '1px solid #ccc', borderRadius: 6 }}>
              <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
              <br />
              Hash: <code>{file.hash?.substring(0, 32)}...</code>
              <br />
              {fileHashes[file.name] && (
                <div>
                  Blockchain Info: Block {fileHashes[file.name].blockNumber} | Tx Hash{' '}
                  {fileHashes[file.name].txHash?.substring(0, 10)}...
                </div>
              )}
              {tamperTestResults[file.name] && (
                <div style={{ color: tamperTestResults[file.name].isTampered ? 'red' : 'green' }}>
                  {tamperTestResults[file.name].isTampered ? '❌ Tampered!' : '✅ Verified'}
                  <br />
                  <small>{tamperTestResults[file.name].details}</small>
                </div>
              )}
              <button onClick={() => onTamperTest(file.name)} style={{ marginTop: 8 }}>
                Test Integrity
              </button>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onBack}>← Back</button>
        <button onClick={onNext}>Continue →</button>
      </div>
    </div>
  );
};

export default FileUploadComponent;
