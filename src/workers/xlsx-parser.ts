import ExcelJS from 'exceljs';
import type { CellIR, CellRow, Cell, CellStyle, WorkbookInfo, SheetInfo } from '../types/cell-ir';

/**
 * Extract workbook metadata and all worksheet names without full row extraction.
 */
export async function getWorkbookInfoXLSX(
  buffer: ArrayBuffer,
  fileName: string
): Promise<WorkbookInfo> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheets: SheetInfo[] = workbook.worksheets.map((ws, index) => ({
    name: ws.name,
    index,
    rowCount: ws.actualRowCount,
    colCount: ws.actualColumnCount,
  }));

  const sheetNames = sheets.map(s => s.name);

  return {
    fileName,
    sheetNames,
    sheets,
    activeSheetIndex: 0,
  };
}

/**
 * Parse an XLSX file buffer into Cell IR.
 */
export async function parseXLSX(
  buffer: ArrayBuffer,
  fileName: string,
  sheetIndex: number = 0
): Promise<CellIR> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheetNames = workbook.worksheets.map(ws => ws.name);

  const worksheet = workbook.worksheets[sheetIndex];
  if (!worksheet) {
    throw new Error(`Sheet index ${sheetIndex} not found in ${fileName}`);
  }

  const rows: CellRow[] = [];
  let maxColCount = 0;

  worksheet.eachRow({ includeEmpty: false }, (row, rowIndex) => {
    const cells: Cell[] = [];
    const adjustedRowIndex = rowIndex - 1; // ExcelJS is 1-indexed

    row.eachCell({ includeEmpty: true }, (cell, colIndex) => {
      const adjustedColIndex = colIndex - 1;

      // Skip cells that are part of a merge but not the master cell
      if (cell.isMerged && cell.master && cell.master.address !== cell.address) {
        return;
      }

      const cellValue = extractCellValue(cell);
      const cellType = inferCellType(cell);
      const style = extractCellStyle(cell);

      cells.push({
        value: cellValue,
        rawValue: cell.text,
        type: cellType,
        style,
        position: { row: adjustedRowIndex, col: adjustedColIndex },
      });

      maxColCount = Math.max(maxColCount, adjustedColIndex + 1);
    });

    if (cells.length > 0) {
      rows.push({
        rowIndex: adjustedRowIndex,
        cells,
      });
    }
  });

  return {
    rows,
    metadata: {
      fileName,
      sheetName: worksheet.name,
      totalRows: rows.length,
      totalCols: maxColCount,
      sheetNames,
      activeSheetIndex: sheetIndex,
    },
  };
}

function extractCellValue(cell: ExcelJS.Cell): string | number | boolean | null {
  if (cell.value === null || cell.value === undefined) {
    return null;
  }

  // Handle formula cells: extract cached result value
  if (cell.type === ExcelJS.ValueType.Formula) {
    const formulaValue = cell.value as ExcelJS.CellFormulaValue;
    return (formulaValue.result !== undefined && formulaValue.result !== null)
      ? (formulaValue.result as string | number | boolean)
      : null;
  }

  // Handle rich text: extract plain text concatenation
  if (cell.type === ExcelJS.ValueType.RichText) {
    const richText = cell.value as ExcelJS.CellRichTextValue;
    return richText.richText.map(rt => rt.text).join('');
  }

  // Handle hyperlinks: extract text, not URL
  if (cell.type === ExcelJS.ValueType.Hyperlink) {
    const hyperlink = cell.value as ExcelJS.CellHyperlinkValue;
    return hyperlink.text;
  }

  // Standard primitive values
  if (typeof cell.value === 'object') {
    const obj = cell.value as unknown as Record<string, unknown>;
    if ('result' in obj) {
      const res = obj.result;
      return (res !== undefined && res !== null) ? (res as string | number | boolean) : null;
    }
  }

  return cell.value as string | number | boolean;
}

function inferCellType(cell: ExcelJS.Cell): Cell['type'] {
  if (cell.value === null || cell.value === undefined || cell.value === '') {
    return 'empty';
  }

  if (cell.type === ExcelJS.ValueType.Formula || (typeof cell.value === 'object' && 'formula' in (cell.value as unknown as Record<string, unknown>))) {
    return 'formula';
  }

  if (cell.type === ExcelJS.ValueType.Date) {
    return 'date';
  }

  if (cell.type === ExcelJS.ValueType.Number) {
    return 'number';
  }

  if (cell.type === ExcelJS.ValueType.Boolean) {
    return 'boolean';
  }

  return 'string';
}

function extractCellStyle(cell: ExcelJS.Cell): CellStyle | undefined {
  if (!cell.style) {
    return undefined;
  }

  const style: CellStyle = {};

  if (cell.style.font?.bold) {
    style.bold = true;
  }

  if (cell.style.font?.italic) {
    style.italic = true;
  }

  if (cell.style.font?.underline) {
    style.underline = true;
  }

  if (cell.style.font?.size) {
    style.fontSize = cell.style.font.size;
  }

  if (cell.style.font?.color?.argb) {
    style.textColor = `#${cell.style.font.color.argb.slice(2)}`; // Strip alpha channel
  }

  if (cell.style.fill && cell.style.fill.type === 'pattern') {
    const patternFill = cell.style.fill as ExcelJS.FillPattern;
    if (patternFill.fgColor?.argb) {
      style.bgColor = `#${patternFill.fgColor.argb.slice(2)}`;
    }
  }

  if (cell.style.alignment?.horizontal) {
    style.horizontalAlignment = cell.style.alignment.horizontal as 'left' | 'center' | 'right';
  }

  if (cell.style.numFmt) {
    style.numFmt = cell.style.numFmt;
  }

  return Object.keys(style).length > 0 ? style : undefined;
}
