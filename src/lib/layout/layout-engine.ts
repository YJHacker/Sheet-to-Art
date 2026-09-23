// src/lib/layout/layout-engine.ts
import type { CellIR } from '../../types/cell-ir';
import type {
  LayoutIR,
  LayoutOptions,
  DocumentType,
  TableSection,
} from '../../types/layout-ir';
import { detectSections } from './section-detector';
import { optimizePageGeometry } from './column-width-allocator';

/**
 * Main layout analysis function that transforms CellIR into LayoutIR.
 *
 * Orchestrates the full pipeline:
 * 1. Section detection (title extraction, table/text/kpi segmentation)
 * 2. Page geometry optimization (orientation, font scaling, column widths)
 * 3. Document type inference
 */
export function analyzeCellIR(cellIR: CellIR, options: LayoutOptions = {}): LayoutIR {
  const { title, sections } = detectSections(cellIR);

  // Collect all columns across table sections to determine global page geometry
  const allTableColumns = sections
    .filter(s => s.type === 'table')
    .flatMap(s => (s.content as TableSection).columns);

  const { globalStyles, optimizedColumns } = optimizePageGeometry(
    allTableColumns.length > 0 ? allTableColumns : [],
    options.pageSize || 'a4',
    options.orientation || 'auto',
    options.theme || 'modern-clean',
    options.fontFamily || 'Inter'
  );

  // Override baseFontSize if explicitly provided
  if (options.baseFontSize !== undefined) {
    globalStyles.baseFontSize = options.baseFontSize;
  }

  // Update table sections with optimized column widths
  let colOffset = 0;
  for (const section of sections) {
    if (section.type === 'table') {
      const tableContent = section.content as TableSection;
      const count = tableContent.columns.length;
      tableContent.columns = optimizedColumns.slice(colOffset, colOffset + count);
      colOffset += count;
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
