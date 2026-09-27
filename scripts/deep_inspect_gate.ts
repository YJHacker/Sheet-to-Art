import { readFileSync } from 'fs';
import ExcelJS from 'exceljs';
import { parseXLSX, getWorkbookInfoXLSX } from '../src/workers/xlsx-parser';
import { analyzeCellIR } from '../src/lib/layout/layout-engine';
import { generateTypstDocument } from '../src/lib/typst/typst-generator';

async function main() {
  const filePath = 'tests/fixtures/GATE2027_Tracker_AllBranches.xlsx';
  const fileBuffer = readFileSync(filePath);
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength
  );

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  console.log('=== WORKBOOK OVERVIEW ===');
  console.log(`Total sheets: ${workbook.worksheets.length}`);
  workbook.worksheets.forEach((ws, i) => {
    console.log(`Sheet [${i}] "${ws.name}": rowCount=${ws.rowCount}, actualRowCount=${ws.actualRowCount}, colCount=${ws.columnCount}, actualColCount=${ws.actualColumnCount}`);
  });

  for (let i = 0; i < workbook.worksheets.length; i++) {
    const ws = workbook.worksheets[i]!;
    console.log(`\n========================================================`);
    console.log(`=== RAW EXCEL INSPECTION: SHEET ${i} "${ws.name}" ===`);
    console.log(`========================================================`);

    // Merged cells
    const merges = (ws as any)._merges ? Object.keys((ws as any)._merges) : [];
    console.log(`Merged regions count: ${merges.length}`);
    if (merges.length > 0) {
      console.log(`Sample merges:`, merges.slice(0, 10));
    }

    // Inspect first 60 rows
    console.log(`\n--- First 40 rows content & formatting ---`);
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= 40) {
        const rowVals: string[] = [];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          if (colNumber <= 10) {
            const valStr = cell.value != null ? (typeof cell.value === 'object' ? JSON.stringify(cell.value) : String(cell.value)) : '';
            const bold = cell.font?.bold ? '[B]' : '';
            const fill = (cell.fill as any)?.fgColor?.argb ? `[#${(cell.fill as any).fgColor.argb}]` : '';
            if (valStr.trim().length > 0) {
              rowVals.push(`C${colNumber}:${bold}${fill}"${valStr.slice(0, 40)}"`);
            }
          }
        });
        if (rowVals.length > 0) {
          console.log(`Row ${rowNumber.toString().padStart(3, ' ')} (${rowVals.length} cells): ${rowVals.join(' | ')}`);
        }
      }
    });

    console.log(`\n--- Pipeline Processing of Sheet ${i} "${ws.name}" ---`);
    const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', i);
    console.log(`CellIR rows: ${cellIR.rows.length}`);

    const layout = analyzeCellIR(cellIR, { pageSize: 'a4', orientation: 'auto', theme: 'modern-clean' });
    console.log(`Layout Document Type: ${layout.documentType}`);
    console.log(`Layout Title: "${layout.title}"`);
    console.log(`Layout Sections Count: ${layout.sections.length}`);

    layout.sections.forEach((sec, sIdx) => {
      console.log(`\n  Section [${sIdx}] Type: ${sec.type}, Title: "${sec.title || '(none)'}"`);
      if (sec.type === 'table') {
        const tbl = sec.content as any;
        console.log(`    Table Columns (${tbl.columns.length}):`, tbl.columns.map((c: any) => `"${c.header}" (${c.dataType}, ${c.suggestedWidth || c.allocatedWidth})`).join(', '));
        console.log(`    Table Rows Count: ${tbl.rows.length}`);
        if (tbl.rows.length > 0) {
          console.log(`    First row sample:`, tbl.rows[0].cells.map((c: any) => `"${String(c.value).slice(0, 30)}"`).join(' | '));
          console.log(`    Last row sample:`, tbl.rows[tbl.rows.length - 1].cells.map((c: any) => `"${String(c.value).slice(0, 30)}"`).join(' | '));
        }
      } else if (sec.type === 'kpi-grid') {
        const kpi = sec.content as any;
        console.log(`    KPI Grid Items (${kpi.items.length}):`, kpi.items.map((it: any) => `[${it.label} = ${it.value}]`).join(', '));
      } else {
        console.log(`    Other content:`, JSON.stringify(sec.content).slice(0, 100));
      }
    });

    const typst = generateTypstDocument(layout, { theme: 'modern-clean' });
    console.log(`\n--- Typst Generation Summary for Sheet ${i} ---`);
    console.log(`Typst lines: ${typst.split('\n').length}`);
    console.log(`First 25 lines of Typst:`);
    console.log(typst.split('\n').slice(0, 25).join('\n'));
  }
}

main().catch(console.error);
