// pages/api/analyze.js (pages router) or src/pages/api/analyze.js
import { IncomingForm } from 'formidable';
import * as XLSX from 'xlsx';
import { createPowerPoint } from '../../lib/ppt-generator'; // adjust path as needed

export const config = {
  api: { bodyParser: false }, // required for FormData
};

export default async function handler(req, res) {
  console.log('=== API ANALYZE CALLED ===');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse multipart/form-data
    const { files } = await new Promise((resolve, reject) => {
      const form = new IncomingForm({ multiples: false, keepExtensions: true });
      form.parse(req, (err, _fields, _files) => (err ? reject(err) : resolve({ files: _files })));
    });

    if (!files || !files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Formidable can return array or object
    const uploaded = Array.isArray(files.file) ? files.file[0] : files.file;

    const originalName =
      uploaded.originalFilename || uploaded.originalFileName || uploaded.newFilename || 'upload';
    const filepath = uploaded.filepath || uploaded.filepath || uploaded.file; // compatibility

    if (!filepath) {
      return res.status(400).json({ error: 'Upload missing temp filepath' });
    }

    console.log('File received:', originalName);

    // Read workbook / CSV
    const wb = XLSX.readFile(filepath, { cellDates: true });
    // Try to pick common sheet names; fallback to first
    const pickSheet = (names) =>
      names.find((n) => wb.SheetNames.some((s) => s.toLowerCase() === n)) ||
      wb.SheetNames[0];

    const isNames = ['income statement', 'p&l', 'profit and loss'].map((s) => s.toLowerCase());
    const bsNames = ['balance sheet'].map((s) => s.toLowerCase());
    const cfNames = ['cash flow', 'cash flows', 'statement of cash flows'].map((s) =>
      s.toLowerCase()
    );

    const getByGuess = (candidates) => {
      const hit = wb.SheetNames.find((s) => candidates.includes(s.toLowerCase()));
      return hit || null;
    };

    const incomeSheetName = getByGuess(isNames) || wb.SheetNames[0];
    const balanceSheetName = getByGuess(bsNames) || wb.SheetNames[1] || wb.SheetNames[0];
    const cashFlowName = getByGuess(cfNames) || wb.SheetNames[2] || wb.SheetNames[0];

    const toJSON = (sheetName) =>
      XLSX.utils.sheet_to_json(wb.Sheets[sheetName] || {}, { header: 1, defval: null });

    const incomeData = toJSON(incomeSheetName);
    const balanceData = toJSON(balanceSheetName);
    const cashFlowData = toJSON(cashFlowName);

    // Very lightweight “analysis” stub — replace with real calcs later
    const analysis = {
      presentation_title: `Financial Analysis – ${originalName}`,
      executive_summary: [
        `Parsed: ${incomeSheetName}, ${balanceSheetName}, ${cashFlowName}`,
        'Preliminary KPIs computed (stub).',
        'See following slides for highlights.',
      ],
      slides: [
        {
          title: 'Income Statement Highlights',
          content: [
            `Rows: ${incomeData.length}`,
            'Revenue trends: (placeholder)',
            'Margins & OpEx: (placeholder)',
          ],
        },
        {
          title: 'Balance Sheet Highlights',
          content: [
            `Rows: ${balanceData.length}`,
            'Liquidity & working capital: (placeholder)',
            'Leverage snapshot: (placeholder)',
          ],
        },
        {
          title: 'Cash Flow Highlights',
          content: [
            `Rows: ${cashFlowData.length}`,
            'Operating cash: (placeholder)',
            'Investing/Financing flows: (placeholder)',
          ],
        },
      ],
    };

    // Build PPTX
    const pptBuffer = await createPowerPoint(analysis);

    // Send back the PPTX for download
    const filename = `financial-analysis-${Date.now()}.pptx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pptBuffer);
  } catch (error) {
    console.error('API Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Analysis failed', message: error.message });
    }
  }
}
