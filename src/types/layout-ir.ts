import type { CellStyle, CellIR } from './cell-ir';

export type ColumnDataType = 'text' | 'number' | 'date' | 'boolean' | 'mixed';
export type NumberFormatType = 'integer' | 'decimal' | 'currency' | 'percentage';
export type AlignmentType = 'left' | 'center' | 'right';
export type PageSizeType = 'letter' | 'a4' | 'legal' | 'a3' | 'a5';
export type OrientationType = 'portrait' | 'landscape';
export type SectionType = 'table' | 'text' | 'kpi-grid';
export type DocumentType = 'table' | 'report' | 'list';

export interface ColumnStats {
  nullCount: number;
  uniqueValues: number;
  maxLength: number;
}

export interface ColumnDescriptor {
  index: number;
  header: string;
  dataType: ColumnDataType;
  alignment: AlignmentType;
  minWidth: number; // Typographic points (pt)
  maxWidth: number; // Typographic points (pt)
  suggestedWidth: number; // Computed proportional width (pt)
  numberFormat?: NumberFormatType;
  dateFormat?: string;
  stats: ColumnStats;
}

export interface TableCell {
  value: string | number | boolean | null;
  formattedValue: string;
  alignment: AlignmentType;
  style?: CellStyle;
}

export interface TableRow {
  cells: TableCell[];
}

export interface HeaderStyle {
  bold: boolean;
  bgColor: string;
  textColor: string;
}

export interface TableSection {
  columns: ColumnDescriptor[];
  rows: TableRow[];
  headerStyle: HeaderStyle;
  alternatingRows: boolean;
}

export interface TextSectionContent {
  paragraphs: string[];
}

export interface KpiItem {
  label: string;
  value: string;
  change?: string;
}

export interface KpiGridContent {
  items: KpiItem[];
  columns: number;
}

export type SectionContent = TableSection | TextSectionContent | KpiGridContent;

export interface DocumentSection {
  type: SectionType;
  title?: string;
  content: SectionContent;
}

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface GlobalStyles {
  pageSize: PageSizeType;
  orientation: OrientationType;
  margins: PageMargins;
  fontFamily: string;
  baseFontSize: number;
  theme: string;
}

export interface LayoutIR {
  documentType: DocumentType;
  title?: string;
  sections: DocumentSection[];
  globalStyles: GlobalStyles;
}

export interface LayoutOptions {
  pageSize?: PageSizeType;
  orientation?: OrientationType | 'auto';
  theme?: string;
  fontFamily?: string;
  baseFontSize?: number;
  marginPreset?: 'compact' | 'normal' | 'spacious';
  layoutMode?: 'auto' | 'compact' | 'balanced' | 'presentation' | 'print-saver';
}

export interface LayoutWorkerAPI {
  analyzeLayout(
    cellIR: CellIR,
    options?: LayoutOptions,
    onProgress?: (progress: number) => void
  ): Promise<LayoutIR>;
}
