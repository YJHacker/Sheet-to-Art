// tests/unit/layout-worker.test.ts
import { describe, it, expect } from 'vitest';
import type { CellIR } from '../../src/types/cell-ir';
import { LayoutWorker } from '../../src/workers/layout.worker';
import { layoutWorker } from '../../src/lib/workers';

describe('Layout Worker & RPC API', () => {
  const sampleCellIR: CellIR = {
    metadata: { fileName: 'test.csv', sheetName: 'Sheet1', totalRows: 2, totalCols: 2 },
    rows: [
      {
        rowIndex: 0,
        cells: [
          { value: 'Item', type: 'string', style: { bold: true }, position: { row: 0, col: 0 } },
          { value: 'Qty', type: 'string', style: { bold: true }, position: { row: 0, col: 1 } },
        ],
      },
      {
        rowIndex: 1,
        cells: [
          { value: 'Book', type: 'string', position: { row: 1, col: 0 } },
          { value: 12, type: 'number', position: { row: 1, col: 1 } },
        ],
      },
    ],
  };

  it('should analyze layout directly via LayoutWorker class instance', async () => {
    const worker = new LayoutWorker();
    const progressUpdates: number[] = [];

    const layout = await worker.analyzeLayout(
      sampleCellIR,
      { pageSize: 'letter' },
      p => progressUpdates.push(p)
    );

    expect(layout.documentType).toBe('table');
    expect(layout.globalStyles.pageSize).toBe('letter');
    expect(progressUpdates.length).toBeGreaterThan(0);
  });

  it('should analyze layout via workers.ts layoutWorker helper', async () => {
    const layout = await layoutWorker.analyzeLayout(sampleCellIR);
    expect(layout.documentType).toBe('table');
    expect(layout.sections).toHaveLength(1);
  });
});
