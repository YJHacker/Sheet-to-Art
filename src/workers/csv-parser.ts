import Papa from 'papaparse';
import type { CellIR, CellRow, Cell, WorkbookInfo } from '../types/cell-ir';

/**
 * Extract workbook metadata for CSV files (always a single sheet).
 */
export async function getWorkbookInfoCSV(
  _buffer: ArrayBuffer,
  fileName: string
): Promise<WorkbookInfo> {
  const baseName = fileName.replace(/\.csv$/i, '') || 'Sheet1';
  return {
    fileName,
    sheetNames: [baseName],
    sheets: [{ name: baseName, index: 0 }],
    activeSheetIndex: 0,
  };
}

/**
 * Parse a CSV file buffer into Cell IR.
 */
export async function parseCSV(
  buffer: ArrayBuffer,
  fileName: string
): Promise<CellIR> {
  const decoder = new TextDecoder('utf-8');
  const csvText = decoder.decode(buffer);

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      delimiter: '', // Auto-detect delimiter
      skipEmptyLines: false,
      complete: (results) => {
        try {
          const cellIR = convertToCellIR(results.data as string[][], fileName);
          resolve(cellIR);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

function convertToCellIR(data: string[][], fileName: string): CellIR {
  const rows: CellRow[] = [];
  let maxColCount = 0;
  const sheetName = fileName.replace(/\.csv$/i, '') || 'Sheet1';

  data.forEach((rowData, rowIndex) => {
    // Skip trailing completely empty lines if at the end of file
    if (rowIndex === data.length - 1 && rowData.length === 1 && rowData[0]?.trim() === '') {
      return;
    }

    const cells: Cell[] = [];

    rowData.forEach((cellValue, colIndex) => {
      const trimmedValue = cellValue !== undefined && cellValue !== null ? cellValue.trim() : '';
      const rawValue = trimmedValue === '' ? null : trimmedValue;
      const { value, type } = parseCSVValueAndType(rawValue);

      cells.push({
        value,
        rawValue: trimmedValue,
        type,
        position: { row: rowIndex, col: colIndex },
      });

      maxColCount = Math.max(maxColCount, colIndex + 1);
    });

    rows.push({
      rowIndex,
      cells,
    });
  });

  return {
    rows,
    metadata: {
      fileName,
      sheetName,
      totalRows: rows.length,
      totalCols: maxColCount,
      sheetNames: [sheetName],
      activeSheetIndex: 0,
    },
  };
}

function parseCSVValueAndType(rawValue: string | null): { value: string | number | boolean | null; type: Cell['type'] } {
  if (rawValue === null || rawValue === '') {
    return { value: null, type: 'empty' };
  }

  // Try parsing as boolean
  const lowerValue = rawValue.toLowerCase();
  if (lowerValue === 'true') {
    return { value: true, type: 'boolean' };
  }
  if (lowerValue === 'false') {
    return { value: false, type: 'boolean' };
  }

  // Try parsing as number
  const num = Number(rawValue);
  if (!isNaN(num) && !isNaN(parseFloat(rawValue))) {
    return { value: num, type: 'number' };
  }

  // Try parsing as ISO date
  const dateMatch = /^\d{4}-\d{2}-\d{2}/.test(rawValue);
  if (dateMatch && !isNaN(Date.parse(rawValue))) {
    return { value: rawValue, type: 'date' };
  }

  return { value: rawValue, type: 'string' };
}
