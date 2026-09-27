import { readFileSync } from 'fs';
import { PDFDocument } from 'pdf-lib';

async function validatePdfFiles() {
  const sheetNames = ['START_HERE', 'CS', 'DA', 'ECE', 'EE', 'ME', 'CE'];

  console.log('=== REAL PDF FORENSIC VALIDATION REPORT ===\n');

  for (const sheet of sheetNames) {
    const pdfPath = `generated_pdfs/GATE2027_${sheet}.pdf`;
    const buffer = readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();
    const pages = pdfDoc.getPages();

    console.log(`Document: ${pdfPath}`);
    console.log(`  File Size: ${(buffer.length / 1024).toFixed(1)} KB`);
    console.log(`  Total Pages: ${pageCount}`);
    pages.forEach((p, idx) => {
      const { width, height } = p.getSize();
      const orientation = width > height ? 'Landscape' : 'Portrait';
      console.log(`    Page ${idx + 1}: ${width.toFixed(1)} x ${height.toFixed(1)} pt (${orientation})`);
    });
    console.log('');
  }
}

validatePdfFiles().catch(console.error);
