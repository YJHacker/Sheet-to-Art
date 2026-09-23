import * as Comlink from 'comlink';
import type { LayoutIR } from '../types/layout-ir';
import type {
  TypstWorkerAPI,
  TypstGeneratorOptions,
  PDFRenderResult,
} from '../types/typst';
import { generateTypstDocument } from '../lib/typst/typst-generator';
import { compileTypstToPDF, compileLayoutToPDF } from '../lib/typst/typst-compiler';
import { mergePdfBuffers } from '../lib/typst/pdf-assembler';

export class TypstWorker implements TypstWorkerAPI {
  async generateMarkup(
    layout: LayoutIR,
    options?: TypstGeneratorOptions
  ): Promise<string> {
    return generateTypstDocument(layout, options);
  }

  async compileToPDF(typstSource: string): Promise<Uint8Array> {
    return compileTypstToPDF(typstSource);
  }

  async renderLayoutToPDF(
    layout: LayoutIR,
    options?: TypstGeneratorOptions
  ): Promise<PDFRenderResult> {
    return compileLayoutToPDF(layout, options);
  }

  async mergePDFs(buffers: Uint8Array[]): Promise<Uint8Array> {
    return mergePdfBuffers(buffers);
  }
}

// Expose via Comlink if inside a Web Worker context
if (
  typeof self !== 'undefined' &&
  'postMessage' in self &&
  typeof (self as any).importScripts === 'function'
) {
  Comlink.expose(new TypstWorker());
}
