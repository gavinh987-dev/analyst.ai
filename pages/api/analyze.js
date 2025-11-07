export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.json({ 
    success: true, 
    message: 'File received successfully! AI analysis coming soon.' 
  });
}
