import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { ParserWorker } from '../../src/workers/parser.worker';

describe('End-to-End Parse Flow', () => {
  const worker = new ParserWorker();

  it('should parse XLSX file end-to-end', async () => {
    const buffer = readFileSync('tests/fixtures/styles.xlsx');
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const result = await worker.parseFile(arrayBuffer, 'styles.xlsx', 0);

    expect(result.metadata.fileName).toBe('styles.xlsx');
    expect(result.metadata.sheetName).toBe('Sheet1');
    expect(result.rows.length).toBeGreaterThan(0);

    // Verify style extraction
    const headerCell = result.rows[0]?.cells[0];
    expect(headerCell?.style?.bold).toBe(true);
    expect(headerCell?.style?.bgColor).toBeDefined();

    const priceCell = result.rows[1]?.cells[1];
    expect(priceCell?.value).toBe(19.99);
    expect(priceCell?.style?.numFmt).toContain('$');
  });

  it('should parse CSV file end-to-end', async () => {
    const buffer = readFileSync('tests/fixtures/simple.csv');
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const result = await worker.parseFile(arrayBuffer, 'simple.csv');

    expect(result.metadata.fileName).toBe('simple.csv');
    expect(result.rows).toHaveLength(4);

    // Verify type inference
    const ageCell = result.rows[1]?.cells[1];
    expect(ageCell?.value).toBe(30);
    expect(ageCell?.type).toBe('number');
  });

  it('should handle large file without blocking or failing', async () => {
    // Generate a synthetic large CSV (1000 rows x 10 columns)
    const rows = Array.from({ length: 1000 }, (_, i) =>
      Array.from({ length: 10 }, (_, j) => `Cell_${i}_${j}`).join(',')
    );
    const csvText = rows.join('\n');
    const buffer = new TextEncoder().encode(csvText);

    const startTime = Date.now();
    const result = await worker.parseFile(buffer.buffer as ArrayBuffer, 'large.csv');
    const endTime = Date.now();

    expect(result.rows).toHaveLength(1000);
    expect(result.metadata.totalCols).toBe(10);
    expect(endTime - startTime).toBeLessThan(2000); // Should complete in < 2 seconds
  });

  describe('GATE 2027 Real Workbook Parse Flow', () => {
    const gateBuffer = readFileSync('tests/fixtures/GATE2027_Tracker_AllBranches.xlsx');
    const gateArrayBuffer = gateBuffer.buffer.slice(
      gateBuffer.byteOffset,
      gateBuffer.byteOffset + gateBuffer.byteLength
    );

    it('should extract workbook info with all 7 sheets from real GATE workbook', async () => {
      const info = await worker.getWorkbookInfo(gateArrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx');
      expect(info.sheetNames).toEqual(['START HERE', 'CS', 'DA', 'ECE', 'EE', 'ME', 'CE']);
      expect(info.sheets).toHaveLength(7);
      expect(info.sheets[0]!.name).toBe('START HERE');
      expect(info.sheets[1]!.name).toBe('CS');
    });

    it('should parse each sheet with accurate dimensions and styles', async () => {
      const sheet0 = await worker.parseFile(gateArrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', 0);
      expect(sheet0.metadata.sheetName).toBe('START HERE');
      expect(sheet0.metadata.totalRows).toBe(57);
      expect(sheet0.metadata.totalCols).toBe(5);

      const sheet1 = await worker.parseFile(gateArrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', 1);
      expect(sheet1.metadata.sheetName).toBe('CS');
      expect(sheet1.metadata.totalRows).toBe(138);
      expect(sheet1.metadata.totalCols).toBe(5);
    });
  });
});
