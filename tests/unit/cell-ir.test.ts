import { describe, it, expect } from 'vitest';
import type { Cell, CellRow, CellIR } from '../../src/types/cell-ir';

describe('Cell IR Type Definitions', () => {
  it('should accept a valid Cell with all fields', () => {
    const cell: Cell = {
      value: 'Test',
      rawValue: 'Test',
      type: 'string',
      style: {
        bold: true,
        fontSize: 12,
        bgColor: '#FF0000',
        horizontalAlignment: 'left',
      },
      position: { row: 0, col: 0 },
    };

    expect(cell.value).toBe('Test');
    expect(cell.type).toBe('string');
    expect(cell.style?.bold).toBe(true);
  });

  it('should accept a minimal Cell with only required fields', () => {
    const cell: Cell = {
      value: null,
      type: 'empty',
      position: { row: 5, col: 3 },
    };

    expect(cell.value).toBeNull();
    expect(cell.type).toBe('empty');
  });

  it('should accept a valid CellIR structure', () => {
    const cellIR: CellIR = {
      rows: [
        {
          rowIndex: 0,
          cells: [
            { value: 'Header', type: 'string', position: { row: 0, col: 0 } },
          ],
        },
      ],
      metadata: {
        fileName: 'test.xlsx',
        sheetName: 'Sheet1',
        totalRows: 1,
        totalCols: 1,
      },
    };

    expect(cellIR.rows).toHaveLength(1);
    expect(cellIR.metadata.fileName).toBe('test.xlsx');
  });
});
