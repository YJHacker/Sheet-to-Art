import type {
  ColumnDescriptor,
  GlobalStyles,
  PageSizeType,
  OrientationType,
  PageMargins,
} from '../../types/layout-ir';

export interface PageDimensions {
  width: number;  // pt
  height: number; // pt
}

// 1 inch = 72 points, 1 mm = 2.83465 points
export const PAGE_DIMENSIONS: Record<PageSizeType, PageDimensions> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612.00, height: 792.00 },
  legal: { width: 612.00, height: 1008.00 },
  a3: { width: 841.89, height: 1190.55 },
  a5: { width: 419.53, height: 595.28 },
};

export const DEFAULT_MARGINS: PageMargins = {
  top: 36,     // 0.5 in
  right: 36,
  bottom: 36,
  left: 36,
};

/**
 * Proportionally allocates column widths across available printable width
 * using square-root character length weighting to prevent wide text columns
 * from crushing concise numeric columns.
 */
export function allocateColumnWidths(
  columns: ColumnDescriptor[],
  availableWidthPt: number
): ColumnDescriptor[] {
  if (columns.length === 0) return [];

  const weights = columns.map(col => Math.max(Math.sqrt(col.stats.maxLength || 5), 2.0));
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);

  // Allocate proportionally
  let allocated = columns.map((col, idx) => {
    const weightRatio = (weights[idx] ?? 1) / (totalWeight || 1);
    const proportionalWidth = availableWidthPt * weightRatio;
    const clamped = Math.max(col.minWidth, Math.min(proportionalWidth, col.maxWidth * 1.5));
    return {
      ...col,
      suggestedWidth: clamped,
    };
  });

  // Normalize so sum equals availableWidthPt exactly
  const currentSum = allocated.reduce((sum, c) => sum + c.suggestedWidth, 0);
  if (currentSum > 0) {
    const scaleFactor = availableWidthPt / currentSum;
    allocated = allocated.map(c => ({
      ...c,
      suggestedWidth: Math.round(c.suggestedWidth * scaleFactor * 10) / 10,
    }));
  }

  return allocated;
}

/**
 * Determines optimal page orientation, margins, base font size, and column widths.
 */
export function optimizePageGeometry(
  columns: ColumnDescriptor[],
  preferredPageSize: PageSizeType = 'a4',
  preferredOrientation: OrientationType | 'auto' = 'auto',
  theme: string = 'modern-clean',
  fontFamily: string = 'Inter'
): { globalStyles: GlobalStyles; optimizedColumns: ColumnDescriptor[] } {
  const baseDim = PAGE_DIMENSIONS[preferredPageSize] || PAGE_DIMENSIONS.a4;
  const margins = { ...DEFAULT_MARGINS };

  const portraitPrintableWidth = baseDim.width - margins.left - margins.right;
  const landscapePrintableWidth = baseDim.height - margins.left - margins.right;

  const totalMinWidth = columns.reduce((sum, col) => sum + col.minWidth, 0);
  const totalSuggestedWidth = columns.reduce((sum, col) => sum + col.suggestedWidth, 0);

  let orientation: OrientationType = 'portrait';
  if (preferredOrientation === 'landscape') {
    orientation = 'landscape';
  } else if (preferredOrientation === 'portrait') {
    orientation = 'portrait';
  } else {
    // Auto-detect orientation
    if (totalMinWidth > portraitPrintableWidth || totalSuggestedWidth > portraitPrintableWidth * 1.1) {
      orientation = 'landscape';
    } else {
      orientation = 'portrait';
    }
  }

  const printableWidth = orientation === 'landscape' ? landscapePrintableWidth : portraitPrintableWidth;

  // Font scaling if table exceeds printable area
  let baseFontSize = 9.0;
  if (totalMinWidth > printableWidth) {
    const overflowRatio = printableWidth / totalMinWidth;
    baseFontSize = Math.max(7.5, Math.round(9.0 * overflowRatio * 10) / 10);
  }

  const optimizedColumns = allocateColumnWidths(columns, printableWidth);

  const globalStyles: GlobalStyles = {
    pageSize: preferredPageSize,
    orientation,
    margins,
    fontFamily,
    baseFontSize,
    theme,
  };

  return { globalStyles, optimizedColumns };
}
