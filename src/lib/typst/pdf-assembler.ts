import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface PDFMetadataOptions {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  keywords?: string[];
}

/**
 * Merges multiple PDF Uint8Array buffers into a single continuous PDF document.
 */
export async function mergePdfBuffers(buffers: Uint8Array[]): Promise<Uint8Array> {
  if (!buffers || buffers.length === 0) {
    return new Uint8Array(0);
  }

  if (buffers.length === 1 && buffers[0]) {
    return buffers[0];
  }

  const mergedDoc = await PDFDocument.create();

  for (const buffer of buffers) {
    if (!buffer || buffer.length === 0) continue;
    const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    for (const page of copiedPages) {
      mergedDoc.addPage(page);
    }
  }

  return mergedDoc.save();
}

/**
 * Returns the total page count of a PDF buffer.
 */
export async function getPDFPageCount(buffer: Uint8Array): Promise<number> {
  if (!buffer || buffer.length === 0) {
    return 0;
  }
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  return doc.getPageCount();
}

/**
 * Sets document title, author, and creator metadata on a PDF buffer.
 */
export async function setPDFMetadata(
  buffer: Uint8Array,
  metadata: PDFMetadataOptions
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

  if (metadata.title) doc.setTitle(metadata.title);
  if (metadata.author) doc.setAuthor(metadata.author);
  if (metadata.subject) doc.setSubject(metadata.subject);
  doc.setCreator(metadata.creator || 'Sheet-to-Art PDF Engine');
  doc.setProducer('Sheet-to-Art Client Pipeline (Typst & pdf-lib)');

  return doc.save();
}

/**
 * Creates a valid standalone PDF buffer (useful for fallbacks and testing).
 */
export async function createSamplePDF(title: string = 'Sheet-to-Art Document'): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4 in points
  const font = await doc.embedFont(StandardFonts.HelveticaBold);

  page.drawText(title, {
    x: 50,
    y: 800,
    size: 16,
    font,
    color: rgb(0.1, 0.2, 0.5),
  });

  doc.setTitle(title);
  doc.setCreator('Sheet-to-Art PDF Engine');

  return doc.save();
}
