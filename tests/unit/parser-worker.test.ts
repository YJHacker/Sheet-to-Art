import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { ParserWorker } from '../../src/workers/parser.worker';

describe('Parser Worker', () => {
  const worker = new ParserWorker();

  it('should parse XLSX via ParserWorker API', async () => {
    const buffer = readFileSync('tests/fixtures/simple-table.xlsx');
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const result = await worker.parseFile(arrayBuffer, 'simple-table.xlsx', 0);

    expect(result.metadata.fileName).toBe('simple-table.xlsx');
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]?.cells[0]?.value).toBe('Name');
  });

  it('should parse CSV via ParserWorker API', async () => {
    const buffer = readFileSync('tests/fixtures/simple.csv');
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const result = await worker.parseFile(arrayBuffer, 'simple.csv');

    expect(result.metadata.fileName).toBe('simple.csv');
    expect(result.rows).toHaveLength(4);
    expect(result.rows[0]?.cells[0]?.value).toBe('Name');
  });

  it('should reject .xls files with clear error message', async () => {
    const fakeBuffer = new ArrayBuffer(16);

    await expect(
      worker.parseFile(fakeBuffer, 'legacy.xls', 0)
    ).rejects.toThrow('Unsupported file format: .xls');
  });

  it('should reject unknown file extensions with clear error message', async () => {
    const fakeBuffer = new ArrayBuffer(16);

    await expect(
      worker.parseFile(fakeBuffer, 'notes.txt', 0)
    ).rejects.toThrow('Unsupported file format: .txt');
  });
});
