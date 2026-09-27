import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { parseXLSX } from '../src/workers/xlsx-parser';
import { analyzeCellIR } from '../src/lib/layout/layout-engine';
import { generateTypstDocument } from '../src/lib/typst/typst-generator';
import { compileLayoutToPDF } from '../src/lib/typst/typst-compiler';
import { PDFDocument } from 'pdf-lib';

async function auditProductQuality() {
  const fixturePath = path.resolve('tests/fixtures/GATE2027_Tracker_AllBranches.xlsx');
  const fileBuffer = fs.readFileSync(fixturePath);
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  const sheetNames = workbook.worksheets.map(ws => ws.name);

  console.log('================================================================================');
  console.log('=== END-TO-END PRODUCT QUALITY FORENSIC AUDIT: GATE 2027 ===');
  console.log('================================================================================\n');

  for (let sIdx = 0; sIdx < sheetNames.length; sIdx++) {
    const sheetName = sheetNames[sIdx];
    const ws = workbook.worksheets[sIdx];

    console.log(`--------------------------------------------------------------------------------`);
    console.log(`SHEET [${sIdx}]: "${sheetName}"`);
    console.log(`--------------------------------------------------------------------------------`);

    const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', sIdx);
    const layout = analyzeCellIR(cellIR, { pageSize: 'a4', orientation: 'auto', theme: 'modern-clean' });
    const typst = generateTypstDocument(layout, { theme: 'modern-clean' });
    const pdfResult = await compileLayoutToPDF(layout, { theme: 'modern-clean' });

    const pdfDoc = await PDFDocument.load(pdfResult.pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    console.log(`Title: "${layout.title}"`);
    console.log(`Document Type: ${layout.documentType}`);
    console.log(`Orientation: ${layout.globalStyles.orientation} | Page Size: ${layout.globalStyles.pageSize}`);
    console.log(`PDF Pages: ${pageCount} | PDF Buffer Size: ${(pdfResult.pdfBuffer.length / 1024).toFixed(1)} KB`);
    console.log(`Total Sections in LayoutIR: ${layout.sections.length}`);

    // Inspect each section and check for potential issues
    layout.sections.forEach((sec, idx) => {
      console.log(`\n  [Section ${idx}] Type: ${sec.type.toUpperCase()} | Title: "${sec.title || '(none)'}"`);
      if (sec.type === 'table') {
        const tbl = sec.content as any;
        console.log(`    Columns (${tbl.columns.length}):`);
        tbl.columns.forEach((c: any) => {
          console.log(`      - "${c.header}": type=${c.dataType}, align=${c.alignment}, width=${c.suggestedWidth?.toFixed(1)}pt (min=${c.minWidth}pt, max=${c.maxWidth}pt)`);
        });
        console.log(`    Row Count: ${tbl.rows.length}`);
        // Check for empty cells or unusual rows
        let allEmptyRows = 0;
        tbl.rows.forEach((r: any, rIdx: number) => {
          const isAllEmpty = r.cells.every((c: any) => c.value == null || String(c.value).trim() === '');
          if (isAllEmpty) allEmptyRows++;
        });
        if (allEmptyRows > 0) {
          console.log(`    WARNING: ${allEmptyRows} completely empty rows in table!`);
        }
      } else if (sec.type === 'kpi-grid') {
        const kpi = sec.content as any;
        console.log(`    KPI Grid Items (${kpi.items.length}):`);
        kpi.items.forEach((it: any) => {
          console.log(`      * Label: "${it.label}" | Value: "${it.value}"`);
        });
      } else if (sec.type === 'text') {
        const txt = sec.content as any;
        console.log(`    Paragraphs (${txt.paragraphs?.length || 0}):`);
        txt.paragraphs.forEach((p: string, pIdx: number) => {
          console.log(`      [P${pIdx}] "${p.slice(0, 100)}${p.length > 100 ? '...' : ''}"`);
        });
      }
    });

    // Check Typst features
    console.log(`\n  Typst Features Check:`);
    console.log(`    Has Repeating Headers: ${typst.includes('table.header(')}`);
    console.log(`    Has Context Page Header: ${typst.includes('header: context if here().page() > 1')}`);
    console.log(`    Has Page Number Footer: ${typst.includes('counter(page).display()')}`);
    console.log(`    Has Heading Style Rules: ${typst.includes('#heading(')}`);
    console.log(`    Total Typst Lines: ${typst.split('\n').length}`);
    console.log('');
  }
}

auditProductQuality().catch(console.error);
