import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { parseXLSX, getWorkbookInfoXLSX } from '../src/workers/xlsx-parser';
import { analyzeCellIR } from '../src/lib/layout/layout-engine';
import { generateTypstDocument } from '../src/lib/typst/typst-generator';
import { compileLayoutToPDF } from '../src/lib/typst/typst-compiler';
import { PDFDocument } from 'pdf-lib';

async function auditAllSheets() {
  const filePath = path.resolve('tests/fixtures/GATE2027_Tracker_AllBranches.xlsx');
  const fileBuffer = fs.readFileSync(filePath);
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  const wbInfo = await getWorkbookInfoXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx');

  console.log('=== AUDIT ALL SHEETS FIDELITY ===');
  console.log(`Workbook: ${filePath} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);
  console.log(`Discovered ${wbInfo.sheets.length} sheets:`, wbInfo.sheetNames);

  for (let sIdx = 0; sIdx < wbInfo.sheets.length; sIdx++) {
    const sheetName = wbInfo.sheetNames[sIdx];
    const ws = workbook.worksheets[sIdx];

    console.log(`\n================================================================`);
    console.log(`SHEET ${sIdx}: "${sheetName}"`);
    console.log(`================================================================`);

    // 1. Raw Excel inspection: scan all rows and list distinct visual blocks
    const rawBlocks: { startRow: number; endRow: number; header: string; type: string; rowCount: number }[] = [];
    let currentBlock: any = null;

    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const firstCell = row.getCell(1);
      const val = firstCell.value != null ? (typeof firstCell.value === 'object' ? JSON.stringify(firstCell.value) : String(firstCell.value)).trim() : '';
      const isBold = !!firstCell.font?.bold;
      const hasBg = !!(firstCell.fill as any)?.fgColor?.argb;
      const cellCount = row.actualCellCount;

      // Detect header/title rows in Excel
      if (val && (isBold || hasBg) && (val.length > 5 || val.match(/^[0-9]+ ·/))) {
        // Potential section header
      }
    });

    // 2. CellIR
    const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', sIdx);
    console.log(`CellIR: ${cellIR.rows.length} rows, ${cellIR.metadata.totalCols} cols`);

    // 3. LayoutIR
    const layout = analyzeCellIR(cellIR, { pageSize: 'a4', orientation: 'auto', theme: 'modern-clean' });
    console.log(`Layout: docType="${layout.documentType}", title="${layout.title}", sections=${layout.sections.length}, orientation=${layout.globalStyles.orientation}`);

    // Print all sections in LayoutIR
    layout.sections.forEach((sec, idx) => {
      let detail = '';
      if (sec.type === 'table') {
        const tbl = sec.content as any;
        const colNames = tbl.columns.map((c: any) => c.header).join(' | ');
        detail = `cols=${tbl.columns.length} [${colNames}] rows=${tbl.rows.length}`;
      } else if (sec.type === 'kpi-grid') {
        const kpi = sec.content as any;
        detail = `items=${kpi.items.map((it: any) => `${it.label}: ${it.value}`).join(', ')}`;
      } else if (sec.type === 'text') {
        const txt = sec.content as any;
        detail = `paragraphs=${txt.paragraphs.length} (first: "${txt.paragraphs[0]?.slice(0, 60)}...")`;
      }
      console.log(`  [Sec ${idx}] ${sec.type.toUpperCase()}: "${sec.title || '(untitled)'}" -> ${detail}`);
    });

    // 4. Typst & PDF
    const typstMarkup = generateTypstDocument(layout, { theme: 'modern-clean' });
    const pdfResult = await compileLayoutToPDF(layout, { theme: 'modern-clean' });
    const pdfDoc = await PDFDocument.load(pdfResult.pdfBuffer);

    console.log(`PDF: ${pdfResult.pageCount} pages (${pdfDoc.getPageCount()} actual pages), ${pdfResult.pdfBuffer.length} bytes`);
  }
}

auditAllSheets().catch(console.error);
