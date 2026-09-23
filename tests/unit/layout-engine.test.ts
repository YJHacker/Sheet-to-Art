// tests/unit/layout-engine.test.ts
import { describe, it, expect } from 'vitest';
import type { CellIR } from '../../src/types/cell-ir';
import { analyzeCellIR } from '../../src/lib/layout/layout-engine';
import type { TableSection } from '../../src/types/layout-ir';

describe('Layout Engine Orchestrator', () => {
  it('should transform complete CellIR into production-ready LayoutIR', () => {
    const cellIR: CellIR = {
      metadata: { fileName: 'sales.xlsx', sheetName: 'Q3 Sales', totalRows: 3, totalCols: 3 },
      rows: [
        {
          rowIndex: 0,
          cells: [
            { value: 'Item', type: 'string', style: { bold: true }, position: { row: 0, col: 0 } },
            { value: 'Units', type: 'string', style: { bold: true }, position: { row: 0, col: 1 } },
            { value: 'Revenue', type: 'string', style: { bold: true }, position: { row: 0, col: 2 } },
          ],
        },
        {
          rowIndex: 1,
          cells: [
            { value: 'Product X', type: 'string', position: { row: 1, col: 0 } },
            { value: 50, type: 'number', position: { row: 1, col: 1 } },
            { value: 5000, type: 'number', style: { numFmt: '$#,##0.00' }, position: { row: 1, col: 2 } },
          ],
        },
        {
          rowIndex: 2,
          cells: [
            { value: 'Product Y', type: 'string', position: { row: 2, col: 0 } },
            { value: 80, type: 'number', position: { row: 2, col: 1 } },
            { value: 9600, type: 'number', style: { numFmt: '$#,##0.00' }, position: { row: 2, col: 2 } },
          ],
        },
      ],
    };

    const layout = analyzeCellIR(cellIR, { pageSize: 'a4', theme: 'modern-clean' });

    expect(layout.documentType).toBe('table');
    expect(layout.sections).toHaveLength(1);
    expect(layout.globalStyles.pageSize).toBe('a4');
    expect(layout.globalStyles.orientation).toBe('portrait');

    const table = layout.sections[0]!.content as TableSection;
    expect(table.columns).toHaveLength(3);
    expect(table.columns[2]!.dataType).toBe('number');
    expect(table.columns[2]!.alignment).toBe('right');
    expect(table.columns[2]!.suggestedWidth).toBeGreaterThanOrEqual(table.columns[2]!.minWidth);
  });
});
