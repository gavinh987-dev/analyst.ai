import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setMessage('Starting upload...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      setMessage('Uploading file...');
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      setMessage('Processing response...');

      if (response.ok) {
        // Check if it's a file download
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('text/plain')) {
          // It's a file download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `financial-analysis-${Date.now()}.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          setMessage('✅ Analysis complete! File downloaded.');
        } else {
          // It's a JSON response (error)
          const result = await response.json();
          setMessage(`❌ Error: ${result.error || result.message}`);
        }
      } else {
        // HTTP error
        const errorText = await response.text();
        setMessage(`❌ Server error: ${errorText}`);
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1>Analyst.ai</h1>
      <p>Upload your Excel file to generate a financial analysis</p>
      
      <div style={{ border: '2px dashed #ccc', padding: '40px', textAlign: 'center', margin: '20px 0' }}>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => {
            setFile(e.target.files[0]);
            setMessage('');
          }}
        />
        {file && <p>Selected: {file.name}</p>}
      </div>

      <button 
        onClick={handleUpload}
        disabled={!file || loading}
        style={{
          background: '#0070f3',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Processing...' : 'Create Analysis'}
      </button>

      {message && (
        <div style={{
          padding: '10px',
          background: message.includes('❌') ? '#fee' : '#efe',
          border: '1px solid #ccc',
          borderRadius: '5px'
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
