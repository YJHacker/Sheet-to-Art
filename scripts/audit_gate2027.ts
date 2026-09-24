import fs from 'fs';
import { parserWorker, layoutWorker, typstWorker } from '../src/lib/workers';
import { executeDocumentPipeline, recompilePDF } from '../src/lib/pipeline/document-pipeline';
import { DEFAULT_STUDIO_OPTIONS } from '../src/store/useStudioStore';
import ExcelJS from 'exceljs';

async function audit() {
  console.log('=== STARTING FORENSIC AUDIT OF GATE2027 WORKBOOK ===');
  const filePath = '/root/tests/fixtures/GATE2027_Tracker_AllBranches.xlsx';
  const fileBuffer = fs.readFileSync(filePath);
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

  // 1. Inspect workbook with ExcelJS directly to see all sheets
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  console.log(`Total sheets in workbook: ${workbook.worksheets.length}`);
  const sheetNames = workbook.worksheets.map(ws => ws.name);
  console.log('Sheet names:', sheetNames);

  // 2. Test Parser Worker on Sheet 0
  console.log('\n--- 2. PARSER WORKER (Sheet 0) ---');
  try {
    const cellIR0 = await parserWorker.parseFile(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', 0);
    console.log('CellIR 0 metadata:', cellIR0.metadata);
    console.log('CellIR 0 rows count:', cellIR0.rows.length);
  } catch (err: any) {
    console.error('Parser worker sheet 0 failed:', err.message, err.stack);
  }

  // 3. Test Parser Worker across ALL sheets
  console.log('\n--- 3. PARSER WORKER (All Sheets) ---');
  for (let i = 0; i < sheetNames.length; i++) {
    try {
      const cellIR = await parserWorker.parseFile(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', i);
      console.log(`Sheet [${i}] '${sheetNames[i]}': ${cellIR.metadata.totalRows} rows, ${cellIR.metadata.totalCols} cols`);
    } catch (err: any) {
      console.error(`Sheet [${i}] '${sheetNames[i]}' failed:`, err.message);
    }
  }

  // 4. Test Layout Worker on Sheet 0
  console.log('\n--- 4. LAYOUT WORKER ---');
  try {
    const cellIR0 = await parserWorker.parseFile(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', 0);
    const layoutIR0 = await layoutWorker.analyzeLayout(cellIR0, { pageSize: 'a4', orientation: 'auto' });
    console.log('LayoutIR 0 sections count:', layoutIR0.sections.length);
    console.log('LayoutIR 0 sections types:', layoutIR0.sections.map(s => ({ type: s.type, title: s.title })));
  } catch (err: any) {
    console.error('Layout worker failed:', err.message, err.stack);
  }

  // 5. Test Typst Worker / PDF compilation on Sheet 0
  console.log('\n--- 5. TYPST WORKER & PDF GENERATION ---');
  try {
    const cellIR0 = await parserWorker.parseFile(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', 0);
    const layoutIR0 = await layoutWorker.analyzeLayout(cellIR0, { pageSize: 'a4', orientation: 'auto' });
    const typstMarkup = await typstWorker.generateMarkup(layoutIR0, { theme: 'modern-clean' });
    console.log('Typst markup length:', typstMarkup.length);
    console.log('Typst markup snippet:\n', typstMarkup.slice(0, 300));
    const pdfResult = await typstWorker.renderLayoutToPDF(layoutIR0, { theme: 'modern-clean' });
    console.log('PDF rendered successfully! Page count:', pdfResult.pageCount, 'Bytes:', pdfResult.pdfBuffer.byteLength);
  } catch (err: any) {
    console.error('Typst worker failed:', err.message, err.stack);
  }

  // 6. Test full executeDocumentPipeline
  console.log('\n--- 6. FULL DOCUMENT PIPELINE ---');
  try {
    const result = await executeDocumentPipeline(
      arrayBuffer,
      'GATE2027_Tracker_AllBranches.xlsx',
      0,
      DEFAULT_STUDIO_OPTIONS,
      (p) => console.log(`Progress callback: [${p.stage}] ${p.percent}% - ${p.message}`)
    );
    console.log('executeDocumentPipeline completed! Result pages:', result.pdfResult.pageCount);
  } catch (err: any) {
    console.error('executeDocumentPipeline failed:', err.message, err.stack);
  }
}

audit().catch(console.error);
