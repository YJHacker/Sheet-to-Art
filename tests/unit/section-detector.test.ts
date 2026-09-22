// tests/unit/section-detector.test.ts
import { describe, it, expect } from 'vitest';
import type { CellIR, CellRow } from '../../src/types/cell-ir';
import { detectSections } from '../../src/lib/layout/section-detector';
import type { TableSection, TextSectionContent, KpiGridContent } from '../../src/types/layout-ir';

describe('Section Detector & Boundary Segmentation', () => {
  it('should extract title from top single-cell banner row and table from following rows', () => {
    const cellIR: CellIR = {
      metadata: { fileName: 'report.xlsx', sheetName: 'Sheet1', totalRows: 4, totalCols: 3 },
      rows: [
        {
          rowIndex: 0,
          cells: [
            { value: 'Monthly Financial Statement', type: 'string', style: { bold: true, fontSize: 16 }, position: { row: 0, col: 0 } },
            { value: null, type: 'empty', position: { row: 0, col: 1 } },
            { value: null, type: 'empty', position: { row: 0, col: 2 } },
          ],
        },
        {
          rowIndex: 1,
          cells: [
            { value: 'Category', type: 'string', style: { bold: true }, position: { row: 1, col: 0 } },
            { value: 'Budget', type: 'string', style: { bold: true }, position: { row: 1, col: 1 } },
            { value: 'Actual', type: 'string', style: { bold: true }, position: { row: 1, col: 2 } },
          ],
        },
        {
          rowIndex: 2,
          cells: [
            { value: 'Marketing', type: 'string', position: { row: 2, col: 0 } },
            { value: 5000, type: 'number', position: { row: 2, col: 1 } },
            { value: 4800, type: 'number', position: { row: 2, col: 2 } },
          ],
        },
        {
          rowIndex: 3,
          cells: [
            { value: 'Engineering', type: 'string', position: { row: 3, col: 0 } },
            { value: 12000, type: 'number', position: { row: 3, col: 1 } },
            { value: 11500, type: 'number', position: { row: 3, col: 2 } },
          ],
        },
      ],
    };

    const result = detectSections(cellIR);
    expect(result.title).toBe('Monthly Financial Statement');
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0]!.type).toBe('table');

    const tableContent = result.sections[0]!.content as TableSection;
    expect(tableContent.columns).toHaveLength(3);
    expect(tableContent.columns[0]!.header).toBe('Category');
    expect(tableContent.rows).toHaveLength(2);
  });

  it('should segment a sheet with a table followed by empty rows and a trailing text note', () => {
    const cellIR: CellIR = {
      metadata: { fileName: 'study_plan.xlsx', sheetName: 'Study Plan', totalRows: 6, totalCols: 2 },
      rows: [
        {
          rowIndex: 0,
          cells: [
            { value: 'Week', type: 'string', style: { bold: true }, position: { row: 0, col: 0 } },
            { value: 'Topic', type: 'string', style: { bold: true }, position: { row: 0, col: 1 } },
          ],
        },
        {
          rowIndex: 1,
          cells: [
            { value: 'Week 1', type: 'string', position: { row: 1, col: 0 } },
            { value: 'Mechanics', type: 'string', position: { row: 1, col: 1 } },
          ],
        },
        // Blank row separating table from notes
        {
          rowIndex: 2,
          cells: [
            { value: null, type: 'empty', position: { row: 2, col: 0 } },
            { value: null, type: 'empty', position: { row: 2, col: 1 } },
          ],
        },
        {
          rowIndex: 3,
          cells: [
            { value: 'Note: All exams take place on Friday afternoon.', type: 'string', style: { italic: true }, position: { row: 3, col: 0 } },
            { value: null, type: 'empty', position: { row: 3, col: 1 } },
          ],
        },
      ],
    };

    const result = detectSections(cellIR);
    expect(result.sections.length).toBeGreaterThanOrEqual(2);
    expect(result.sections[0]!.type).toBe('table');
    expect(result.sections[1]!.type).toBe('text');

    const textContent = result.sections[1]!.content as TextSectionContent;
    expect(textContent.paragraphs[0]).toContain('Note: All exams take place on Friday afternoon.');
  });

  it('should detect KPI summary blocks consisting of key-value metrics', () => {
    const cellIR: CellIR = {
      metadata: { fileName: 'dashboard.xlsx', sheetName: 'KPIs', totalRows: 2, totalCols: 4 },
      rows: [
        {
          rowIndex: 0,
          cells: [
            { value: 'Total Revenue', type: 'string', position: { row: 0, col: 0 } },
            { value: '$1.2M', type: 'string', style: { bold: true }, position: { row: 0, col: 1 } },
            { value: 'Active Users', type: 'string', position: { row: 0, col: 2 } },
            { value: '45,000', type: 'string', style: { bold: true }, position: { row: 0, col: 3 } },
          ],
        },
      ],
    };

    const result = detectSections(cellIR);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0]!.type).toBe('kpi-grid');
    const kpiContent = result.sections[0]!.content as KpiGridContent;
    expect(kpiContent.items).toHaveLength(2);
    expect(kpiContent.items[0]!.label).toBe('Total Revenue');
    expect(kpiContent.items[0]!.value).toBe('$1.2M');
  });
});
