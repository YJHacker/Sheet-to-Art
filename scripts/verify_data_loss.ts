import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { parseXLSX } from '../src/workers/xlsx-parser';
import { analyzeCellIR } from '../src/lib/layout/layout-engine';
import { generateTypstDocument } from '../src/lib/typst/typst-generator';

async function verifyDataLoss() {
  const filePath = path.resolve('tests/fixtures/GATE2027_Tracker_AllBranches.xlsx');
  const fileBuffer = fs.readFileSync(filePath);
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  console.log('=== DATA LOSS VERIFICATION ACROSS ALL 7 SHEETS ===\n');

  let totalExcelCells = 0;
  let totalPreservedCells = 0;
  let totalMissingCells = 0;

  for (let sIdx = 0; sIdx < workbook.worksheets.length; sIdx++) {
    const ws = workbook.worksheets[sIdx];
    const sheetName = ws.name;

    const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', sIdx);
    const layout = analyzeCellIR(cellIR, { pageSize: 'a4', orientation: 'auto', theme: 'modern-clean' });
    const typst = generateTypstDocument(layout, { theme: 'modern-clean' });

    // Collect all unique meaningful strings from Excel (length >= 3, not placeholders)
    const excelStrings: { row: number; col: number; text: string }[] = [];
    ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
      row.eachCell({ includeEmpty: false }, (cell, colNum) => {
        let val = cell.value != null ? (typeof cell.value === 'object' ? JSON.stringify(cell.value) : String(cell.value)).trim() : '';
        if (val.length > 3 && !val.startsWith('____') && !val.startsWith('[ ]')) {
          // Clean val of excessive whitespace/newlines for search
          excelStrings.push({ row: rowNum, col: colNum, text: val });
        }
      });
    });

    let sheetPreserved = 0;
    let sheetMissing: { row: number; col: number; text: string }[] = [];

    excelStrings.forEach(es => {
      totalExcelCells++;
      // Check if substring of length >= 15 exists in Typst or Layout
      const searchProbe = es.text.length > 20 ? es.text.slice(0, 20) : es.text;
      // Also test normalized search (without special chars)
      const normProbe = searchProbe.replace(/[\n\r\t]+/g, ' ').trim();
      if (typst.includes(normProbe) || typst.includes(es.text.slice(0, 10))) {
        sheetPreserved++;
        totalPreservedCells++;
      } else {
        sheetMissing.push(es);
        totalMissingCells++;
      }
    });

    console.log(`Sheet [${sIdx}] "${sheetName}":`);
    console.log(`  Total Meaningful Text Cells Checked: ${excelStrings.length}`);
    console.log(`  Preserved in Typst/Layout: ${sheetPreserved}`);
    console.log(`  Missing / Unmatched: ${sheetMissing.length}`);
    if (sheetMissing.length > 0) {
      console.log(`  Sample Missing Cells:`);
      sheetMissing.slice(0, 5).forEach(m => console.log(`    Row ${m.row}, Col ${m.col}: "${m.text.slice(0, 60)}"`));
    }
    console.log('');
  }

  console.log(`=== TOTAL SUMMARY ===`);
  console.log(`Total Text Cells: ${totalExcelCells}`);
  console.log(`Total Preserved: ${totalPreservedCells} (${((totalPreservedCells / totalExcelCells) * 100).toFixed(2)}%)`);
  console.log(`Total Missing: ${totalMissingCells}`);
}

verifyDataLoss().catch(console.error);
