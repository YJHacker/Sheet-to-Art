import * as Comlink from 'comlink';
import { parseXLSX, getWorkbookInfoXLSX } from './xlsx-parser';
import { parseCSV, getWorkbookInfoCSV } from './csv-parser';
import type { ParserWorkerAPI, CellIR, WorkbookInfo } from '../types/cell-ir';

export class ParserWorker implements ParserWorkerAPI {
  async getWorkbookInfo(
    buffer: ArrayBuffer,
    fileName: string
  ): Promise<WorkbookInfo> {
    const extension = this.getFileExtension(fileName);

    if (extension === '.xlsx') {
      return await getWorkbookInfoXLSX(buffer, fileName);
    }

    if (extension === '.csv') {
      return await getWorkbookInfoCSV(buffer, fileName);
    }

    throw new Error(
      `Unsupported file format: ${extension || 'unknown'}. Supported formats: .xlsx, .csv`
    );
  }

  async parseFile(
    buffer: ArrayBuffer,
    fileName: string,
    sheetIndex: number = 0
  ): Promise<CellIR> {
    const extension = this.getFileExtension(fileName);

    if (extension === '.xls') {
      throw new Error(
        'Unsupported file format: .xls (legacy Excel binary format). ' +
        'Please convert to .xlsx or .csv and try again.'
      );
    }

    if (extension === '.xlsx') {
      return await parseXLSX(buffer, fileName, sheetIndex);
    }

    if (extension === '.csv') {
      return await parseCSV(buffer, fileName);
    }

    throw new Error(
      `Unsupported file format: ${extension || 'unknown'}. Supported formats: .xlsx, .csv`
    );
  }

  private getFileExtension(fileName: string): string {
    const match = fileName.match(/\.[^.]+$/);
    return match ? match[0].toLowerCase() : '';
  }
}

// Expose the API to the main thread via Comlink when running inside a worker context
if (typeof self !== 'undefined' && 'postMessage' in self && typeof (self as unknown as { window?: unknown }).window === 'undefined') {
  Comlink.expose(new ParserWorker());
}
