// src/lib/layout/layout-engine.ts
import type { CellIR } from '../../types/cell-ir';
import type {
  LayoutIR,
  LayoutOptions,
  DocumentType,
  TableSection,
} from '../../types/layout-ir';
import { detectSections } from './section-detector';
import { optimizePageGeometry, allocateColumnWidths, PAGE_DIMENSIONS } from './column-width-allocator';

/**
 * Main layout analysis function that transforms CellIR into LayoutIR.
 *
 * Orchestrates the full pipeline:
 * 1. Section detection (title extraction, table/text/kpi segmentation)
 * 2. Page geometry optimization (orientation, font scaling, column widths per table)
 * 3. Document type inference
 */
export function analyzeCellIR(cellIR: CellIR, options: LayoutOptions = {}): LayoutIR {
  const { title, sections } = detectSections(cellIR);

  // Find the widest table section to assist in global orientation detection
  const tableSections = sections.filter(s => s.type === 'table');
  let widestColumns = tableSections[0] ? (tableSections[0].content as TableSection).columns : [];
  for (const s of tableSections) {
    const cols = (s.content as TableSection).columns;
    if (cols.length > widestColumns.length) {
      widestColumns = cols;
    }
  }

  const { globalStyles } = optimizePageGeometry(
    widestColumns.length > 0 ? widestColumns : [],
    options.pageSize || 'a4',
    options.orientation || 'auto',
    options.theme || 'modern-clean',
    options.fontFamily || 'Inter',
    options.marginPreset,
    options.layoutMode
  );

  // Override baseFontSize if explicitly provided
  if (options.baseFontSize !== undefined) {
    globalStyles.baseFontSize = options.baseFontSize;
  }

  // Calculate printable width for this page geometry
  const baseDim = PAGE_DIMENSIONS[globalStyles.pageSize] || PAGE_DIMENSIONS.a4;
  const printableWidth = globalStyles.orientation === 'landscape'
    ? baseDim.height - globalStyles.margins.left - globalStyles.margins.right
    : baseDim.width - globalStyles.margins.left - globalStyles.margins.right;

  // Allocate column widths for EACH table section independently to span the full page width
  for (const section of sections) {
    if (section.type === 'table') {
      const tableContent = section.content as TableSection;
      tableContent.columns = allocateColumnWidths(tableContent.columns, printableWidth);
    }
  }

  // Determine overall documentType
  let documentType: DocumentType = 'table';
  if (sections.some(s => s.type === 'kpi-grid') || sections.length > 1) {
    documentType = 'report';
  } else if (sections.every(s => s.type === 'text')) {
    documentType = 'list';
  }

  return {
    documentType,
    title: title || cellIR.metadata?.sheetName || undefined,
    sections,
    globalStyles,
  };
}
