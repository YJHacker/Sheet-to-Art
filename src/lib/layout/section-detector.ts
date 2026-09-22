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

function isRowEmpty(row: CellRow): boolean {
  return !row.cells || row.cells.every(c => c.value === null || c.value === undefined || c.value === '' || c.type === 'empty');
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
 * Splits rows into contiguous non-empty row blocks.
 */
function partitionRowBlocks(rows: CellRow[]): CellRow[][] {
  const blocks: CellRow[][] = [];
  let currentBlock: CellRow[] = [];

  for (const row of rows) {
    if (isRowEmpty(row)) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
        currentBlock = [];
      }
    } else {
      currentBlock.push(row);
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  return blocks;
}

/**
 * Detects whether a block of rows represents a KPI grid (key-value cards).
 */
function tryParseKpiGrid(block: CellRow[]): KpiGridContent | null {
  if (block.length > 3) return null;

  // If the block has a detected table header row and multiple rows, it is a Table, not a KPI grid
  if (block.length > 1 && detectHeaderRow(block) !== null) {
    return null;
  }

  const items: KpiItem[] = [];
  for (const row of block) {
    const filledCells = row.cells.filter(c => c.value !== null && c.value !== '');
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
    const filled = row.cells.filter(c => c.value !== null && c.value !== '');
    if (filled.length === 1 && typeof filled[0]?.value === 'string') {
      const text = String(filled[0].value).trim();
      paragraphs.push(text);
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
    const headerText = headerRow?.cells[colIdx]?.value != null ? String(headerRow.cells[colIdx]?.value) : `Col ${colIdx + 1}`;
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
  const firstRow = remainingRows[0];
  if (firstRow) {
    const filled = firstRow.cells.filter(c => c.value !== null && c.value !== '');
    if (filled.length === 1 && typeof filled[0]?.value === 'string') {
      const val = String(filled[0].value).trim();
      if (val.length > 0 && val.length <= 100) {
        title = val;
        remainingRows = remainingRows.slice(1);
      }
    }
  }

  const blocks = partitionRowBlocks(remainingRows);
  const sections: DocumentSection[] = [];

  for (const block of blocks) {
    if (block.length === 0) continue;

    // Check KPI grid
    const kpi = tryParseKpiGrid(block);
    if (kpi) {
      sections.push({ type: 'kpi-grid', content: kpi });
      continue;
    }

    // Check Text section
    const text = tryParseTextSection(block);
    if (text) {
      sections.push({ type: 'text', content: text });
      continue;
    }

    // Default: Table section
    const table = buildTableSection(block);
    sections.push({ type: 'table', content: table });
  }

  return { title, sections };
}
