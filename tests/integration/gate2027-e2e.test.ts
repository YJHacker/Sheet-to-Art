import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { parseXLSX, getWorkbookInfoXLSX } from '../../src/workers/xlsx-parser';
import { analyzeCellIR } from '../../src/lib/layout/layout-engine';
import { generateTypstDocument } from '../../src/lib/typst/typst-generator';
import { compileLayoutToPDF } from '../../src/lib/typst/typst-compiler';
import type { TableSection, KpiGridContent } from '../../src/types/layout-ir';

describe('GATE 2027 All Branches Fixture — Comprehensive End-to-End Acceptance Suite', { timeout: 60000 }, () => {
  const fileBuffer = readFileSync('tests/fixtures/GATE2027_Tracker_AllBranches.xlsx');
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength
  );

  it('1. Workbook Metadata: should discover and expose all 7 engineering branch worksheets dynamically', async () => {
    const workbookInfo = await getWorkbookInfoXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx');

    expect(workbookInfo.fileName).toBe('GATE2027_Tracker_AllBranches.xlsx');
    expect(workbookInfo.sheetNames).toEqual([
      'START HERE',
      'CS',
      'DA',
      'ECE',
      'EE',
      'ME',
      'CE',
    ]);
    expect(workbookInfo.sheets).toHaveLength(7);
  });

  it('2. Sheet 0 (START HERE): should parse into CellIR, detect 8+ semantic sections, and not collapse into 1 table', async () => {
    const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', 0);

    expect(cellIR.metadata.sheetName).toBe('START HERE');
    expect(cellIR.metadata.totalRows).toBeGreaterThanOrEqual(50);
    expect(cellIR.metadata.sheetNames).toHaveLength(7);

    const layout = analyzeCellIR(cellIR, { pageSize: 'a4', orientation: 'auto' });

    // Document Title extracted cleanly
    expect(layout.title).toContain('GATE 2027');
    expect(layout.title).toContain('Ojasvi Verma');

    // Multiple distinct semantic sections detected
    expect(layout.sections.length).toBeGreaterThanOrEqual(8);

    const sectionTitles = layout.sections.map((s) => s.title).filter(Boolean);
    expect(sectionTitles).toContain('REVERSE CALENDAR — five dates that cannot move');
    expect(sectionTitles).toContain('THE FOUR WEEKLY NON-NEGOTIABLES (repeated on every branch sheet)');
    expect(sectionTitles).toContain('THE TWO DAILY RULES (September through February, unchanged)');
    expect(sectionTitles).toContain('PAPER PATTERN AND FACTS YOU SHOULD KNOW BEFORE PLANNING');
    expect(sectionTitles).toContain('TARGET SCORE BANDS — decide yours today and write it on your branch sheet');
    expect(sectionTitles).toContain('FREE RESOURCES COMMON TO EVERY BRANCH');
    expect(sectionTitles).toContain('WHAT EACH BRANCH SHEET CONTAINS');

    // First table should have 5 columns: Date, What locks, What you must have ready, If you miss it, Done
    const calendarSection = layout.sections.find(
      (s) => s.title === 'REVERSE CALENDAR — five dates that cannot move'
    );
    expect(calendarSection).toBeDefined();
    expect(calendarSection?.type).toBe('table');
    const calTable = calendarSection?.content as TableSection;
    expect(calTable.columns).toHaveLength(5);
    expect(calTable.columns[0]?.header).toBe('Date');
    expect(calTable.rows).toHaveLength(5);
  });

  it('3. Sheet 1 (CS): should extract KPI target grid, Marks Map, Month-Wise Plan, and High-Yield tables', async () => {
    const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', 1);

    expect(cellIR.metadata.sheetName).toBe('CS');

    const layout = analyzeCellIR(cellIR, { pageSize: 'a4', orientation: 'auto' });

    expect(layout.title).toContain('CS — Computer Science & Information Technology');

    // KPI Target Grid detected
    const kpiSection = layout.sections.find((s) => s.type === 'kpi-grid');
    expect(kpiSection).toBeDefined();
    const kpi = kpiSection?.content as KpiGridContent;
    expect(kpi.items.length).toBeGreaterThanOrEqual(2);
    expect(kpi.items.some((i) => i.label.includes('TARGET SCORE'))).toBe(true);

    // Marks Map Table detected
    const marksMapSection = layout.sections.find(
      (s) => s.title && s.title.includes('MARKS MAP')
    );
    expect(marksMapSection).toBeDefined();
    const marksTable = marksMapSection?.content as TableSection;
    expect(marksTable.columns[0]?.header).toBe('Subject');
    expect(marksTable.rows.length).toBeGreaterThanOrEqual(10);
    expect(
      marksTable.rows.some((r) =>
        r.cells.some((c) => String(c.value).includes('Discrete Mathematics') || String(c.value).includes('Engineering Mathematics'))
      )
    ).toBe(true);

    // High Yield Topics Table detected
    const highYieldSection = layout.sections.find(
      (s) => s.title && s.title.includes('HIGH-YIELD TOPICS')
    );
    expect(highYieldSection).toBeDefined();
    const hyTable = highYieldSection?.content as TableSection;
    expect(hyTable.columns[0]?.header).toBe('Topic');
    expect(
      hyTable.rows.some((r) =>
        r.cells.some((c) => String(c.value).includes('Pipelining') || String(c.value).includes('Recurrence relations'))
      )
    ).toBe(true);
  });

  it('4. Typst WASM Generation: should compile all 7 worksheets to valid PDF buffers', async () => {
    for (let sheetIdx = 0; sheetIdx < 7; sheetIdx++) {
      const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', sheetIdx);
      const layout = analyzeCellIR(cellIR, { pageSize: 'a4', orientation: 'auto' });
      const typstMarkup = generateTypstDocument(layout, { theme: 'modern-clean' });

      expect(typstMarkup).toContain('#set page(');
      expect(typstMarkup).toContain('#set text(');

      const renderResult = await compileLayoutToPDF(layout, { theme: 'modern-clean' });
      expect(renderResult.pageCount).toBeGreaterThanOrEqual(1);
      expect(renderResult.pdfBuffer.length).toBeGreaterThan(1000);

      // Verify %PDF- header magic bytes
      const headerMagic = String.fromCharCode(...renderResult.pdfBuffer.slice(0, 5));
      expect(headerMagic).toBe('%PDF-');
    }
  });

  it('5. Controls Wiring: Page size, orientation, margins, and repeat headers modify Typst source', async () => {
    const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', 0);
    const layout = analyzeCellIR(cellIR, { pageSize: 'letter', orientation: 'landscape', marginPreset: 'compact' });

    // Test Landscape Letter with Compact Margins
    const markup1 = generateTypstDocument(layout, {
      pageSize: 'letter',
      orientation: 'landscape',
      marginPreset: 'compact',
      repeatTableHeaders: true,
      layoutMode: 'compact',
    });
    expect(markup1).toContain('paper: "us-letter"');
    expect(markup1).toContain('flipped: true');
    expect(markup1).toContain('top: 18pt');
    expect(markup1).toContain('table.header(');

    // Test A3 Portrait with Spacious Margins and No Repeated Headers
    const markup2 = generateTypstDocument(layout, {
      pageSize: 'a3',
      orientation: 'portrait',
      marginPreset: 'spacious',
      repeatTableHeaders: false,
      layoutMode: 'presentation',
    });
    expect(markup2).toContain('paper: "a3"');
    expect(markup2).toContain('flipped: false');
    expect(markup2).toContain('top: 54pt');
    expect(markup2).not.toContain('table.header(');
  });
});
