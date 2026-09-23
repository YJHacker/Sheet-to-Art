// src/lib/workers.ts
import * as Comlink from 'comlink';
import type { ParserWorkerAPI, CellIR } from '../types/cell-ir';
import type { LayoutWorkerAPI, LayoutOptions, LayoutIR } from '../types/layout-ir';
import type { TypstWorkerAPI, TypstGeneratorOptions, PDFRenderResult } from '../types/typst';
import { ParserWorker } from '../workers/parser.worker';
import { LayoutWorker } from '../workers/layout.worker';
import { TypstWorker } from '../workers/typst.worker';

let parserWorkerInstance: Comlink.Remote<ParserWorkerAPI> | ParserWorkerAPI | null = null;
let layoutWorkerInstance: Comlink.Remote<LayoutWorkerAPI> | LayoutWorkerAPI | null = null;
let typstWorkerInstance: Comlink.Remote<TypstWorkerAPI> | TypstWorkerAPI | null = null;

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
        console.warn('Parser Worker instantiation failed, falling back to direct instance:', err);
      }
    }

    if (!parserWorkerInstance) {
      parserWorkerInstance = new ParserWorker();
    }
  }

  return parserWorkerInstance!;
}

export function getLayoutWorker(): Comlink.Remote<LayoutWorkerAPI> | LayoutWorkerAPI {
  if (!layoutWorkerInstance) {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        const worker = new Worker(
          new URL('../workers/layout.worker.ts', import.meta.url),
          { type: 'module' }
        );
        layoutWorkerInstance = Comlink.wrap<LayoutWorkerAPI>(worker);
      } catch (err) {
        console.warn('Layout Worker instantiation failed, falling back to direct instance:', err);
      }
    }

    if (!layoutWorkerInstance) {
      layoutWorkerInstance = new LayoutWorker();
    }
  }

  return layoutWorkerInstance!;
}

export function getTypstWorker(): Comlink.Remote<TypstWorkerAPI> | TypstWorkerAPI {
  if (!typstWorkerInstance) {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        const worker = new Worker(
          new URL('../workers/typst.worker.ts', import.meta.url),
          { type: 'module' }
        );
        typstWorkerInstance = Comlink.wrap<TypstWorkerAPI>(worker);
      } catch (err) {
        console.warn('Typst Worker instantiation failed, falling back to direct instance:', err);
      }
    }

    if (!typstWorkerInstance) {
      typstWorkerInstance = new TypstWorker();
    }
  }

  return typstWorkerInstance!;
}

export const parserWorker = {
  parseFile: async (buffer: ArrayBuffer, fileName: string, sheetIndex?: number): Promise<CellIR> => {
    const worker = getParserWorker();
    return await worker.parseFile(buffer, fileName, sheetIndex);
  },
};

export const layoutWorker = {
  analyzeLayout: async (
    cellIR: CellIR,
    options?: LayoutOptions,
    onProgress?: (progress: number) => void
  ): Promise<LayoutIR> => {
    const worker = getLayoutWorker();
    return await worker.analyzeLayout(cellIR, options, onProgress ? Comlink.proxy(onProgress) : undefined);
  },
};

export const typstWorker = {
  generateMarkup: async (layout: LayoutIR, options?: TypstGeneratorOptions): Promise<string> => {
    const worker = getTypstWorker();
    return await worker.generateMarkup(layout, options);
  },
  compileToPDF: async (typstSource: string): Promise<Uint8Array> => {
    const worker = getTypstWorker();
    return await worker.compileToPDF(typstSource);
  },
  renderLayoutToPDF: async (layout: LayoutIR, options?: TypstGeneratorOptions): Promise<PDFRenderResult> => {
    const worker = getTypstWorker();
    return await worker.renderLayoutToPDF(layout, options);
  },
  mergePDFs: async (buffers: Uint8Array[]): Promise<Uint8Array> => {
    const worker = getTypstWorker();
    return await worker.mergePDFs(buffers);
  },
};
