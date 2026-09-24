/**
 * Cell style properties extracted from spreadsheet formatting.
 */
export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  bgColor?: string; // Hex color code (e.g., "#FF0000")
  textColor?: string;
  horizontalAlignment?: 'left' | 'center' | 'right';
  numFmt?: string; // Number format string (e.g., "0.00", "$#,##0.00")
}

/**
 * Individual cell in the spreadsheet grid.
 */
export interface Cell {
  value: string | number | boolean | null;
  rawValue?: string; // Original unformatted value
  type: 'string' | 'number' | 'boolean' | 'date' | 'formula' | 'empty';
  style?: CellStyle;
  position: { row: number; col: number };
}

/**
 * A single row of cells.
 */
export interface CellRow {
  rowIndex: number;
  cells: Cell[];
}

/**
 * Complete Cell Intermediate Representation for a spreadsheet.
 */
export interface CellIR {
  rows: CellRow[];
  metadata: {
    fileName: string;
    sheetName: string;
    totalRows: number;
    totalCols: number;
    sheetNames?: string[];
    activeSheetIndex?: number;
  };
}

/**
 * Workbook metadata describing all sheets in an Excel or CSV file.
 */
export interface SheetInfo {
  name: string;
  index: number;
  rowCount?: number;
  colCount?: number;
}

export interface WorkbookInfo {
  fileName: string;
  sheetNames: string[];
  sheets: SheetInfo[];
  activeSheetIndex: number;
}

/**
 * Parser Worker RPC API exposed via Comlink.
 */
export interface ParserWorkerAPI {
  getWorkbookInfo(
    buffer: ArrayBuffer,
    fileName: string
  ): Promise<WorkbookInfo>;
  parseFile(
    buffer: ArrayBuffer,
    fileName: string,
    sheetIndex?: number
  ): Promise<CellIR>;
}
