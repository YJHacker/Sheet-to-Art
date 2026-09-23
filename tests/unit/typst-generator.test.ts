import { describe, it, expect } from 'vitest';
import { generateTypstDocument } from '../../src/lib/typst/typst-generator';
import type { LayoutIR, DocumentSection, TableSection, KpiGridContent, TextSectionContent } from '../../src/types/layout-ir';

describe('Typst Document & Section Generator', () => {
  const sampleTableSection: DocumentSection = {
    type: 'table',
    title: 'Q3 Financials',
    content: {
      columns: [
        {
          index: 0,
          header: 'Department',
          dataType: 'text',
          alignment: 'left',
          minWidth: 50,
          maxWidth: 150,
          suggestedWidth: 100,
          stats: { nullCount: 0, uniqueValues: 2, maxLength: 10 },
        },
        {
          index: 1,
          header: 'Revenue ($)',
          dataType: 'number',
          alignment: 'right',
          numberFormat: 'currency',
          minWidth: 40,
          maxWidth: 100,
          suggestedWidth: 80,
          stats: { nullCount: 0, uniqueValues: 2, maxLength: 8 },
        },
      ],
      rows: [
        {
          cells: [
            { value: 'Engineering', formattedValue: 'Engineering', alignment: 'left' },
            { value: 125000, formattedValue: '$125,000', alignment: 'right' },
          ],
        },
        {
          cells: [
            { value: 'Marketing & Sales', formattedValue: 'Marketing & Sales', alignment: 'left' },
            { value: 95000, formattedValue: '$95,000', alignment: 'right' },
          ],
        },
      ],
      headerStyle: { bold: true, bgColor: '#F1F5F9', textColor: '#0F172A' },
      alternatingRows: true,
    } as TableSection,
  };

  const sampleKpiSection: DocumentSection = {
    type: 'kpi-grid',
    title: 'Summary Metrics',
    content: {
      items: [
        { label: 'Total Revenue', value: '$220,000', change: '+12% YoY' },
        { label: 'Total Headcount', value: '45' },
      ],
      columns: 2,
    } as KpiGridContent,
  };

  const sampleTextSection: DocumentSection = {
    type: 'text',
    title: 'Notes & Assumptions',
    content: {
      paragraphs: [
        '1. Revenue figures are based on preliminary Q3 un-audited books.',
        '2. Currency converted at 1.00 USD rate.',
      ],
    } as TextSectionContent,
  };

  const baseLayout: LayoutIR = {
    documentType: 'report',
    title: 'Executive Financial Summary',
    sections: [sampleKpiSection, sampleTableSection, sampleTextSection],
    globalStyles: {
      pageSize: 'a4',
      orientation: 'portrait',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      fontFamily: 'Liberation Sans',
      baseFontSize: 8.5,
      theme: 'modern-clean',
    },
  };

  it('should generate valid Typst 0.11+ source code', () => {
    const typst = generateTypstDocument(baseLayout);
    expect(typst).toContain('#set page(');
    expect(typst).toContain('paper: "a4"');
    expect(typst).toContain('flipped: false');
    expect(typst).toContain('context');
    expect(typst).toContain('#set text(');
  });

  it('should properly sanitize and escape special characters in document title and content', () => {
    const layoutWithSpecialChars: LayoutIR = {
      ...baseLayout,
      title: 'Sales & Revenue [Q3_2026] #1 ($50k* Target)',
    };
    const typst = generateTypstDocument(layoutWithSpecialChars);
    expect(typst).toContain('Sales & Revenue \\[Q3\\_2026\\] \\#1 (\\$50k\\* Target)');
  });

  it('should render table with repeating table.header and column alignments', () => {
    const typst = generateTypstDocument(baseLayout);
    expect(typst).toContain('#table(');
    expect(typst).toContain('table.header(');
    expect(typst).toContain('Department');
    expect(typst).toContain('Revenue (\\$)');
    expect(typst).toContain('Marketing & Sales');
    expect(typst).toContain('\\$125,000');
  });

  it('should render KPI grid cards correctly', () => {
    const typst = generateTypstDocument(baseLayout);
    expect(typst).toContain('Total Revenue');
    expect(typst).toContain('\\$220,000');
    expect(typst).toContain('+12% YoY');
    expect(typst).toContain('Total Headcount');
    expect(typst).toContain('45');
  });

  it('should render explanatory notes section', () => {
    const typst = generateTypstDocument(baseLayout);
    expect(typst).toContain('Notes & Assumptions');
    expect(typst).toContain('Revenue figures are based on preliminary Q3 un-audited books.');
  });

  it('should support landscape orientation and custom themes', () => {
    const landscapeLayout: LayoutIR = {
      ...baseLayout,
      globalStyles: {
        ...baseLayout.globalStyles,
        orientation: 'landscape',
        pageSize: 'letter',
        theme: 'emerald-report',
      },
    };
    const typst = generateTypstDocument(landscapeLayout, { theme: 'emerald-report' });
    expect(typst).toContain('paper: "us-letter"');
    expect(typst).toContain('flipped: true');
    expect(typst).toContain('#059669'); // Emerald report primary color
  });
});
