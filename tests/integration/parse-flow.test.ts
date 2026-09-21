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
});
