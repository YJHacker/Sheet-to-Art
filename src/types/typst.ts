import type { LayoutIR, PageOrientation, PageSize } from './layout-ir';

export type ThemeName =
  | 'modern-clean'
  | 'executive-serif'
  | 'compact-ledger'
  | 'emerald-report'
  | 'monochrome-pure';

export interface ThemeMargins {
  top: string;
  bottom: string;
  left: string;
  right: string;
}

export interface ThemeCellPadding {
  x: string;
  y: string;
}

export interface ThemeDefinition {
  name: ThemeName;
  displayName: string;
  fontFamily: string;
  headingFontFamily?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headerBackground: string;
  headerTextColor: string;
  zebraBackground: string;
  borderColor: string;
  textColor: string;
  kpiBackground: string;
  kpiBorderColor: string;
  kpiAccentColor: string;
  noteBackground: string;
  noteBorderColor: string;
  tableStroke: string;
  margins: ThemeMargins;
  cellPadding: ThemeCellPadding;
  baseFontSize: number;
}

export interface TypstGeneratorOptions {
  theme?: ThemeName | ThemeDefinition;
  pageSize?: PageSize;
  orientation?: PageOrientation;
  showPageNumbers?: boolean;
  headerTitle?: string;
  repeatTableHeaders?: boolean;
  baseFontSize?: number;
}

export interface PDFRenderResult {
  pdfBuffer: Uint8Array;
  pageCount: number;
  typstSource: string;
}

export interface TypstWorkerAPI {
  generateMarkup(layout: LayoutIR, options?: TypstGeneratorOptions): Promise<string>;
  compileToPDF(typstSource: string): Promise<Uint8Array>;
  renderLayoutToPDF(layout: LayoutIR, options?: TypstGeneratorOptions): Promise<PDFRenderResult>;
  mergePDFs(buffers: Uint8Array[]): Promise<Uint8Array>;
}
