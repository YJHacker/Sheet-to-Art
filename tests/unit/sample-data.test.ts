import { describe, it, expect } from 'vitest';
import {
  getSampleSpreadsheet,
  listSampleDatasets,
} from '../../src/lib/utils/sample-data';

describe('Sample Datasets Utility', () => {
  it('should list all available sample datasets with descriptions and filenames', () => {
    const datasets = listSampleDatasets();
    expect(datasets.length).toBeGreaterThanOrEqual(3);

    const ids = datasets.map((d) => d.id);
    expect(ids).toContain('financial-statement');
    expect(ids).toContain('sales-report');
    expect(ids).toContain('employee-roster');
  });

  it('should return valid ArrayBuffer and metadata for financial-statement', () => {
    const sample = getSampleSpreadsheet('financial-statement');
    expect(sample).toBeDefined();
    expect(sample.name).toContain('.csv');
    expect(sample.buffer).toBeInstanceOf(ArrayBuffer);
    expect(sample.buffer.byteLength).toBeGreaterThan(50);

    const text = new TextDecoder().decode(sample.buffer);
    expect(text).toContain('Revenue');
    expect(text).toContain('Gross Profit');
  });

  it('should return valid ArrayBuffer and metadata for sales-report', () => {
    const sample = getSampleSpreadsheet('sales-report');
    expect(sample).toBeDefined();
    expect(sample.name).toContain('.csv');
    expect(sample.buffer.byteLength).toBeGreaterThan(50);

    const text = new TextDecoder().decode(sample.buffer);
    expect(text).toContain('Region');
    expect(text).toContain('Sales');
  });

  it('should return valid ArrayBuffer and metadata for employee-roster', () => {
    const sample = getSampleSpreadsheet('employee-roster');
    expect(sample).toBeDefined();
    expect(sample.name).toContain('.csv');
    expect(sample.buffer.byteLength).toBeGreaterThan(50);

    const text = new TextDecoder().decode(sample.buffer);
    expect(text).toContain('Employee');
    expect(text).toContain('Department');
  });

  it('should throw or return fallback for unknown sample dataset ID', () => {
    expect(() => getSampleSpreadsheet('non-existent-id')).toThrow(/Unknown sample dataset/i);
  });
});
