import * as Comlink from 'comlink';
import type { ParserWorkerAPI } from '../types/cell-ir';

let parserWorkerInstance: Comlink.Remote<ParserWorkerAPI> | ParserWorkerAPI | null = null;

export function getParserWorker(): Comlink.Remote<ParserWorkerAPI> | ParserWorkerAPI {
  if (!parserWorkerInstance) {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        const worker = new Worker(
          new URL('../workers/parser.worker.ts', import.meta.url),
          { type: 'module' }
        );
        parserWorkerInstance = Comlink.wrap<ParserWorkerAPI>(worker);
      } catch (err) {
        console.warn('Worker instantiation failed, falling back to direct instance:', err);
      }
    }

    if (!parserWorkerInstance) {
      // Fallback for non-worker environments (e.g. Node.js test environment)
      // Dynamic import to avoid bundling on main thread if not needed
      const { ParserWorker } = require('../workers/parser.worker');
      parserWorkerInstance = new ParserWorker();
    }
  }

  return parserWorkerInstance!;
}

export const parserWorker = {
  parseFile: async (buffer: ArrayBuffer, fileName: string, sheetIndex?: number) => {
    const worker = getParserWorker();
    return await worker.parseFile(buffer, fileName, sheetIndex);
  },
};
