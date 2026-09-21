import ExcelJS from 'exceljs';
import { writeFileSync, mkdirSync } from 'fs';

mkdirSync('tests/fixtures', { recursive: true });

async function generateSimpleTable() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');

  sheet.getCell('A1').value = 'Name';
  sheet.getCell('B1').value = 'Age';
  sheet.getCell('C1').value = 'City';

  sheet.getCell('A2').value = 'Alice';
  sheet.getCell('B2').value = 30;
  sheet.getCell('C2').value = 'NYC';

  sheet.getCell('A3').value = 'Bob';
  sheet.getCell('B3').value = 25;
  sheet.getCell('C3').value = 'LA';

  const buffer = await workbook.xlsx.writeBuffer();
  writeFileSync('tests/fixtures/simple-table.xlsx', Buffer.from(buffer));
}

async function generateMergedCells() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');

  sheet.mergeCells('A1:C1');
  sheet.getCell('A1').value = 'Report Title';
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  sheet.getCell('A2').value = 'Col1';
  sheet.getCell('B2').value = 'Col2';
  sheet.getCell('C2').value = 'Col3';

  const buffer = await workbook.xlsx.writeBuffer();
  writeFileSync('tests/fixtures/merged-cells.xlsx', Buffer.from(buffer));
}

async function generateStyles() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');

  const headerRow = sheet.getRow(1);
  headerRow.getCell(1).value = 'Product';
  headerRow.getCell(2).value = 'Price';
  headerRow.getCell(1).font = { bold: true };
  headerRow.getCell(2).font = { bold: true };
  headerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
  headerRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

  sheet.getCell('A2').value = 'Widget';
  sheet.getCell('B2').value = 19.99;
  sheet.getCell('B2').numFmt = '$#,##0.00';

  const buffer = await workbook.xlsx.writeBuffer();
  writeFileSync('tests/fixtures/styles.xlsx', Buffer.from(buffer));
}

await generateSimpleTable();
await generateMergedCells();
await generateStyles();
console.log('Fixtures generated successfully');
