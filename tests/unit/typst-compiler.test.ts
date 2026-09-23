import { describe, it, expect, beforeAll } from 'vitest';
import {
  initTypstEngine,
  compileTypstToPDF,
  compileLayoutToPDF,
} from '../../src/lib/typst/typst-compiler';
import type { LayoutIR } from '../../src/types/layout-ir';

describe('Typst WASM Compiler & Engine Bridge', () => {
  beforeAll(async () => {
    await initTypstEngine();
  }, 60000);

  it('initTypstEngine() should resolve successfully', async () => {
    await expect(initTypstEngine()).resolves.toBeDefined();
  }, 30000);

  it('compileTypstToPDF() should compile simple Typst markup to a valid PDF buffer', async () => {
    const source = `
      #set page(paper: "a4", margin: 15mm)
      #set text(font: "Liberation Sans", size: 10pt)
      = Financial Performance Summary
      This is a test PDF document generated directly from Typst WASM.
    `;

    const pdf = await compileTypstToPDF(source);
    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf.length).toBeGreaterThan(100);

    const header = String.fromCharCode(...pdf.slice(0, 5));
    expect(header).toBe('%PDF-');
  }, 30000);

  it('compileTypstToPDF() should throw meaningful error on empty or invalid Typst source', async () => {
    await expect(compileTypstToPDF('')).rejects.toThrow('Typst source cannot be empty');
    await expect(compileTypstToPDF('   \n  ')).rejects.toThrow('Typst source cannot be empty');
    await expect(compileTypstToPDF('#invalid(syntax[[[')).rejects.toThrow();
  }, 30000);

  it('compileLayoutToPDF() should compile LayoutIR into a full PDFRenderResult', async () => {
    const sampleLayout: LayoutIR = {
      documentType: 'report',
      title: 'Q3 Executive Report',
      sections: [
        {
          type: 'kpi-grid',
          content: {
            items: [
              { label: 'Revenue', value: '$100k' },
              { label: 'Growth', value: '+25%' },
            ],
            columns: 2,
          },
        },
        {
          type: 'table',
          title: 'Product Breakdown',
          content: {
            columns: [
              {
                index: 0,
                header: 'Product',
                dataType: 'text',
                alignment: 'left',
                minWidth: 50,
                maxWidth: 150,
                suggestedWidth: 100,
                stats: { nullCount: 0, uniqueValues: 2, maxLength: 8 },
              },
              {
                index: 1,
                header: 'Units Sold',
                dataType: 'number',
                alignment: 'right',
                minWidth: 40,
                maxWidth: 100,
                suggestedWidth: 80,
                stats: { nullCount: 0, uniqueValues: 2, maxLength: 4 },
              },
            ],
            rows: [
              {
                cells: [
                  { value: 'Enterprise Plan', formattedValue: 'Enterprise Plan', alignment: 'left' },
                  { value: 450, formattedValue: '450', alignment: 'right' },
                ],
              },
            ],
            headerStyle: { bold: true, bgColor: '#F1F5F9', textColor: '#0F172A' },
            alternatingRows: true,
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

    const result = await compileLayoutToPDF(sampleLayout);
    expect(result).toBeDefined();
    expect(result.pdfBuffer).toBeInstanceOf(Uint8Array);
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
    expect(result.typstSource).toContain('Enterprise Plan');

    const header = String.fromCharCode(...result.pdfBuffer.slice(0, 5));
    expect(header).toBe('%PDF-');
  }, 30000);
});
