import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { parseXLSX, getWorkbookInfoXLSX } from '../../src/workers/xlsx-parser';
import { analyzeCellIR } from '../../src/lib/layout/layout-engine';
import { generateTypstDocument } from '../../src/lib/typst/typst-generator';
import { compileLayoutToPDF } from '../../src/lib/typst/typst-compiler';
import type { TableSection, KpiGridContent, TextSectionContent } from '../../src/types/layout-ir';

describe('GATE 2027 Comprehensive Data Fidelity & Structural Layout Acceptance Suite', { timeout: 180000 }, () => {
  const filePath = 'tests/fixtures/GATE2027_Tracker_AllBranches.xlsx';
  const fileBuffer = readFileSync(filePath);
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength
  );

  it('Requirement 1: All 7 worksheets discovered and accessible', async () => {
    const info = await getWorkbookInfoXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx');
    expect(info.sheetNames).toEqual(['START HERE', 'CS', 'DA', 'ECE', 'EE', 'ME', 'CE']);
    expect(info.sheets).toHaveLength(7);
  });

  it('Requirement 2 & 5: Sheet 0 (START HERE) maintains 9 semantic sections with zero dummy columns', async () => {
    const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', 0);
    const layout = analyzeCellIR(cellIR, { pageSize: 'a4', orientation: 'auto' });

    expect(layout.title).toContain('GATE 2027');
    expect(layout.title).toContain('Ojasvi Verma');
    expect(layout.sections).toHaveLength(9);

    // Section 0: Top Instruction Note
    expect(layout.sections[0]!.type).toBe('text');
    const topNote = layout.sections[0]!.content as TextSectionContent;
    expect(topNote.paragraphs[0]).toContain('HOW TO USE THIS TRACKER');

    // Section 1: Reverse Calendar Table (5 cols)
    expect(layout.sections[1]!.type).toBe('table');
    const calTable = layout.sections[1]!.content as TableSection;
    expect(calTable.columns).toHaveLength(5);
    expect(calTable.columns.map(c => c.header)).toEqual([
      'Date',
      'What locks on this date',
      'What you must have ready',
      'If you miss it',
      'Done',
    ]);
    expect(calTable.rows).toHaveLength(5);

    // Section 4: Paper Pattern & Facts Table (3 cols — NOT 5 cols!)
    expect(layout.sections[4]!.type).toBe('table');
    const patternTable = layout.sections[4]!.content as TableSection;
    expect(patternTable.columns).toHaveLength(3);
    expect(patternTable.columns.map(c => c.header)).toEqual([
      'Item',
      'Detail',
      'What it means for your plan',
    ]);
    expect(patternTable.rows).toHaveLength(7);

    // Section 7: What Each Branch Sheet Contains (2 cols — NOT 5 cols!)
    expect(layout.sections[7]!.type).toBe('table');
    const branchContentTable = layout.sections[7]!.content as TableSection;
    expect(branchContentTable.columns).toHaveLength(2);
    expect(branchContentTable.columns.map(c => c.header)).toEqual([
      'Block',
      'What it does for you',
    ]);
    expect(branchContentTable.rows).toHaveLength(10);
  });

  it('Requirement 3 & 4 & 13: Branch Sheets preserve all 16 sections, KPI cards, tables, and notes without data loss', async () => {
    const branchSheets = [
      { idx: 1, name: 'CS', titleKey: 'Computer Science' },
      { idx: 2, name: 'DA', titleKey: 'Data Science' },
      { idx: 3, name: 'ECE', titleKey: 'Electronics & Communication' },
      { idx: 4, name: 'EE', titleKey: 'Electrical Engineering' },
      { idx: 5, name: 'ME', titleKey: 'Mechanical Engineering' },
      { idx: 6, name: 'CE', titleKey: 'Civil Engineering' },
    ];

    for (const b of branchSheets) {
      const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', b.idx);
      const layout = analyzeCellIR(cellIR, { pageSize: 'a4', orientation: 'auto' });

      expect(layout.title).toContain(b.name);
      expect(layout.title).toContain(b.titleKey);
      expect(layout.sections).toHaveLength(16);

      // Section 1: KPI Grid (Target Score + Daily Study Hours)
      expect(layout.sections[1]!.type).toBe('kpi-grid');
      const kpi = layout.sections[1]!.content as KpiGridContent;
      expect(kpi.items.length).toBeGreaterThanOrEqual(2);
      expect(kpi.items[0]!.label).toContain('TARGET SCORE');
      expect(kpi.items[1]!.label).toContain('DAILY STUDY HOURS');

      // Section 2: Marks Map Table (4 cols)
      expect(layout.sections[2]!.type).toBe('table');
      const marksMap = layout.sections[2]!.content as TableSection;
      expect(marksMap.columns).toHaveLength(4);
      expect(marksMap.columns.map(c => c.header)).toEqual([
        'Subject',
        'Approx. marks',
        'Priority',
        'How to study it',
      ]);
      expect(marksMap.rows.length).toBeGreaterThanOrEqual(8);

      // Section 4: Month-Wise Plan (5 cols)
      expect(layout.sections[4]!.type).toBe('table');
      const monthPlan = layout.sections[4]!.content as TableSection;
      expect(monthPlan.columns).toHaveLength(5);
      expect(monthPlan.rows).toHaveLength(6);

      // Section 5: High-Yield Topics (3 cols)
      expect(layout.sections[5]!.type).toBe('table');
      const hyTable = layout.sections[5]!.content as TableSection;
      expect(hyTable.columns).toHaveLength(3);
      expect(hyTable.rows).toHaveLength(12);

      // Section 10: Weekly Non-Negotiables (5 cols, 22 weeks)
      expect(layout.sections[10]!.type).toBe('table');
      const weeklyTable = layout.sections[10]!.content as TableSection;
      expect(weeklyTable.columns).toHaveLength(5);
      expect(weeklyTable.rows).toHaveLength(22);

      // Section 11: Mock Log (5 cols, 20 mocks)
      expect(layout.sections[11]!.type).toBe('table');
      const mockTable = layout.sections[11]!.content as TableSection;
      expect(mockTable.columns).toHaveLength(5);
      expect(mockTable.rows).toHaveLength(20);

      // Section 13: Error Log (5 cols, 25 error entries)
      expect(layout.sections[13]!.type).toBe('table');
      const errorTable = layout.sections[13]!.content as TableSection;
      expect(errorTable.columns).toHaveLength(5);
      expect(errorTable.rows).toHaveLength(25);

      // Section 15: Milestone Checkpoints (5 items)
      expect(layout.sections[15]!.type).toBe('kpi-grid');
      const checkpoints = layout.sections[15]!.content as KpiGridContent;
      expect(checkpoints.items).toHaveLength(5);
      expect(checkpoints.items[0]!.value).toContain('Syllabus 100%');
      expect(checkpoints.items[1]!.value).toContain('PYQ Round 1');
    }
  });

  it('Requirement 8 & 9 & 14: Typst and WASM PDF compilation across all 7 sheets with exact column allocation', async () => {
    for (let i = 0; i < 7; i++) {
      const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', i);
      const layout = analyzeCellIR(cellIR, { pageSize: 'a4', orientation: 'auto', theme: 'modern-clean' });
      const typst = generateTypstDocument(layout, { theme: 'modern-clean' });

      // Verify Typst markup characteristics
      expect(typst).toContain('#set page(');
      expect(typst).toContain('header: context if here().page() > 1');
      expect(typst).toContain('table.header(');
      expect(typst).toContain('#heading(level: 2');

      const renderResult = await compileLayoutToPDF(layout, { theme: 'modern-clean' });
      expect(renderResult.pageCount).toBeGreaterThanOrEqual(2);
      expect(renderResult.pdfBuffer.length).toBeGreaterThan(50000);

      // Verify PDF Magic Bytes %PDF-
      const magic = String.fromCharCode(...renderResult.pdfBuffer.slice(0, 5));
      expect(magic).toBe('%PDF-');
    }
  });
});
