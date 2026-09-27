import { readFileSync, writeFileSync } from 'fs';
import { parseXLSX } from '../src/workers/xlsx-parser';
import { detectHeaderRow } from '../src/lib/layout/header-detector';
import { classifyColumn } from '../src/lib/layout/column-classifier';
import { allocateColumnWidths, optimizePageGeometry, PAGE_DIMENSIONS } from '../src/lib/layout/column-width-allocator';
import { generateTypstDocument } from '../src/lib/typst/typst-generator';
import { compileLayoutToPDF } from '../src/lib/typst/typst-compiler';
import type { CellIR, CellRow, Cell } from '../src/types/cell-ir';
import type { DocumentSection, TableSection, TextSectionContent, KpiGridContent, TableRow, TableCell, LayoutIR } from '../src/types/layout-ir';

function isRowEmpty(row: CellRow): boolean {
  if (!row.cells || row.cells.length === 0) return true;
  return row.cells.every(c => c.value === null || c.value === undefined || c.value === '' || c.type === 'empty');
}

function getNonEmptyCells(row: CellRow): Cell[] {
  if (!row.cells) return [];
  return row.cells.filter(c => c.value !== null && c.value !== undefined && String(c.value).trim() !== '' && c.type !== 'empty');
}

export function isBannerRow(row: CellRow): { isBanner: boolean; text: string } {
  const filled = getNonEmptyCells(row);
  if (filled.length === 0) return { isBanner: false, text: '' };

  if (filled.length === 1 && filled[0]?.value != null) {
    const text = String(filled[0].value).trim();
    return { isBanner: text.length > 0, text };
  }

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
  if (currentBlock.length > 0) blocks.push(currentBlock);
  return blocks;
}

function getActiveColumnCount(block: CellRow[]): number {
  let maxCol = 0;
  for (const row of block) {
    for (let c = 0; c < row.cells.length; c++) {
      const cell = row.cells[c];
      if (cell && cell.value !== null && cell.value !== undefined && String(cell.value).trim() !== '' && cell.type !== 'empty') {
        maxCol = Math.max(maxCol, c + 1);
      }
    }
  }
  return maxCol;
}

function tryParseKpiGrid(block: CellRow[]): KpiGridContent | null {
  if (block.length > 3) return null;

  // Single row with 4 cells: "MY TARGET SCORE:", "______ / 100", "MY DAILY STUDY HOURS:", "______ hrs"
  if (block.length === 1) {
    const filled = getNonEmptyCells(block[0]!);
    if (filled.length >= 4 && filled.length % 2 === 0) {
      const items = [];
      for (let i = 0; i < filled.length; i += 2) {
        items.push({
          label: String(filled[i]?.value || ''),
          value: formatCellValue(filled[i + 1]!),
        });
      }
      return { items, columns: items.length };
    }
    // Single row with 5 milestone items: "Syllabus 100%...", "PYQ Round 1..."
    if (filled.length >= 3) {
      const items = filled.map((c, idx) => ({
        label: `CHECKPOINT ${idx + 1}`,
        value: formatCellValue(c),
      }));
      return { items, columns: items.length };
    }
  }

  // 2 rows: Row 0 Labels, Row 1 Values
  if (block.length === 2) {
    const row0 = getNonEmptyCells(block[0]!);
    const row1 = getNonEmptyCells(block[1]!);
    if (row0.length >= 2 && row0.length === row1.length) {
      const items = row0.map((c, i) => ({
        label: String(c.value),
        value: formatCellValue(row1[i]!),
      }));
      return { items, columns: Math.min(items.length, 4) };
    }
  }

  return null;
}

function buildTableSection(block: CellRow[]): TableSection {
  const activeCols = Math.max(1, getActiveColumnCount(block));
  const headerDetection = detectHeaderRow(block);
  const headerIdx = headerDetection ? headerDetection.headerIndex : 0;
  const headerRow = block[headerIdx];

  const dataRows = block.filter((_, idx) => idx !== headerIdx);

  // If there are no data rows (e.g. block had 1 row), treat that row as data with auto headers
  let effectiveHeaderRow = headerRow;
  let effectiveDataRows = dataRows;

  if (dataRows.length === 0 && block.length === 1) {
    effectiveHeaderRow = undefined;
    effectiveDataRows = [block[0]!];
  }

  const columns = Array.from({ length: activeCols }, (_, colIdx) => {
    const rawHeaderText = effectiveHeaderRow?.cells[colIdx]?.value != null
      ? String(effectiveHeaderRow.cells[colIdx]?.value).trim()
      : '';
    const headerText = rawHeaderText !== '' ? rawHeaderText : `Col ${colIdx + 1}`;
    const columnCells = effectiveDataRows.map(
      r => r.cells[colIdx] || { value: null, type: 'empty' as const, position: { row: r.rowIndex, col: colIdx } }
    );
    return classifyColumn(columnCells, headerText, colIdx);
  });

  const tableRows: TableRow[] = effectiveDataRows.map(r => {
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

function analyzeCellIRRefined(cellIR: CellIR): LayoutIR {
  let title: string | undefined = undefined;
  let remainingRows = [...cellIR.rows];

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

    // Single-row banner check
    if (block.length === 1) {
      const singleRow = block[0]!;
      const { isBanner, text } = isBannerRow(singleRow);
      if (isBanner && text.length > 0) {
        sections.push({
          type: 'text',
          content: { paragraphs: [text] },
        });
        continue;
      }

      // Check if it's a KPI or milestone grid
      const kpi = tryParseKpiGrid(block);
      if (kpi) {
        sections.push({ type: 'kpi-grid', content: kpi });
        continue;
      }
    }

    // Multi-row block: check if first row is a section title banner
    let sectionTitle: string | undefined = undefined;
    let workingBlock = [...block];

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
          content: { paragraphs: [sectionTitle] },
        });
      }
      continue;
    }

    const kpi = tryParseKpiGrid(workingBlock);
    if (kpi) {
      sections.push({ type: 'kpi-grid', title: sectionTitle, content: kpi });
      continue;
    }

    const table = buildTableSection(workingBlock);
    sections.push({ type: 'table', title: sectionTitle, content: table });
  }

  // Page geometry & Column allocation
  const tableSections = sections.filter(s => s.type === 'table');
  let widestColumns = tableSections[0] ? (tableSections[0].content as TableSection).columns : [];
  for (const s of tableSections) {
    const cols = (s.content as TableSection).columns;
    if (cols.length > widestColumns.length) widestColumns = cols;
  }

  const { globalStyles } = optimizePageGeometry(
    widestColumns,
    'a4',
    'auto',
    'modern-clean',
    'Inter',
    'normal',
    'balanced'
  );

  const baseDim = PAGE_DIMENSIONS[globalStyles.pageSize] || PAGE_DIMENSIONS.a4;
  const printableWidth = globalStyles.orientation === 'landscape'
    ? baseDim.height - globalStyles.margins.left - globalStyles.margins.right
    : baseDim.width - globalStyles.margins.left - globalStyles.margins.right;

  for (const section of sections) {
    if (section.type === 'table') {
      const tableContent = section.content as TableSection;
      tableContent.columns = allocateColumnWidths(tableContent.columns, printableWidth);
    }
  }

  return {
    documentType: sections.length > 1 ? 'report' : 'table',
    title: title || cellIR.metadata?.sheetName || undefined,
    sections,
    globalStyles,
  };
}

async function testAll() {
  const filePath = 'tests/fixtures/GATE2027_Tracker_AllBranches.xlsx';
  const fileBuffer = readFileSync(filePath);
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

  for (let i = 0; i < 7; i++) {
    const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', i);
    const layout = analyzeCellIRRefined(cellIR);

    console.log(`\n======================================================`);
    console.log(`SHEET ${i} "${cellIR.metadata.sheetName}": ${layout.sections.length} sections`);
    console.log(`======================================================`);

    layout.sections.forEach((sec, idx) => {
      if (sec.type === 'table') {
        const tbl = sec.content as TableSection;
        console.log(`  [Sec ${idx}] TABLE: "${sec.title || '(no title)'}" | ${tbl.columns.length} cols (${tbl.columns.map(c => `"${c.header}" [${c.suggestedWidth?.toFixed(1)}pt]`).join(', ')}) | ${tbl.rows.length} data rows`);
      } else if (sec.type === 'kpi-grid') {
        const kpi = sec.content as KpiGridContent;
        console.log(`  [Sec ${idx}] KPI-GRID: "${sec.title || '(no title)'}" | ${kpi.items.length} items (${kpi.items.map(it => `${it.label}: ${it.value}`).join(' | ')})`);
      } else if (sec.type === 'text') {
        const txt = sec.content as TextSectionContent;
        console.log(`  [Sec ${idx}] NOTE: "${sec.title || '(no title)'}" | ${txt.paragraphs.length} paras: "${txt.paragraphs[0]?.slice(0, 60)}..."`);
      }
    });

    const renderResult = await compileLayoutToPDF(layout, { theme: 'modern-clean' });
    console.log(`>>> PDF compiled successfully! Page count: ${renderResult.pageCount}, Buffer size: ${renderResult.pdfBuffer.length} bytes`);
  }
}

testAll().catch(console.error);
