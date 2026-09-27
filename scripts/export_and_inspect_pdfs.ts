import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { parseXLSX } from '../src/workers/xlsx-parser';
import { analyzeCellIR } from '../src/lib/layout/layout-engine';
import { generateTypstDocument } from '../src/lib/typst/typst-generator';
import { compileLayoutToPDF } from '../src/lib/typst/typst-compiler';

async function exportPdfs() {
  const dir = 'generated_pdfs';
  if (!existsSync(dir)) mkdirSync(dir);

  const filePath = 'tests/fixtures/GATE2027_Tracker_AllBranches.xlsx';
  const fileBuffer = readFileSync(filePath);
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

  const sheetNames = ['START_HERE', 'CS', 'DA', 'ECE', 'EE', 'ME', 'CE'];

  for (let i = 0; i < 7; i++) {
    const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', i);
    const layout = analyzeCellIR(cellIR, { pageSize: 'a4', orientation: 'auto', theme: 'modern-clean' });
    const typstMarkup = generateTypstDocument(layout, { theme: 'modern-clean' });
    const typstPath = `${dir}/GATE2027_${sheetNames[i]}.typ`;
    writeFileSync(typstPath, typstMarkup, 'utf-8');

    const result = await compileLayoutToPDF(layout, { theme: 'modern-clean' });
    const pdfPath = `${dir}/GATE2027_${sheetNames[i]}.pdf`;
    writeFileSync(pdfPath, Buffer.from(result.pdfBuffer));

    console.log(`Exported Sheet ${i} (${sheetNames[i]}): ${pdfPath} (${result.pageCount} pages, ${result.pdfBuffer.length} bytes)`);
  }
}

exportPdfs().catch(console.error);
