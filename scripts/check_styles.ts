import { readFileSync } from 'fs';
import { parseXLSX } from '../src/workers/xlsx-parser';
import { detectSections } from '../src/lib/layout/section-detector';

async function checkStyles() {
  const buf = readFileSync('tests/fixtures/styles.xlsx');
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const cellIR = await parseXLSX(arrayBuffer, 'styles.xlsx', 0);
  console.log('CellIR rows:', cellIR.rows);
  const detected = detectSections(cellIR);
  console.log('Detected title:', detected.title);
  console.log('Detected sections:', detected.sections);
}

checkStyles();
