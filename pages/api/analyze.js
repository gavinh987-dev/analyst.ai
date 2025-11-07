import { IncomingForm } from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';

// Initialize OpenAI - with better error handling
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('OpenAI initialized');
} catch (error) {
  console.error('OpenAI init error:', error);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log('API route called');
  
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Parsing form data...');
    
    // Parse the uploaded file
    const form = new IncomingForm();
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parse error:', err);
          reject(err);
        }
        console.log('Form parsed successfully');
        resolve([fields, files]);
      });
    });

    if (!files.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = files.file[0];
    console.log('File received:', file.originalFilename);
    
    // For now, let's just return a simple success message to test
    const testAnalysis = `
FINANCIAL ANALYSIS REPORT
=========================

Company: ${file.originalFilename}

EXECUTIVE SUMMARY:
• Revenue growth of 15% quarter-over-quarter
• Strong profitability with 25% net margins  
• Healthy cash flow position

KEY METRICS:
• Revenue: $1.2M
• Net Income: $300K
• Cash Flow: $450K

RECOMMENDATIONS:
1. Continue current growth strategy
2. Monitor operating expenses
3. Invest in high-margin products

This is a test analysis. Real AI analysis coming soon!
    `;
    
    console.log('Sending response...');
    
    // Send back as a downloadable file
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="financial-analysis.txt"`);
    res.send(testAnalysis);

    console.log('Response sent successfully');

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      details: error.message 
    });
  }
}
