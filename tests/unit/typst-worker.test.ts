import { describe, it, expect } from 'vitest';
import { TypstWorker } from '../../src/workers/typst.worker';
import { typstWorker } from '../../src/lib/workers';
import { getPDFPageCount } from '../../src/lib/typst/pdf-assembler';
import type { LayoutIR } from '../../src/types/layout-ir';

describe('Typst Web Worker & Comlink RPC', () => {
  const sampleLayout: LayoutIR = {
    documentType: 'report',
    title: 'Worker Render Test',
    sections: [
      {
        type: 'kpi-grid',
        content: {
          items: [{ label: 'Metric A', value: '100' }],
          columns: 1,
        },
      },
    ],
    globalStyles: {
      pageSize: 'a4',
      orientation: 'portrait',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      fontFamily: 'Liberation Sans',
      baseFontSize: 8.5,
      theme: 'modern-clean',
    },
  };

  it('TypstWorker class should generate markup and compile PDF directly', async () => {
    const worker = new TypstWorker();

    const markup = await worker.generateMarkup(sampleLayout);
    expect(markup).toContain('Worker Render Test');

    const pdf = await worker.compileToPDF(markup);
    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(String.fromCharCode(...pdf.slice(0, 5))).toBe('%PDF-');

    const result = await worker.renderLayoutToPDF(sampleLayout);
    expect(result.pageCount).toBe(1);
    expect(result.pdfBuffer).toBeInstanceOf(Uint8Array);
  }, 30000);

  it('typstWorker helper should expose type-safe RPC interface', async () => {
    const result = await typstWorker.renderLayoutToPDF(sampleLayout);
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
    expect(result.pdfBuffer).toBeInstanceOf(Uint8Array);
    expect(String.fromCharCode(...result.pdfBuffer.slice(0, 5))).toBe('%PDF-');

    const merged = await typstWorker.mergePDFs([result.pdfBuffer, result.pdfBuffer]);
    expect(merged).toBeInstanceOf(Uint8Array);
    const mergedPages = await getPDFPageCount(merged);
    expect(mergedPages).toBe(result.pageCount * 2);
  }, 30000);
});
