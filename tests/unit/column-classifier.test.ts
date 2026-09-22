import { describe, it, expect } from 'vitest';
import type { Cell } from '../../src/types/cell-ir';
import { classifyColumn } from '../../src/lib/layout/column-classifier';

describe('Column Classifier & Type Inference', () => {
  it('should classify numeric integer column with right alignment', () => {
    const cells: Cell[] = [
      { value: 10, type: 'number', position: { row: 1, col: 0 } },
      { value: 25, type: 'number', position: { row: 2, col: 0 } },
      { value: 100, type: 'number', position: { row: 3, col: 0 } },
    ];

    const descriptor = classifyColumn(cells, 'Quantity', 0);
    expect(descriptor.dataType).toBe('number');
    expect(descriptor.alignment).toBe('right');
    expect(descriptor.numberFormat).toBe('integer');
    expect(descriptor.stats.nullCount).toBe(0);
    expect(descriptor.stats.uniqueValues).toBe(3);
  });

  it('should detect currency format from numFmt or dollar string values', () => {
    const cells: Cell[] = [
      { value: 1250.5, type: 'number', style: { numFmt: '$#,##0.00' }, position: { row: 1, col: 0 } },
      { value: 99.99, type: 'number', style: { numFmt: '$#,##0.00' }, position: { row: 2, col: 0 } },
    ];

    const descriptor = classifyColumn(cells, 'Revenue', 0);
    expect(descriptor.dataType).toBe('number');
    expect(descriptor.alignment).toBe('right');
    expect(descriptor.numberFormat).toBe('currency');
  });

  it('should detect percentage format from numFmt or % values', () => {
    const cells: Cell[] = [
      { value: 0.15, type: 'number', style: { numFmt: '0.0%' }, position: { row: 1, col: 0 } },
      { value: 0.85, type: 'number', style: { numFmt: '0.0%' }, position: { row: 2, col: 0 } },
    ];

    const descriptor = classifyColumn(cells, 'Margin', 0);
    expect(descriptor.dataType).toBe('number');
    expect(descriptor.alignment).toBe('right');
    expect(descriptor.numberFormat).toBe('percentage');
  });

  it('should classify date column with center alignment', () => {
    const cells: Cell[] = [
      { value: '2026-09-21', type: 'date', position: { row: 1, col: 0 } },
      { value: '2026-09-22', type: 'date', position: { row: 2, col: 0 } },
    ];

    const descriptor = classifyColumn(cells, 'Created Date', 0);
    expect(descriptor.dataType).toBe('date');
    expect(descriptor.alignment).toBe('center');
  });

  it('should classify boolean column with center alignment', () => {
    const cells: Cell[] = [
      { value: true, type: 'boolean', position: { row: 1, col: 0 } },
      { value: false, type: 'boolean', position: { row: 2, col: 0 } },
    ];

    const descriptor = classifyColumn(cells, 'Active', 0);
    expect(descriptor.dataType).toBe('boolean');
    expect(descriptor.alignment).toBe('center');
  });

  it('should handle mixed columns with nulls and predominantly numbers gracefully', () => {
    const cells: Cell[] = [
      { value: 100, type: 'number', position: { row: 1, col: 0 } },
      { value: null, type: 'empty', position: { row: 2, col: 0 } },
      { value: 200, type: 'number', position: { row: 3, col: 0 } },
      { value: 'N/A', type: 'string', position: { row: 4, col: 0 } },
    ];

    const descriptor = classifyColumn(cells, 'Score', 0);
    expect(descriptor.stats.nullCount).toBe(1);
    expect(descriptor.dataType).toBe('mixed');
    expect(descriptor.alignment).toBe('left');
  });
});
