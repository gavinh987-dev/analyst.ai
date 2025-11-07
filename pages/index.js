import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setMessage('Starting upload...');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      setMessage('Sending to server...');
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      
      setMessage('Processing response...');
      
      if (response.ok) {
        const blob = await response.blob();
        setMessage('Creating download...');
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'financial-analysis.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setMessage('✅ Download complete!');
      } else {
        const errorText = await response.text();
        setMessage(`❌ Error: ${errorText}`);
        console.error('Server error:', errorText);
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error.message}`);
      console.error('Network error:', error);
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
