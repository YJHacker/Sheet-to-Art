import { readFileSync } from 'fs';
import { parseXLSX } from '../src/workers/xlsx-parser';
import type { CellRow } from '../src/types/cell-ir';

function getBlockColCount(block: CellRow[]): number {
  let maxCol = 0;
  for (const row of block) {
    for (let c = 0; c < row.cells.length; c++) {
      const cell = row.cells[c];
      if (cell && cell.value !== null && cell.value !== undefined && String(cell.value).trim() !== '' && cell.type !== 'empty') {
        maxCol = Math.max(maxCol, c + 1);
      }
    }
  }
  return maxCol;
}

async function run() {
  const filePath = 'tests/fixtures/GATE2027_Tracker_AllBranches.xlsx';
  const fileBuffer = readFileSync(filePath);
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

  for (let i = 0; i < 7; i++) {
    const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', i);
    console.log(`\n=== SHEET ${i} (${cellIR.metadata.sheetName}) ===`);
    // Check all non-empty rows and their active columns
    const colCounts = new Set<number>();
    cellIR.rows.forEach(r => {
      const active = r.cells.filter(c => c.value != null && String(c.value).trim() !== '').length;
      if (active > 0) colCounts.add(active);
    });
    console.log(`Active column counts present in sheet:`, Array.from(colCounts).sort((a,b) => a-b));
  }
}

run();
