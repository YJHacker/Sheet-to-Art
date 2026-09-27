import { readFileSync } from 'fs';
import { parseXLSX } from '../src/workers/xlsx-parser';
import { isRowEmpty, isBannerRow } from '../src/lib/layout/section-detector';
import type { CellRow } from '../src/types/cell-ir';

function partitionRowBlocks(rows: CellRow[]): CellRow[][] {
  const blocks: CellRow[][] = [];
  let currentBlock: CellRow[] = [];
  let prevRowIndex = -1;

  for (const row of rows) {
    const isEmpty = isRowEmpty(row);
    const hasRowGap = prevRowIndex >= 0 && row.rowIndex > prevRowIndex + 1;

    if (isEmpty || hasRowGap) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
        currentBlock = [];
      }
    }

    if (!isEmpty) {
      if (currentBlock.length > 0) {
        const { isBanner } = isBannerRow(row);
        if (isBanner) {
          blocks.push(currentBlock);
          currentBlock = [];
        }
      }
      currentBlock.push(row);
      prevRowIndex = row.rowIndex;
    }
  }
  if (currentBlock.length > 0) blocks.push(currentBlock);
  return blocks;
}

async function run() {
  const filePath = 'tests/fixtures/GATE2027_Tracker_AllBranches.xlsx';
  const fileBuffer = readFileSync(filePath);
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

  for (let sheetIdx = 0; sheetIdx < 7; sheetIdx++) {
    const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', sheetIdx);
    console.log(`\n======================================================`);
    console.log(`SHEET ${sheetIdx}: ${cellIR.metadata.sheetName} (${cellIR.rows.length} total non-empty rows)`);
    console.log(`======================================================`);

    // Drop first row if document title banner
    let rows = [...cellIR.rows];
    if (rows.length > 0 && isBannerRow(rows[0]!).isBanner) {
      console.log(`[Document Title]: "${isBannerRow(rows[0]!).text}"`);
      rows = rows.slice(1);
    }

    const blocks = partitionRowBlocks(rows);
    console.log(`Total blocks partitioned: ${blocks.length}`);
    blocks.forEach((blk, bIdx) => {
      const firstRow = blk[0]!;
      const banner = isBannerRow(firstRow);
      const filled = firstRow.cells.filter(c => c.value != null && String(c.value).trim() !== '');
      console.log(`  Block #${bIdx}: length=${blk.length} rows (Excel row ${firstRow.rowIndex + 1}..${blk[blk.length - 1]!.rowIndex + 1}) | isBanner=${banner.isBanner} | firstRowCells=${filled.length} | firstCell="${String(filled[0]?.value || '').slice(0, 50)}"`);
    });
  }
}

run();
