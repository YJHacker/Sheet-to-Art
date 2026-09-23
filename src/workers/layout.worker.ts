// src/workers/layout.worker.ts
import * as Comlink from 'comlink';
import type { CellIR } from '../types/cell-ir';
import type { LayoutIR, LayoutOptions, LayoutWorkerAPI } from '../types/layout-ir';
import { analyzeCellIR } from '../lib/layout/layout-engine';

export class LayoutWorker implements LayoutWorkerAPI {
  async analyzeLayout(
    cellIR: CellIR,
    options: LayoutOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<LayoutIR> {
    onProgress?.(0.1);

    // Yield to event loop to allow UI updates
    await new Promise(resolve => setTimeout(resolve, 0));
    onProgress?.(0.5);

    const layout = analyzeCellIR(cellIR, options);

    onProgress?.(1.0);
    return layout;
  }
}

// Expose Comlink endpoint if running inside Web Worker context
if (typeof self !== 'undefined' && 'postMessage' in self && typeof (self as any).importScripts === 'function') {
  Comlink.expose(new LayoutWorker());
}
