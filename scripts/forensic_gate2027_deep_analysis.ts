import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { parseXLSX, getWorkbookInfoXLSX } from '../src/workers/xlsx-parser';
import { analyzeCellIR } from '../src/lib/layout/layout-engine';
import { generateTypstDocument } from '../src/lib/typst/typst-generator';
import { compileLayoutToPDF } from '../src/lib/typst/typst-compiler';
import { PDFDocument } from 'pdf-lib';

async function runForensicDeepAnalysis() {
  console.log('================================================================================');
  console.log('=== FORENSIC DEEP ANALYSIS: GATE 2027 WORKBOOK ===');
  console.log('================================================================================');

  const fixturePath = path.resolve('tests/fixtures/GATE2027_Tracker_AllBranches.xlsx');
  const unitPath = path.resolve('tests/unit/GATE2027_Tracker_AllBranches (1).xlsx');

  console.log(`\n[A] Locating Workbook:`);
  console.log(`Primary Fixture Path: ${fixturePath} (Exists: ${fs.existsSync(fixturePath)})`);
  console.log(`Unit Test Copy Path: ${unitPath} (Exists: ${fs.existsSync(unitPath)})`);

  const fileBuffer = fs.readFileSync(fixturePath);
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

  // 1. ExcelJS Raw Workbook Loading
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  const sheetCount = workbook.worksheets.length;
  const sheetNames = workbook.worksheets.map(ws => ws.name);

  // Also test getWorkbookInfoXLSX
  const wbInfo = await getWorkbookInfoXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx');

  console.log(`\n[B] Workbook Dimensions & Discovered Sheets:`);
  console.log(`Total Sheets: ${sheetCount}`);
  console.log(`Sheet Names (dynamically discovered from ExcelJS): ${JSON.stringify(sheetNames)}`);
  console.log(`Sheet Names (from getWorkbookInfoXLSX): ${JSON.stringify(wbInfo.sheetNames)}`);
  console.log(`Sheets Info:`, wbInfo.sheets);

  const sheetStats: any[] = [];

  for (let sIdx = 0; sIdx < sheetCount; sIdx++) {
    const ws = workbook.worksheets[sIdx]!;

    // Count raw non-empty rows and cells
    let rawNonEmptyRows = 0;
    let rawNonEmptyCells = 0;
    const rawRowDetails: { rowNum: number; cellCount: number; sample: string }[] = [];

    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      let cellCountInRow = 0;
      const vals: string[] = [];
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        cellCountInRow++;
        const valStr = cell.value != null ? (typeof cell.value === 'object' ? JSON.stringify(cell.value) : String(cell.value)) : '';
        if (vals.length < 5 && valStr.trim().length > 0) {
          vals.push(`C${colNumber}: "${valStr.slice(0, 30)}"`);
        }
      });
      if (cellCountInRow > 0) {
        rawNonEmptyRows++;
        rawNonEmptyCells += cellCountInRow;
        rawRowDetails.push({
          rowNum: rowNumber,
          cellCount: cellCountInRow,
          sample: vals.join(' | ')
        });
      }
    });

    const merges = (ws as any)._merges ? Object.keys((ws as any)._merges) : [];

    sheetStats.push({
      sheetIndex: sIdx,
      sheetName: ws.name,
      rowCount: ws.rowCount,
      actualRowCount: ws.actualRowCount,
      columnCount: ws.columnCount,
      actualColumnCount: ws.actualColumnCount,
      nonEmptyRows: rawNonEmptyRows,
      nonEmptyCells: rawNonEmptyCells,
      mergeCount: merges.length,
      sampleMerges: merges.slice(0, 5),
      rowDetails: rawRowDetails
    });
  }

  sheetStats.forEach(st => {
    console.log(`\nSheet [${st.sheetIndex}] "${st.sheetName}":`);
    console.log(`  Excel Dimensions: rows ${st.rowCount} (actual: ${st.actualRowCount}), cols ${st.columnCount} (actual: ${st.actualColumnCount})`);
    console.log(`  Raw Non-Empty Rows: ${st.nonEmptyRows}, Non-Empty Cells: ${st.nonEmptyCells}, Merges: ${st.mergeCount}`);
    if (st.mergeCount > 0) {
      console.log(`  Sample Merges: ${st.sampleMerges.join(', ')}`);
    }
  });

  // 2. Parser -> CellIR
  console.log('\n================================================================================');
  console.log('[E] Parser -> CellIR Processing:');
  console.log('================================================================================');

  const cellIRs: any[] = [];
  for (let sIdx = 0; sIdx < sheetCount; sIdx++) {
    const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', sIdx);
    cellIRs.push(cellIR);

    let cellIRNonEmptyCells = 0;
    let boldCellsCount = 0;
    let coloredCellsCount = 0;

    cellIR.rows.forEach(r => {
      r.cells.forEach(c => {
        if (c && c.value != null && String(c.value).trim() !== '') {
          cellIRNonEmptyCells++;
        }
        if (c?.style?.bold) boldCellsCount++;
        if (c?.style?.bgColor) coloredCellsCount++;
      });
    });

    console.log(`\nSheet [${sIdx}] "${cellIR.metadata.sheetName}":`);
    console.log(`  Metadata: fileName="${cellIR.metadata.fileName}", sheetName="${cellIR.metadata.sheetName}", activeSheetIndex=${cellIR.metadata.activeSheetIndex}`);
    console.log(`  Dimensions: totalRows=${cellIR.metadata.totalRows}, totalCols=${cellIR.metadata.totalCols}`);
    console.log(`  CellIR Rows: ${cellIR.rows.length}, Non-Empty Cells: ${cellIRNonEmptyCells}, Bold Cells: ${boldCellsCount}, Colored Cells: ${coloredCellsCount}`);
  }

  // 3. Section Detection & LayoutIR
  console.log('\n================================================================================');
  console.log('[F & G] Section Detection & LayoutIR Processing:');
  console.log('================================================================================');

  const layoutIRs: any[] = [];
  for (let sIdx = 0; sIdx < sheetCount; sIdx++) {
    const cellIR = cellIRs[sIdx];
    const layout = analyzeCellIR(cellIR, { pageSize: 'a4', orientation: 'auto', theme: 'modern-clean' });
    layoutIRs.push(layout);

    console.log(`\nSheet [${sIdx}] "${cellIR.metadata.sheetName}":`);
    console.log(`  Document Type: ${layout.documentType}`);
    console.log(`  Title: "${layout.title}"`);
    console.log(`  Page: ${layout.globalStyles.pageSize} ${layout.globalStyles.orientation} (margins: top=${layout.globalStyles.margins.top}, bottom=${layout.globalStyles.margins.bottom}, left=${layout.globalStyles.margins.left}, right=${layout.globalStyles.margins.right})`);
    console.log(`  Sections Count: ${layout.sections.length}`);

    let totalTableRows = 0;
    let totalTableCols = 0;

    layout.sections.forEach((sec, secIdx) => {
      console.log(`    Section [${secIdx}] type="${sec.type}", title="${sec.title || '(no title)'}"`);
      if (sec.type === 'table') {
        const tbl = sec.content as any;
        totalTableRows += tbl.rows.length;
        totalTableCols = Math.max(totalTableCols, tbl.columns.length);
        const colSummary = tbl.columns.map((c: any) => `"${c.header}" (${c.dataType}, width=${c.suggestedWidth || c.allocatedWidth})`).join(', ');
        console.log(`      Table Columns (${tbl.columns.length}): ${colSummary}`);
        console.log(`      Table Rows: ${tbl.rows.length}`);
        if (tbl.rows.length > 0) {
          const firstRowVals = tbl.rows[0].cells.map((c: any) => String(c.value)).join(' | ');
          const lastRowVals = tbl.rows[tbl.rows.length - 1].cells.map((c: any) => String(c.value)).join(' | ');
          console.log(`      First Row: ${firstRowVals.slice(0, 100)}`);
          console.log(`      Last Row: ${lastRowVals.slice(0, 100)}`);
        }
      } else if (sec.type === 'kpi-grid') {
        const kpi = sec.content as any;
        console.log(`      KPI Grid: ${kpi.items.length} cards: ${kpi.items.map((it: any) => `${it.label}=${it.value}`).join(', ')}`);
      } else if (sec.type === 'text') {
        const text = sec.content as any;
        console.log(`      Text (${text.paragraphs?.length || 0} paragraphs): ${(text.paragraphs || []).slice(0, 3).join('; ')}`);
      }
    });

    console.log(`  Total Data Rows across tables: ${totalTableRows}`);
  }

  // 4. Typst Markup & PDF Generation
  console.log('\n================================================================================');
  console.log('[H] Typst & PDF Generation & Forensic PDF Inspection:');
  console.log('================================================================================');

  for (let sIdx = 0; sIdx < sheetCount; sIdx++) {
    const layout = layoutIRs[sIdx];
    const typst = generateTypstDocument(layout, { theme: 'modern-clean' });
    const pdfResult = await compileLayoutToPDF(layout, { theme: 'modern-clean' });

    const pdfDoc = await PDFDocument.load(pdfResult.pdfBuffer);
    const actualPages = pdfDoc.getPageCount();
    const pages = pdfDoc.getPages();

    console.log(`\nSheet [${sIdx}] "${sheetNames[sIdx]}":`);
    console.log(`  Typst Code Length: ${typst.length} chars, ${typst.split('\n').length} lines`);
    console.log(`  Generated PDF Size: ${pdfResult.pdfBuffer.length} bytes (${(pdfResult.pdfBuffer.length / 1024).toFixed(1)} KB)`);
    console.log(`  Reported Pages: ${pdfResult.pageCount}, Actual PDF Pages: ${actualPages}`);
    pages.forEach((p, pIdx) => {
      const { width, height } = p.getSize();
      console.log(`    Page ${pIdx + 1}: ${width.toFixed(1)} x ${height.toFixed(1)} pt (${width > height ? 'Landscape' : 'Portrait'})`);
    });
  }

  console.log('\n================================================================================');
  console.log('=== FORENSIC DEEP ANALYSIS COMPLETE ===');
  console.log('================================================================================');
}

runForensicDeepAnalysis().catch(console.error);
