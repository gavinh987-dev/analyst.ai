import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = () => {
    if (!file) return;
    setLoading(true);
    setTimeout(() => {
      alert('File uploaded! AI PowerPoint generation coming soon.');
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1>Analyst.ai</h1>
      <p>Upload your Excel file to generate a PowerPoint presentation</p>
      
      <div style={{ border: '2px dashed #ccc', padding: '40px', textAlign: 'center', margin: '20px 0' }}>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => setFile(e.target.files[0])}
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
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Processing...' : 'Create Presentation'}
      </button>
    </div>
  );
}
