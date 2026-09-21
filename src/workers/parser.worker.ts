import * as Comlink from 'comlink';
import { parseXLSX } from './xlsx-parser';
import { parseCSV } from './csv-parser';
import type { ParserWorkerAPI, CellIR } from '../types/cell-ir';

export class ParserWorker implements ParserWorkerAPI {
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
