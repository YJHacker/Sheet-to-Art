import fs from 'fs';
import path from 'path';
import { parseXLSX } from '../src/workers/xlsx-parser';
import { analyzeCellIR } from '../src/lib/layout/layout-engine';
import { generateTypstDocument } from '../src/lib/typst/typst-generator';
import { compileLayoutToPDF } from '../src/lib/typst/typst-compiler';
import { PDFDocument } from 'pdf-lib';

async function testVisualPolish() {
  const fixturePath = path.resolve('tests/fixtures/GATE2027_Tracker_AllBranches.xlsx');
  const fileBuffer = fs.readFileSync(fixturePath);
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

  const sheetNames = ['START_HERE', 'CS', 'DA', 'ECE', 'EE', 'ME', 'CE'];

  console.log('=== TESTING VISUAL POLISH ACROSS ALL 7 SHEETS ===\n');

  for (let sIdx = 0; sIdx < 7; sIdx++) {
    const sheetName = sheetNames[sIdx];
    const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', sIdx);
    const layout = analyzeCellIR(cellIR, { pageSize: 'a4', orientation: 'auto', theme: 'modern-clean' });
    const pdfResult = await compileLayoutToPDF(layout, { theme: 'modern-clean' });

    console.log(`Sheet [${sIdx}] "${sheetName}": ${pdfResult.pageCount} pages, size = ${pdfResult.pdfBuffer.length} bytes`);
  }
}

testVisualPolish().catch(console.error);
