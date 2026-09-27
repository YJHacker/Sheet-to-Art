import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { parseXLSX } from '../src/workers/xlsx-parser';
import { analyzeCellIR } from '../src/lib/layout/layout-engine';

async function verifyExactLayoutData() {
  const filePath = path.resolve('tests/fixtures/GATE2027_Tracker_AllBranches.xlsx');
  const fileBuffer = fs.readFileSync(filePath);
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  console.log('=== EXACT LAYOUT DATA FIDELITY AUDIT ===\n');

  let totalExcelDataValues = 0;
  let totalFoundInLayout = 0;
  let missingEntries: any[] = [];

  for (let sIdx = 0; sIdx < workbook.worksheets.length; sIdx++) {
    const ws = workbook.worksheets[sIdx];
    const sheetName = ws.name;

    const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', sIdx);
    const layout = analyzeCellIR(cellIR, { pageSize: 'a4', orientation: 'auto', theme: 'modern-clean' });

    // Collect all strings from LayoutIR: titles, table cells, headers, text paragraphs, kpi items
    const layoutStrings = new Set<string>();
    if (layout.title) layoutStrings.add(layout.title.trim().toLowerCase());
    if (layout.subtitle) layoutStrings.add(layout.subtitle.trim().toLowerCase());

    layout.sections.forEach(sec => {
      if (sec.title) layoutStrings.add(sec.title.trim().toLowerCase());
      if (sec.type === 'table') {
        const tbl = sec.content as any;
        tbl.columns.forEach((c: any) => layoutStrings.add(String(c.header).trim().toLowerCase()));
        tbl.rows.forEach((r: any) => {
          r.cells.forEach((c: any) => {
            if (c.value != null) layoutStrings.add(String(c.value).trim().toLowerCase());
            if (c.formattedValue) layoutStrings.add(String(c.formattedValue).trim().toLowerCase());
          });
        });
      } else if (sec.type === 'text') {
        const txt = sec.content as any;
        txt.paragraphs.forEach((p: string) => layoutStrings.add(p.trim().toLowerCase()));
      } else if (sec.type === 'kpi-grid') {
        const kpi = sec.content as any;
        kpi.items.forEach((it: any) => {
          layoutStrings.add(String(it.label).trim().toLowerCase());
          layoutStrings.add(String(it.value).trim().toLowerCase());
        });
      }
    });

    // Check all Excel non-empty cells
    let sheetExcelCount = 0;
    let sheetFoundCount = 0;
    let sheetMissing: any[] = [];

    ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
      row.eachCell({ includeEmpty: false }, (cell, colNum) => {
        let val = cell.value != null ? (typeof cell.value === 'object' ? JSON.stringify(cell.value) : String(cell.value)).trim() : '';
        if (val.length > 0) {
          sheetExcelCount++;
          totalExcelDataValues++;
          const lower = val.toLowerCase();
          // Check exact match or substring in any layout string
          let found = false;
          for (const ls of layoutStrings) {
            if (ls === lower || ls.includes(lower) || lower.includes(ls)) {
              found = true;
              break;
            }
          }
          if (found) {
            sheetFoundCount++;
            totalFoundInLayout++;
          } else {
            sheetMissing.push({ row: rowNum, col: colNum, text: val });
            missingEntries.push({ sheet: sheetName, row: rowNum, col: colNum, text: val });
          }
        }
      });
    });

    console.log(`Sheet [${sIdx}] "${sheetName}": ${sheetFoundCount} / ${sheetExcelCount} cells matched in LayoutIR (${((sheetFoundCount/sheetExcelCount)*100).toFixed(1)}%)`);
    if (sheetMissing.length > 0) {
      console.log(`  Unmatched cells count: ${sheetMissing.length}`);
      sheetMissing.slice(0, 5).forEach(m => console.log(`    R${m.row}C${m.col}: "${m.text.slice(0, 50)}"`));
    }
  }

  console.log(`\nOVERALL: ${totalFoundInLayout} / ${totalExcelDataValues} total Excel cells preserved in LayoutIR (${((totalFoundInLayout/totalExcelDataValues)*100).toFixed(2)}%)`);
  if (missingEntries.length > 0) {
    console.log(`Total unmatched: ${missingEntries.length}`);
  }
}

verifyExactLayoutData().catch(console.error);
