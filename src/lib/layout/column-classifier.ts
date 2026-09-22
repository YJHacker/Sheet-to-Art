import type { Cell } from '../../types/cell-ir';
import type {
  ColumnDescriptor,
  ColumnDataType,
  NumberFormatType,
  AlignmentType,
  ColumnStats,
} from '../../types/layout-ir';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
const US_DATE_REGEX = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;

/**
 * Classifies data type, alignment, number formats, and statistical profile of a column.
 */
export function classifyColumn(
  cells: Cell[],
  headerText: string = '',
  colIndex: number = 0
): ColumnDescriptor {
  let nullCount = 0;
  let numCount = 0;
  let dateCount = 0;
  let boolCount = 0;
  let stringCount = 0;
  let maxLength = headerText.length;
  const uniqueSet = new Set<string>();

  let hasCurrencyFmt = false;
  let hasPercentFmt = false;
  let hasDecimalVal = false;

  for (const cell of cells) {
    const val = cell.value;
    if (val === null || val === undefined || val === '' || cell.type === 'empty') {
      nullCount++;
      continue;
    }

    const strVal = String(val).trim();
    if (strVal.length > maxLength) {
      maxLength = strVal.length;
    }
    uniqueSet.add(strVal);

    // Style numFmt check
    const numFmt = cell.style?.numFmt?.toLowerCase() || '';
    if (numFmt.includes('$') || numFmt.includes('€') || numFmt.includes('£') || numFmt.includes('¥')) {
      hasCurrencyFmt = true;
    }
    if (numFmt.includes('%')) {
      hasPercentFmt = true;
    }

    // Type classification
    if (cell.type === 'number' || typeof val === 'number') {
      numCount++;
      if (typeof val === 'number' && !Number.isInteger(val)) {
        hasDecimalVal = true;
      }
    } else if (cell.type === 'date' || (val as unknown) instanceof Date || ISO_DATE_REGEX.test(strVal) || US_DATE_REGEX.test(strVal)) {
      dateCount++;
    } else if (cell.type === 'boolean' || typeof val === 'boolean' || strVal.toLowerCase() === 'true' || strVal.toLowerCase() === 'false') {
      boolCount++;
    } else {
      // Check if string can be parsed as currency or number
      if (/^\$?\s?-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(strVal)) {
        numCount++;
        if (strVal.includes('$')) hasCurrencyFmt = true;
        if (strVal.includes('.')) hasDecimalVal = true;
      } else if (/^-?\d+(\.\d+)?%$/.test(strVal)) {
        numCount++;
        hasPercentFmt = true;
      } else {
        stringCount++;
      }
    }
  }

  const filledCount = cells.length - nullCount;
  let dataType: ColumnDataType = 'text';
  let alignment: AlignmentType = 'left';
  let numberFormat: NumberFormatType | undefined = undefined;

  if (filledCount === 0) {
    dataType = 'text';
    alignment = 'left';
  } else if (numCount === filledCount || (numCount / filledCount >= 0.85 && stringCount === 0)) {
    dataType = 'number';
    alignment = 'right';
    if (hasCurrencyFmt) {
      numberFormat = 'currency';
    } else if (hasPercentFmt) {
      numberFormat = 'percentage';
    } else if (hasDecimalVal) {
      numberFormat = 'decimal';
    } else {
      numberFormat = 'integer';
    }
  } else if (dateCount / filledCount >= 0.8) {
    dataType = 'date';
    alignment = 'center';
  } else if (boolCount / filledCount >= 0.8) {
    dataType = 'boolean';
    alignment = 'center';
  } else if (stringCount / filledCount >= 0.8) {
    dataType = 'text';
    alignment = 'left';
  } else {
    dataType = 'mixed';
    alignment = 'left';
  }

  // Explicit cell style alignment override if consistent
  const explicitAlign = cells.find(c => c.style?.horizontalAlignment)?.style?.horizontalAlignment;
  if (explicitAlign) {
    alignment = explicitAlign;
  }

  const stats: ColumnStats = {
    nullCount,
    uniqueValues: uniqueSet.size,
    maxLength: Math.max(maxLength, 1),
  };

  // Base width estimation (points)
  const charWidthPt = dataType === 'number' ? 5.5 : 5.0;
  const minWidth = Math.max(36, headerText.length * charWidthPt + 12);
  const maxWidth = Math.max(minWidth, maxLength * charWidthPt + 16);
  const suggestedWidth = Math.min(Math.max(minWidth, (minWidth + maxWidth) / 2), 250);

  return {
    index: colIndex,
    header: headerText,
    dataType,
    alignment,
    minWidth: Math.round(minWidth),
    maxWidth: Math.round(maxWidth),
    suggestedWidth: Math.round(suggestedWidth),
    numberFormat,
    stats,
  };
}
