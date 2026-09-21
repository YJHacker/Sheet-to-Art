import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { parseCSV } from '../../src/workers/csv-parser';

describe('CSV Parser', () => {
  it('should parse a simple comma-delimited CSV', async () => {
    const buffer = readFileSync('tests/fixtures/simple.csv');
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const result = await parseCSV(arrayBuffer, 'simple.csv');

    expect(result.metadata.fileName).toBe('simple.csv');
    expect(result.rows).toHaveLength(4);

    const headerRow = result.rows[0];
    expect(headerRow?.cells[0]?.value).toBe('Name');
    expect(headerRow?.cells[1]?.value).toBe('Age');
    expect(headerRow?.cells[2]?.value).toBe('City');

    const dataRow = result.rows[1];
    expect(dataRow?.cells[0]?.value).toBe('Alice');
    expect(dataRow?.cells[1]?.value).toBe(30);
    expect(dataRow?.cells[2]?.value).toBe('NYC');
  });

  it('should auto-detect semicolon delimiter', async () => {
    const buffer = readFileSync('tests/fixtures/semicolon.csv');
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const result = await parseCSV(arrayBuffer, 'semicolon.csv');

    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]?.cells[0]?.value).toBe('Product');
    expect(result.rows[0]?.cells[1]?.value).toBe('Price');
    expect(result.rows[1]?.cells[0]?.value).toBe('Widget');
  });

  it('should infer numeric type for numeric strings', async () => {
    const buffer = readFileSync('tests/fixtures/simple.csv');
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const result = await parseCSV(arrayBuffer, 'simple.csv');

    const ageCell = result.rows[1]?.cells[1];
    expect(ageCell?.value).toBe(30);
    expect(ageCell?.type).toBe('number');
  });

  it('should normalize rows with inconsistent column counts', async () => {
    const csvText = `A,B,C\n1,2,3,4,5\nX,Y`;
    const buffer = new TextEncoder().encode(csvText);

    const result = await parseCSV(buffer.buffer as ArrayBuffer, 'inconsistent.csv');

    // Should normalize to max column count (5)
    expect(result.metadata.totalCols).toBe(5);

    // Row 0: 3 cells
    expect(result.rows[0]?.cells).toHaveLength(3);

    // Row 1: 5 cells
    expect(result.rows[1]?.cells).toHaveLength(5);

    // Row 2: 2 cells
    expect(result.rows[2]?.cells).toHaveLength(2);
  });
});
