import { readFileSync } from 'fs';
import ExcelJS from 'exceljs';

async function checkRow() {
  const filePath = 'tests/fixtures/GATE2027_Tracker_AllBranches.xlsx';
  const fileBuffer = readFileSync(filePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  const cs = workbook.getWorksheet('CS')!;
  console.log('--- CS rows 120-151 ---');
  cs.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber >= 120) {
      const cells: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cells.push(`C${colNumber}: "${cell.value != null ? (typeof cell.value === 'object' ? JSON.stringify(cell.value) : String(cell.value)) : ''}" [bold=${cell.font?.bold}, fill=${(cell.fill as any)?.fgColor?.argb}]`);
      });
      console.log(`Row ${rowNumber}: ${cells.join(' | ')}`);
    }
  });
}

checkRow();
