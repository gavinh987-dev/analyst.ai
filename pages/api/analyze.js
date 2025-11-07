import { IncomingForm } from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';
import { createPowerPoint } from '../../lib/ppt-generator';

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Parse the uploaded file
    const form = new IncomingForm();
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file[0];
    const fileBuffer = fs.readFileSync(file.filepath);
    
    // 2. Convert Excel to text for AI analysis
    const fileText = await convertExcelToText(fileBuffer);
    
    // 3. AI Analysis
    const analysis = await analyzeWithAI(fileText);
    
    // 4. Generate PowerPoint
    const powerpointBuffer = await createPowerPoint(analysis);
    
    // 5. Send back to user
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', 'attachment; filename=financial-analysis.pptx');
    res.send(powerpointBuffer);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Analysis failed: ' + error.message });
  }
}

async function convertExcelToText(buffer) {
  // For now, we'll use a simple approach
  // Later we can use libraries like xlsx or sheetjs
  return "Financial data placeholder - will implement Excel parsing";
}

async function analyzeWithAI(data) {
  const prompt = `
You are a senior financial analyst. Analyze this financial data and create a presentation outline.

FINANCIAL DATA:
${data}

Please return a JSON with this exact structure:
{
  "presentation_title": "Q4 2024 Financial Performance Review",
  "executive_summary": ["Point 1", "Point 2", "Point 3"],
  "slides": [
    {
      "title": "Executive Summary",
      "content": ["Bullet 1", "Bullet 2", "Bullet 3"],
      "chart_type": "none"
    },
    {
      "title": "Revenue Performance", 
      "content": ["Revenue grew 15% QoQ", "Enterprise segment driving growth"],
      "chart_type": "line"
    }
  ]
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3, // More consistent, analytical responses
  });

  return JSON.parse(response.choices[0].message.content);
}
