// tests/integration/layout-flow.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parserWorker, layoutWorker } from '../../src/lib/workers';
import type { TableSection } from '../../src/types/layout-ir';

describe('Layout Flow Integration Tests', () => {
  it('should parse simple-table.xlsx and construct valid TableSection with headers and column types', async () => {
    const filePath = path.resolve(__dirname, '../fixtures/simple-table.xlsx');
    const buffer = fs.readFileSync(filePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    // 1. Parse into Cell IR
    const cellIR = await parserWorker.parseFile(arrayBuffer, 'simple-table.xlsx');
    expect(cellIR.rows.length).toBeGreaterThanOrEqual(3);

    // 2. Analyze into Layout IR
    const layoutIR = await layoutWorker.analyzeLayout(cellIR, { pageSize: 'a4' });
    expect(layoutIR.documentType).toBe('table');
    expect(layoutIR.sections).toHaveLength(1);

    const table = layoutIR.sections[0]!.content as TableSection;
    expect(table.columns.length).toBe(3);
    expect(table.columns[0]!.header).toBe('Name');
    expect(table.columns[1]!.header).toBe('Age');
    expect(table.columns[2]!.header).toBe('City');
    expect(table.columns[0]!.dataType).toBe('text');
    expect(table.columns[1]!.dataType).toBe('number');
  });

  it('should parse styles.xlsx and retain formatting in LayoutIR', async () => {
    const filePath = path.resolve(__dirname, '../fixtures/styles.xlsx');
    const buffer = fs.readFileSync(filePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const cellIR = await parserWorker.parseFile(arrayBuffer, 'styles.xlsx');
    const layoutIR = await layoutWorker.analyzeLayout(cellIR);

    expect(layoutIR.sections.length).toBeGreaterThanOrEqual(1);
    const table = layoutIR.sections[0]!.content as TableSection;
    expect(table.headerStyle.bold).toBe(true);
  });

  it('should parse simple.csv and determine correct column widths and alignment', async () => {
    const filePath = path.resolve(__dirname, '../fixtures/simple.csv');
    const buffer = fs.readFileSync(filePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const cellIR = await parserWorker.parseFile(arrayBuffer, 'simple.csv');
    const layoutIR = await layoutWorker.analyzeLayout(cellIR, { orientation: 'portrait' });

    expect(layoutIR.globalStyles.orientation).toBe('portrait');
    const table = layoutIR.sections[0]!.content as TableSection;
    expect(table.columns.length).toBe(3);
    expect(table.columns[0]!.alignment).toBe('left');
    expect(table.columns[1]!.alignment).toBe('right');
  });
});
