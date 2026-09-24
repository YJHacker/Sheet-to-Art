// src/lib/layout/section-detector.ts
import type { CellIR, CellRow, Cell } from '../../types/cell-ir';
import type {
  DocumentSection,
  TableSection,
  TextSectionContent,
  KpiGridContent,
  KpiItem,
  TableRow,
  TableCell,
} from '../../types/layout-ir';
import { detectHeaderRow } from './header-detector';
import { classifyColumn } from './column-classifier';

export function isRowEmpty(row: CellRow): boolean {
  if (!row.cells || row.cells.length === 0) return true;
  return row.cells.every(c => c.value === null || c.value === undefined || c.value === '' || c.type === 'empty');
}

function getNonEmptyCells(row: CellRow): Cell[] {
  if (!row.cells) return [];
  return row.cells.filter(c => c.value !== null && c.value !== undefined && String(c.value).trim() !== '' && c.type !== 'empty');
}

/**
 * Checks if a row represents a single-value banner / section header across the grid
 * (either a single filled cell or identical merged cell copies).
 */
export function isBannerRow(row: CellRow): { isBanner: boolean; text: string } {
  const filled = getNonEmptyCells(row);
  if (filled.length === 0) {
    return { isBanner: false, text: '' };
  }

  // Single cell in row
  if (filled.length === 1 && filled[0]?.value != null) {
    const text = String(filled[0].value).trim();
    return { isBanner: text.length > 0, text };
  }

  // All filled cells have the identical string value (common in merged header rows across columns)
  const firstVal = String(filled[0]?.value).trim();
  const allIdentical = filled.every(c => String(c.value).trim() === firstVal);
  if (allIdentical && firstVal.length > 0) {
    return { isBanner: true, text: firstVal };
  }

  return { isBanner: false, text: '' };
}

function formatCellValue(cell: Cell): string {
  if (cell.value === null || cell.value === undefined) return '';
  if (typeof cell.value === 'number') {
    if (cell.style?.numFmt?.includes('$')) {
      return `$${cell.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (cell.style?.numFmt?.includes('%')) {
      return `${(cell.value * 100).toFixed(1)}%`;
    }
    return cell.value.toLocaleString();
  }
  return String(cell.value);
}

/**
 * Splits rows into contiguous non-empty row blocks, taking into account
 * empty rows, row index discontinuities (skipped empty rows in Excel),
 * and embedded section banner breaks.
 */
function partitionRowBlocks(rows: CellRow[]): CellRow[][] {
  const blocks: CellRow[][] = [];
  let currentBlock: CellRow[] = [];
  let prevRowIndex = -1;

  for (const row of rows) {
    const isEmpty = isRowEmpty(row);
    const hasRowGap = prevRowIndex >= 0 && row.rowIndex > prevRowIndex + 1;

    if (isEmpty || hasRowGap) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
        currentBlock = [];
      }
    }

    if (!isEmpty) {
      // If current block already has rows, and the new row is a prominent banner row,
      // split into a new block so each table/section stands alone
      if (currentBlock.length > 0) {
        const { isBanner } = isBannerRow(row);
        if (isBanner) {
          blocks.push(currentBlock);
          currentBlock = [];
        }
      }

      currentBlock.push(row);
      prevRowIndex = row.rowIndex;
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  return blocks;
}

/**
 * Detects whether a block of rows represents a KPI grid (key-value cards / target boxes).
 */
function tryParseKpiGrid(block: CellRow[]): KpiGridContent | null {
  if (block.length > 3) return null;

  // If the block has a detected multi-column table header row and multiple rows, it is a Table, not a KPI grid
  if (block.length > 1 && detectHeaderRow(block) !== null) {
    return null;
  }

  const items: KpiItem[] = [];
  for (const row of block) {
    const filledCells = getNonEmptyCells(row);
    if (filledCells.length >= 2 && filledCells.length % 2 === 0) {
      for (let i = 0; i < filledCells.length; i += 2) {
        const labelCell = filledCells[i];
        const valCell = filledCells[i + 1];
        if (labelCell && valCell) {
          items.push({
            label: String(labelCell.value),
            value: formatCellValue(valCell),
          });
        }
      }
    }
  }

  if (items.length >= 2) {
    return { items, columns: Math.min(items.length, 4) };
  }

  return null;
}

/**
 * Detects whether a block of rows represents a free-form text note / commentary.
 */
function tryParseTextSection(block: CellRow[]): TextSectionContent | null {
  const paragraphs: string[] = [];
  let isText = true;

  for (const row of block) {
    const filled = getNonEmptyCells(row);
    const { isBanner, text } = isBannerRow(row);

    if (isBanner && text.length > 0) {
      paragraphs.push(text);
    } else if (filled.length === 1 && typeof filled[0]?.value === 'string') {
      const textVal = String(filled[0].value).trim();
      paragraphs.push(textVal);
    } else {
      isText = false;
      break;
    }
  }

  if (isText && paragraphs.length > 0) {
    return { paragraphs };
  }

  return null;
}

/**
 * Converts a matrix of rows into a structured TableSection.
 */
function buildTableSection(block: CellRow[]): TableSection {
  const headerDetection = detectHeaderRow(block);
  const headerIdx = headerDetection ? headerDetection.headerIndex : 0;
  const headerRow = block[headerIdx];

  const maxCols = block.reduce((max, r) => Math.max(max, r.cells.length), 0);
  const dataRows = block.filter((_, idx) => idx !== headerIdx);

  // Classify each column
  const columns = Array.from({ length: maxCols }, (_, colIdx) => {
    const rawHeaderText = headerRow?.cells[colIdx]?.value != null ? String(headerRow.cells[colIdx]?.value).trim() : '';
    const headerText = rawHeaderText !== '' ? rawHeaderText : `Col ${colIdx + 1}`;
    const columnCells = dataRows.map(r => r.cells[colIdx] || { value: null, type: 'empty' as const, position: { row: r.rowIndex, col: colIdx } });
    return classifyColumn(columnCells, headerText, colIdx);
  });

  // Build TableRow objects
  const tableRows: TableRow[] = dataRows.map(r => {
    const cells: TableCell[] = columns.map((col, colIdx) => {
      const cell = r.cells[colIdx];
      const val = cell?.value ?? null;
      const formatted = cell ? formatCellValue(cell) : '';
      return {
        value: val,
        formattedValue: formatted,
        alignment: col.alignment,
        style: cell?.style,
      };
    });
    return { cells };
  });

  return {
    columns,
    rows: tableRows,
    headerStyle: {
      bold: true,
      bgColor: '#1E293B',
      textColor: '#FFFFFF',
    },
    alternatingRows: true,
  };
}

/**
 * Segments CellIR into DocumentTitle and DocumentSections.
 */
export function detectSections(cellIR: CellIR): { title?: string; sections: DocumentSection[] } {
  if (!cellIR.rows || cellIR.rows.length === 0) {
    return { title: cellIR.metadata?.sheetName || undefined, sections: [] };
  }

  let title: string | undefined = undefined;
  let remainingRows = [...cellIR.rows];

  // Inspect first row: is it a Document Title banner?
  if (remainingRows.length > 0) {
    const firstRow = remainingRows[0]!;
    const { isBanner, text } = isBannerRow(firstRow);
    if (isBanner && text.length > 0) {
      title = text;
      remainingRows = remainingRows.slice(1);
    }
  }

  const rawBlocks = partitionRowBlocks(remainingRows);
  const sections: DocumentSection[] = [];

  for (const block of rawBlocks) {
    if (block.length === 0) continue;

    let sectionTitle: string | undefined = undefined;
    let workingBlock = [...block];

    // Check if the first row of this block is a section title banner preceding a table or content
    if (workingBlock.length > 1) {
      const firstInBlock = workingBlock[0]!;
      const { isBanner, text } = isBannerRow(firstInBlock);
      if (isBanner && text.length > 0) {
        sectionTitle = text;
        workingBlock = workingBlock.slice(1);
      }
    }

    if (workingBlock.length === 0) {
      if (sectionTitle) {
        sections.push({
          type: 'text',
          title: sectionTitle,
          content: { paragraphs: [sectionTitle] },
        });
      }
      continue;
    }

    // Check KPI grid
    const kpi = tryParseKpiGrid(workingBlock);
    if (kpi) {
      sections.push({ type: 'kpi-grid', title: sectionTitle, content: kpi });
      continue;
    }

    // Check Text section
    const text = tryParseTextSection(workingBlock);
    if (text) {
      sections.push({ type: 'text', title: sectionTitle, content: text });
      continue;
    }

    // Default: Table section
    const table = buildTableSection(workingBlock);
    sections.push({ type: 'table', title: sectionTitle, content: table });
  }

  return { title, sections };
}

