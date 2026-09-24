import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { parseXLSX, getWorkbookInfoXLSX } from '../../src/workers/xlsx-parser';

describe('XLSX Parser', () => {
  it('should parse a simple 3x3 table', async () => {
    const buffer = readFileSync('tests/fixtures/simple-table.xlsx');
    const result = await parseXLSX(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), 'simple-table.xlsx', 0);

    expect(result.metadata.fileName).toBe('simple-table.xlsx');
    expect(result.metadata.sheetName).toBe('Sheet1');
    expect(result.rows).toHaveLength(3);

    const headerRow = result.rows[0];
    expect(headerRow?.rowIndex).toBe(0);
    expect(headerRow?.cells).toHaveLength(3);
    expect(headerRow?.cells[0]?.value).toBe('Name');
    expect(headerRow?.cells[1]?.value).toBe('Age');
    expect(headerRow?.cells[2]?.value).toBe('City');

    const dataRow = result.rows[1];
    expect(dataRow?.cells[0]?.value).toBe('Alice');
    expect(dataRow?.cells[1]?.value).toBe(30);
    expect(dataRow?.cells[2]?.value).toBe('NYC');
  });

  it('should extract all 7 sheet names and metadata from GATE2027 workbook fixture', async () => {
    const buffer = readFileSync('tests/fixtures/GATE2027_Tracker_AllBranches.xlsx');
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const info = await getWorkbookInfoXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx');
    expect(info.sheetNames).toEqual(['START HERE', 'CS', 'DA', 'ECE', 'EE', 'ME', 'CE']);
    expect(info.sheets).toHaveLength(7);
    expect(info.sheets[0]?.name).toBe('START HERE');
    expect(info.sheets[1]?.name).toBe('CS');

    // Parse sheet index 1 (CS)
    const csSheet = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', 1);
    expect(csSheet.metadata.sheetName).toBe('CS');
    expect(csSheet.metadata.sheetNames).toEqual(['START HERE', 'CS', 'DA', 'ECE', 'EE', 'ME', 'CE']);
    expect(csSheet.metadata.activeSheetIndex).toBe(1);
    expect(csSheet.rows.length).toBeGreaterThan(50);
  });

  it('should extract bold and background fill styles', async () => {
    const buffer = readFileSync('tests/fixtures/styles.xlsx');
    const result = await parseXLSX(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), 'styles.xlsx', 0);

    const headerCell = result.rows[0]?.cells[0];
    expect(headerCell?.style?.bold).toBe(true);
    expect(headerCell?.style?.bgColor).toBeDefined();

    const priceCell = result.rows[1]?.cells[1];
    expect(priceCell?.value).toBe(19.99);
    expect(priceCell?.style?.numFmt).toContain('$');
  });

  it('should produce ONE cell for merged regions, not duplicated values', async () => {
    const buffer = readFileSync('tests/fixtures/merged-cells.xlsx');
    const result = await parseXLSX(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), 'merged-cells.xlsx', 0);

    const titleCell = result.rows[0]?.cells[0];
    expect(titleCell?.value).toBe('Report Title');
    expect(titleCell?.style?.horizontalAlignment).toBe('center');

    // Merged cells should only produce ONE cell at the top-left position
    expect(result.rows[0]?.cells).toHaveLength(1);
    expect(result.rows[0]?.cells[0]?.position.col).toBe(0);
  });

  it('should extract cached formula values and strip external workbook references', async () => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');

    sheet.getCell('A1').value = { formula: '=[Book1.xlsx]Sheet1!A1', result: 42 } as unknown as string;
    sheet.getCell('A2').value = { formula: 'SUM(B1:B10)', result: 100 } as unknown as string;

    const buffer = await workbook.xlsx.writeBuffer();
    const arrayBuffer = buffer instanceof ArrayBuffer ? buffer : (buffer as Buffer).buffer.slice((buffer as Buffer).byteOffset, (buffer as Buffer).byteOffset + (buffer as Buffer).byteLength);
    const result = await parseXLSX(arrayBuffer as ArrayBuffer, 'formulas.xlsx', 0);

    expect(result.rows[0]?.cells[0]?.value).toBe(42);
    expect(result.rows[0]?.cells[0]?.type).toBe('formula');

    expect(result.rows[1]?.cells[0]?.value).toBe(100);
    expect(result.rows[1]?.cells[0]?.type).toBe('formula');
  });

  it('should extract effective styles from cells with conditional formatting', async () => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');

    const cell = sheet.getCell('A1');
    cell.value = 100;
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };

    const buffer = await workbook.xlsx.writeBuffer();
    const arrayBuffer = buffer instanceof ArrayBuffer ? buffer : (buffer as Buffer).buffer.slice((buffer as Buffer).byteOffset, (buffer as Buffer).byteOffset + (buffer as Buffer).byteLength);
    const result = await parseXLSX(arrayBuffer as ArrayBuffer, 'conditional.xlsx', 0);

    const styledCell = result.rows[0]?.cells[0];
    expect(styledCell?.style?.bold).toBe(true);
    expect(styledCell?.style?.bgColor).toBe('#FF0000');
  });
});
