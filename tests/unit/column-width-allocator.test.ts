import { describe, it, expect } from 'vitest';
import type { ColumnDescriptor } from '../../src/types/layout-ir';
import {
  allocateColumnWidths,
  optimizePageGeometry,
  PAGE_DIMENSIONS,
} from '../../src/lib/layout/column-width-allocator';

describe('Column Width Allocator & Page Geometry', () => {
  const sampleColumns: ColumnDescriptor[] = [
    {
      index: 0,
      header: 'ID',
      dataType: 'number',
      alignment: 'right',
      minWidth: 30,
      maxWidth: 50,
      suggestedWidth: 40,
      stats: { nullCount: 0, uniqueValues: 10, maxLength: 4 },
    },
    {
      index: 1,
      header: 'Description',
      dataType: 'text',
      alignment: 'left',
      minWidth: 80,
      maxWidth: 300,
      suggestedWidth: 150,
      stats: { nullCount: 0, uniqueValues: 10, maxLength: 50 },
    },
    {
      index: 2,
      header: 'Price',
      dataType: 'number',
      alignment: 'right',
      minWidth: 40,
      maxWidth: 80,
      suggestedWidth: 60,
      stats: { nullCount: 0, uniqueValues: 10, maxLength: 8 },
    },
  ];

  it('should proportionally distribute available printable width using square root weighting', () => {
    const availableWidth = 500; // pt
    const allocated = allocateColumnWidths(sampleColumns, availableWidth);

    const sumWidths = allocated.reduce((sum, col) => sum + col.suggestedWidth, 0);
    expect(sumWidths).toBeCloseTo(availableWidth, 0);
    // Description column should receive significantly more width than ID and Price
    expect(allocated[1]!.suggestedWidth).toBeGreaterThan(allocated[0]!.suggestedWidth);
    expect(allocated[1]!.suggestedWidth).toBeGreaterThan(allocated[2]!.suggestedWidth);
  });

  it('should auto-flip to landscape when total column min-widths exceed portrait printable area', () => {
    // 12 wide columns
    const wideColumns: ColumnDescriptor[] = Array.from({ length: 12 }, (_, i) => ({
      index: i,
      header: `Column Long Title ${i + 1}`,
      dataType: 'text',
      alignment: 'left',
      minWidth: 60,
      maxWidth: 150,
      suggestedWidth: 100,
      stats: { nullCount: 0, uniqueValues: 10, maxLength: 20 },
    }));

    const result = optimizePageGeometry(wideColumns, 'a4', 'auto');
    expect(result.globalStyles.orientation).toBe('landscape');
    expect(result.globalStyles.pageSize).toBe('a4');
  });

  it('should retain portrait when table comfortably fits portrait printable area', () => {
    const compactColumns: ColumnDescriptor[] = [
      {
        index: 0,
        header: 'Task',
        dataType: 'text',
        alignment: 'left',
        minWidth: 60,
        maxWidth: 150,
        suggestedWidth: 100,
        stats: { nullCount: 0, uniqueValues: 5, maxLength: 15 },
      },
      {
        index: 1,
        header: 'Status',
        dataType: 'text',
        alignment: 'center',
        minWidth: 40,
        maxWidth: 80,
        suggestedWidth: 60,
        stats: { nullCount: 0, uniqueValues: 3, maxLength: 8 },
      },
    ];

    const result = optimizePageGeometry(compactColumns, 'a4', 'auto');
    expect(result.globalStyles.orientation).toBe('portrait');
    expect(result.globalStyles.baseFontSize).toBe(9);
  });

  it('should scale down font size when columns exceed standard landscape width', () => {
    // 20 columns
    const superWideColumns: ColumnDescriptor[] = Array.from({ length: 20 }, (_, i) => ({
      index: i,
      header: `Col ${i + 1}`,
      dataType: 'number',
      alignment: 'right',
      minWidth: 50,
      maxWidth: 100,
      suggestedWidth: 60,
      stats: { nullCount: 0, uniqueValues: 10, maxLength: 10 },
    }));

    const result = optimizePageGeometry(superWideColumns, 'a4', 'auto');
    expect(result.globalStyles.orientation).toBe('landscape');
    expect(result.globalStyles.baseFontSize).toBeLessThanOrEqual(8.0);
    expect(result.globalStyles.baseFontSize).toBeGreaterThanOrEqual(7.5);
  });

  it('should export standard page dimensions', () => {
    expect(PAGE_DIMENSIONS.a4.width).toBeCloseTo(595.28, 2);
    expect(PAGE_DIMENSIONS.a4.height).toBeCloseTo(841.89, 2);
    expect(PAGE_DIMENSIONS.letter.width).toBeCloseTo(612.00, 2);
  });
});
