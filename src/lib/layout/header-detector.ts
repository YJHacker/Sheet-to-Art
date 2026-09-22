import type { CellRow } from '../../types/cell-ir';

export const HEADER_SCORE_THRESHOLD = 0.85;

/**
 * Computes the header heuristic score for a candidate row.
 * Formula: S = 0.60 * B + T + 0.05 * F + 0.03 * C + 0.02 * U
 *
 * Where:
 * - B: Proportion of bold cells (0.0 to 1.0)
 * - T: Top row position score (Row 0 = 0.30, Row 1 = 0.15, Others = 0.00)
 * - F: Proportion of filled (non-empty) cells (0.0 to 1.0)
 * - C: Proportion of colored/shaded background cells (0.0 to 1.0)
 * - U: Proportion of string-typed cells (0.0 to 1.0)
 */
export function computeHeaderScore(row: CellRow, rowIndex: number): number {
  if (!row.cells || row.cells.length === 0) {
    return 0.0;
  }

  const total = row.cells.length;
  let boldCount = 0;
  let filledCount = 0;
  let coloredCount = 0;
  let stringCount = 0;

  for (const cell of row.cells) {
    if (cell.style?.bold) {
      boldCount++;
    }
    const isFilled = cell.value !== null && cell.value !== undefined && cell.value !== '' && cell.type !== 'empty';
    if (isFilled) {
      filledCount++;
    }
    if (cell.style?.bgColor && cell.style.bgColor !== 'transparent' && cell.style.bgColor !== '#FFFFFF') {
      coloredCount++;
    }
    if (cell.type === 'string' && typeof cell.value === 'string' && cell.value.trim() !== '') {
      stringCount++;
    }
  }

  const B = boldCount / total;
  const T = rowIndex === 0 ? 0.30 : rowIndex === 1 ? 0.15 : 0.0;
  const F = filledCount / total;
  const C = coloredCount / total;
  const U = stringCount / total;

  return (0.60 * B) + T + (0.05 * F) + (0.03 * C) + (0.02 * U);
}

export interface HeaderDetectionResult {
  headerIndex: number;
  score: number;
}

/**
 * Inspects initial rows of a table block to identify the header row.
 * Searches up to `maxSearchRows` (default 5).
 */
export function detectHeaderRow(
  rows: CellRow[],
  maxSearchRows: number = 5
): HeaderDetectionResult | null {
  if (!rows || rows.length === 0) {
    return null;
  }

  const searchLimit = Math.min(rows.length, maxSearchRows);
  let bestIndex = -1;
  let maxScore = -1;

  for (let i = 0; i < searchLimit; i++) {
    const row = rows[i];
    if (!row) continue;
    const score = computeHeaderScore(row, i);
    if (score > maxScore) {
      maxScore = score;
      bestIndex = i;
    }
  }

  if (maxScore >= HEADER_SCORE_THRESHOLD && bestIndex !== -1) {
    return { headerIndex: bestIndex, score: maxScore };
  }

  // Fallback: if row 0 has all string values and row 1 has numeric values, treat row 0 as header
  if (rows.length >= 2) {
    const row0 = rows[0];
    const row1 = rows[1];
    if (row0 && row1 && row0.cells.length > 0 && row1.cells.length > 0) {
      const row0StringRatio = row0.cells.filter(c => c.type === 'string').length / row0.cells.length;
      const row1NumRatio = row1.cells.filter(c => c.type === 'number').length / row1.cells.length;
      if (row0StringRatio >= 0.8 && row1NumRatio >= 0.3) {
        return { headerIndex: 0, score: 0.80 };
      }
    }
  }

  return null;
}
