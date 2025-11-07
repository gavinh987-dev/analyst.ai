import { IncomingForm } from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

// Simple function to simulate Excel parsing
function parseExcelData() {
  // For now, we'll return sample data
  // Later we can add real Excel parsing with a library like 'xlsx'
  return `
Financial Data Summary:
- Revenue: $1.2M (15% growth QoQ)
- Gross Margin: 45% (stable)
- Operating Expenses: $600K
- Net Income: $180K
- Cash Flow from Operations: $250K
- Current Ratio: 2.1
- Debt-to-Equity: 0.3
  `;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the uploaded file
    const form = new IncomingForm();
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file[0];
    
    // Get file info for the response
    const fileName = file.originalFilename || 'financial_data';
    
    // Parse the Excel data (simplified for now)
    const financialData = parseExcelData();
    
    // AI Analysis
    const analysis = await analyzeWithAI(financialData, fileName);
    
    // Create a simple text file as placeholder for PowerPoint
    const outputContent = `Financial Analysis Report\n\n${analysis}`;
    
    // Send back as a downloadable file
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}-analysis.txt"`);
    res.send(outputContent);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Analysis failed: ' + error.message });
  }
}

async function analyzeWithAI(financialData, fileName) {
  const prompt = `
You are a senior financial analyst. Analyze this financial data and create a comprehensive presentation outline.

COMPANY: ${fileName}
FINANCIAL DATA:
${financialData}

Please provide a detailed financial analysis with:
1. EXECUTIVE SUMMARY (3-4 bullet points)
2. REVENUE PERFORMANCE (trends, growth drivers)
3. PROFITABILITY ANALYSIS (margins, cost structure)  
4. CASH FLOW & BALANCE SHEET (liquidity, financial health)
5. KEY METRICS & RATIOS (important numbers to watch)
6. RECOMMENDATIONS (3 actionable insights)

Format this as a clear, professional analysis that can be used in a management presentation.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.3,
    });

    return response.choices[0].message.content;
  } catch (error) {
    throw new Error('AI analysis failed: ' + error.message);
  }
}
