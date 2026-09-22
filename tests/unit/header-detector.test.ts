import { describe, it, expect } from 'vitest';
import type { CellRow } from '../../src/types/cell-ir';
import { computeHeaderScore, detectHeaderRow } from '../../src/lib/layout/header-detector';

describe('Header Detector Heuristics', () => {
  it('should score bold top row >= 0.90 (S = 0.60*1.0 + 0.30 + 0.05*1.0 + 0.0 + 0.02*1.0 = 0.97)', () => {
    const row: CellRow = {
      rowIndex: 0,
      cells: [
        { value: 'ID', type: 'string', style: { bold: true }, position: { row: 0, col: 0 } },
        { value: 'Name', type: 'string', style: { bold: true }, position: { row: 0, col: 1 } },
        { value: 'Price', type: 'string', style: { bold: true }, position: { row: 0, col: 2 } },
      ],
    };

    const score = computeHeaderScore(row, 0);
    expect(score).toBeCloseTo(0.97, 2);
    expect(score).toBeGreaterThanOrEqual(0.85);
  });

  it('should score non-bold string top row around 0.37 and fail header threshold if not bold or shaded', () => {
    const row: CellRow = {
      rowIndex: 0,
      cells: [
        { value: 'Alpha', type: 'string', position: { row: 0, col: 0 } },
        { value: 'Beta', type: 'string', position: { row: 0, col: 1 } },
      ],
    };

    // B=0, T=0.30, F=1.0, C=0, U=1.0 => 0.0 + 0.30 + 0.05 + 0.0 + 0.02 = 0.37
    const score = computeHeaderScore(row, 0);
    expect(score).toBeCloseTo(0.37, 2);
    expect(score).toBeLessThan(0.85);
  });

  it('should score shaded/colored row at row 1 with bold text correctly', () => {
    const row: CellRow = {
      rowIndex: 1,
      cells: [
        { value: 'Col A', type: 'string', style: { bold: true, bgColor: '#CCCCCC' }, position: { row: 1, col: 0 } },
        { value: 'Col B', type: 'string', style: { bold: true, bgColor: '#CCCCCC' }, position: { row: 1, col: 1 } },
      ],
    };

    // B=1.0 (0.60), T=0.15, F=1.0 (0.05), C=1.0 (0.03), U=1.0 (0.02) => S = 0.60 + 0.15 + 0.05 + 0.03 + 0.02 = 0.85
    const score = computeHeaderScore(row, 1);
    expect(score).toBeCloseTo(0.85, 2);
    expect(score).toBeGreaterThanOrEqual(0.85);
  });

  it('should return 0.0 for empty row or row with no filled cells', () => {
    const emptyRow: CellRow = { rowIndex: 0, cells: [] };
    expect(computeHeaderScore(emptyRow, 0)).toBe(0.0);

    const blankCellsRow: CellRow = {
      rowIndex: 0,
      cells: [
        { value: null, type: 'empty', position: { row: 0, col: 0 } },
        { value: '', type: 'empty', position: { row: 0, col: 1 } },
      ],
    };
    // B=0, T=0.30, F=0, C=0, U=0 => 0.30
    expect(computeHeaderScore(blankCellsRow, 0)).toBe(0.30);
  });

  it('should detect the correct header row index among candidate rows', () => {
    const titleRow: CellRow = {
      rowIndex: 0,
      cells: [
        { value: 'Sales Report 2026', type: 'string', style: { bold: true, fontSize: 16 }, position: { row: 0, col: 0 } },
        { value: null, type: 'empty', position: { row: 0, col: 1 } },
        { value: null, type: 'empty', position: { row: 0, col: 2 } },
      ],
    };
    // Row 0 has 1 bold string cell out of 3 total cells: B = 1/3 = 0.333, T = 0.30, F = 0.333, C = 0, U = 0.333 => S = 0.60(0.333) + 0.30 + 0.05(0.333) + 0.02(0.333) = 0.20 + 0.30 + 0.016 + 0.006 = 0.522 (< 0.85)

    const headerRow: CellRow = {
      rowIndex: 1,
      cells: [
        { value: 'Product', type: 'string', style: { bold: true, bgColor: '#E0E0E0' }, position: { row: 1, col: 0 } },
        { value: 'Units', type: 'string', style: { bold: true, bgColor: '#E0E0E0' }, position: { row: 1, col: 1 } },
        { value: 'Total', type: 'string', style: { bold: true, bgColor: '#E0E0E0' }, position: { row: 1, col: 2 } },
      ],
    };
    // Row 1: B=1.0, T=0.15, F=1.0, C=1.0, U=1.0 => S = 0.85

    const dataRow: CellRow = {
      rowIndex: 2,
      cells: [
        { value: 'Widget A', type: 'string', position: { row: 2, col: 0 } },
        { value: 100, type: 'number', position: { row: 2, col: 1 } },
        { value: 2500, type: 'number', position: { row: 2, col: 2 } },
      ],
    };

    const detected = detectHeaderRow([titleRow, headerRow, dataRow], 5);
    expect(detected).not.toBeNull();
    expect(detected?.headerIndex).toBe(1);
    expect(detected?.score).toBeGreaterThanOrEqual(0.85);
  });
});
