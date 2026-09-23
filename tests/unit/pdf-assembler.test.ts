import { describe, it, expect } from 'vitest';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  mergePdfBuffers,
  getPDFPageCount,
  setPDFMetadata,
  createSamplePDF,
} from '../../src/lib/typst/pdf-assembler';

describe('PDF Buffer Assembler (pdf-lib)', () => {
  async function makeTestPdf(text: string, pageCount: number = 1): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    for (let i = 0; i < pageCount; i++) {
      const page = doc.addPage([400, 400]);
      page.drawText(`${text} - Page ${i + 1}`, { x: 50, y: 350, size: 12, color: rgb(0, 0, 0) });
    }
    return doc.save();
  }

  it('createSamplePDF() should create a valid PDF with %PDF- header', async () => {
    const pdf = await createSamplePDF('Sample Document');
    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf.length).toBeGreaterThan(100);
    // PDF Magic number %PDF-
    const header = String.fromCharCode(...pdf.slice(0, 5));
    expect(header).toBe('%PDF-');
  });

  it('getPDFPageCount() should return accurate page count', async () => {
    const pdf1 = await makeTestPdf('Doc 1', 1);
    const pdf3 = await makeTestPdf('Doc 3', 3);

    expect(await getPDFPageCount(pdf1)).toBe(1);
    expect(await getPDFPageCount(pdf3)).toBe(3);
  });

  it('mergePdfBuffers() should correctly merge multiple PDF byte buffers', async () => {
    const pdfA = await makeTestPdf('Section A', 2);
    const pdfB = await makeTestPdf('Section B', 1);
    const pdfC = await makeTestPdf('Section C', 3);

    const merged = await mergePdfBuffers([pdfA, pdfB, pdfC]);
    expect(merged).toBeInstanceOf(Uint8Array);

    const mergedPageCount = await getPDFPageCount(merged);
    expect(mergedPageCount).toBe(6); // 2 + 1 + 3 = 6
  });

  it('mergePdfBuffers() should handle single and empty buffer lists gracefully', async () => {
    const emptyMerged = await mergePdfBuffers([]);
    expect(emptyMerged.length).toBe(0);

    const single = await makeTestPdf('Single', 2);
    const singleMerged = await mergePdfBuffers([single]);
    expect(await getPDFPageCount(singleMerged)).toBe(2);
  });

  it('setPDFMetadata() should attach title and creator metadata to PDF', async () => {
    const pdf = await makeTestPdf('Meta Doc', 1);
    const stamped = await setPDFMetadata(pdf, {
      title: 'Financial Quarterly Report',
      author: 'Sheet-to-Art',
      subject: 'Financials',
    });

    const doc = await PDFDocument.load(stamped);
    expect(doc.getTitle()).toBe('Financial Quarterly Report');
    expect(doc.getAuthor()).toBe('Sheet-to-Art');
    expect(doc.getCreator()).toBe('Sheet-to-Art PDF Engine');
  });
});
