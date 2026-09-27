import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

async function inspectPdfs() {
  const sheetNames = ['START_HERE', 'CS', 'DA', 'ECE', 'EE', 'ME', 'CE'];
  console.log('=== FORENSIC INSPECTION OF GENERATED PDFS ===\n');

  for (const sheet of sheetNames) {
    const pdfPath = path.resolve(`generated_pdfs/GATE2027_${sheet}.pdf`);
    const typPath = path.resolve(`generated_pdfs/GATE2027_${sheet}.typ`);

    const pdfBuffer = fs.readFileSync(pdfPath);
    const typContent = fs.readFileSync(typPath, 'utf-8');
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    const pageCount = pdfDoc.getPageCount();
    const pages = pdfDoc.getPages();

    console.log(`Document: GATE2027_${sheet}.pdf`);
    console.log(`  File size: ${(pdfBuffer.length / 1024).toFixed(1)} KB (${pdfBuffer.length} bytes)`);
    console.log(`  Total pages: ${pageCount}`);
    console.log(`  Typst source lines: ${typContent.split('\n').length}`);
    console.log(`  Typst table count: ${(typContent.match(/#table\(/g) || []).length}`);
    console.log(`  Typst headings count: ${(typContent.match(/#heading\(/g) || []).length}`);
    console.log(`  Typst callouts/blocks count: ${(typContent.match(/#block\(/g) || []).length}`);
    console.log(`  Typst grids (KPIs) count: ${(typContent.match(/#grid\(/g) || []).length}`);

    pages.forEach((p, idx) => {
      const { width, height } = p.getSize();
      console.log(`    Page ${idx + 1}: ${width.toFixed(1)} x ${height.toFixed(1)} pt (${width > height ? 'Landscape' : 'Portrait'})`);
    });
    console.log('');
  }
}

inspectPdfs().catch(console.error);
