import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parserWorker, layoutWorker, typstWorker } from '../../src/lib/workers';
import { getPDFPageCount } from '../../src/lib/typst/pdf-assembler';
import type { ThemeName } from '../../src/types/typst';
import type { LayoutIR } from '../../src/types/layout-ir';

describe('End-to-End PDF Generation Flow: Spreadsheet -> CellIR -> LayoutIR -> PDF', () => {
  it('should process simple.csv end-to-end and generate a publication-ready PDF', async () => {
    const filePath = path.resolve(__dirname, '../fixtures/simple.csv');
    const buffer = fs.readFileSync(filePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    // 1. Ingestion: CSV -> CellIR
    const cellIR = await parserWorker.parseFile(arrayBuffer, 'simple.csv');
    expect(cellIR.rows.length).toBeGreaterThanOrEqual(3);

    // 2. Layout Analysis: CellIR -> LayoutIR
    const layoutIR = await layoutWorker.analyzeLayout(cellIR, {
      pageSize: 'a4',
      orientation: 'portrait',
      theme: 'modern-clean',
    });
    expect(layoutIR.sections.length).toBeGreaterThanOrEqual(1);

    // 3. Typesetting & PDF Generation: LayoutIR -> PDF
    const result = await typstWorker.renderLayoutToPDF(layoutIR);
    expect(result.pdfBuffer).toBeInstanceOf(Uint8Array);
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
    expect(result.typstSource).toContain('Alice');

    const magic = String.fromCharCode(...result.pdfBuffer.slice(0, 5));
    expect(magic).toBe('%PDF-');

    const pageCount = await getPDFPageCount(result.pdfBuffer);
    expect(pageCount).toBe(result.pageCount);
  }, 45000);

  it('should process styles.xlsx and simple-table.xlsx across all 5 themes', async () => {
    const filePath = path.resolve(__dirname, '../fixtures/styles.xlsx');
    const buffer = fs.readFileSync(filePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const cellIR = await parserWorker.parseFile(arrayBuffer, 'styles.xlsx');
    const layoutIR = await layoutWorker.analyzeLayout(cellIR, {
      pageSize: 'a4',
      orientation: 'portrait',
    });

    expect(layoutIR.sections.length).toBeGreaterThanOrEqual(1);

    const themes: ThemeName[] = [
      'modern-clean',
      'executive-serif',
      'compact-ledger',
      'emerald-report',
      'monochrome-pure',
    ];

    for (const theme of themes) {
      const renderResult = await typstWorker.renderLayoutToPDF(layoutIR, { theme });
      expect(renderResult.pdfBuffer).toBeInstanceOf(Uint8Array);
      expect(renderResult.pdfBuffer.length).toBeGreaterThan(100);

      const magic = String.fromCharCode(...renderResult.pdfBuffer.slice(0, 5));
      expect(magic).toBe('%PDF-');
      expect(renderResult.pageCount).toBeGreaterThanOrEqual(1);
    }
  }, 60000);

  it('should optimize and render wide spreadsheet tables in landscape orientation', async () => {
    const wideCsvContent = `ID,Employee,Role,Department,Level,Base Salary,Bonus,Equity,Health,401k,Start Date,Status,Location,Manager,Notes
101,Alice Johnson,Lead Architect,Core Engine,L6,$185000,$25000,$50000,Standard,Matching,2021-03-15,Active,San Francisco,Director Smith,Senior technical lead
102,Bob Smith,Staff Engineer,Platform Infra,L5,$160000,$18000,$35000,Premium,Matching,2022-06-01,Active,New York,Director Smith,Kubernetes specialist
103,Carol White,Senior Designer,Design Systems,L4,$135000,$12000,$20000,Standard,Matching,2023-01-10,Active,Austin,VP Design,Figma and Typst expert`;

    const csvBuffer = new TextEncoder().encode(wideCsvContent).buffer;
    const cellIR = await parserWorker.parseFile(csvBuffer, 'staff_directory.csv');
    const layoutIR = await layoutWorker.analyzeLayout(cellIR, {
      pageSize: 'a4',
      orientation: 'auto', // Auto should detect wide columns and optimize to landscape
    });

    expect(layoutIR.globalStyles.orientation).toBe('landscape');

    const result = await typstWorker.renderLayoutToPDF(layoutIR);
    expect(result.pdfBuffer).toBeInstanceOf(Uint8Array);
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
    expect(result.typstSource).toContain('flipped: true');

    const magic = String.fromCharCode(...result.pdfBuffer.slice(0, 5));
    expect(magic).toBe('%PDF-');
  }, 45000);

  it('should render a complete multi-section LayoutIR (KPI grid, table, notes) to PDF', async () => {
    const multiSectionLayout: LayoutIR = {
      documentType: 'report',
      title: 'Quarterly Executive Dashboard',
      sections: [
        {
          type: 'kpi-grid',
          title: 'High-Level Metrics',
          content: {
            items: [
              { label: 'Total Revenue', value: '$1,250,000', change: '+18.5% YoY' },
              { label: 'Operating Margin', value: '28.4%', change: '+3.2%' },
              { label: 'Active Customers', value: '4,820', change: '+120 new' },
            ],
            columns: 3,
          },
        },
        {
          type: 'table',
          title: 'Regional Breakdown',
          content: {
            columns: [
              {
                index: 0,
                header: 'Region',
                dataType: 'text',
                alignment: 'left',
                minWidth: 60,
                maxWidth: 150,
                suggestedWidth: 120,
                stats: { nullCount: 0, uniqueValues: 3, maxLength: 13 },
              },
              {
                index: 1,
                header: 'Revenue ($)',
                dataType: 'number',
                alignment: 'right',
                numberFormat: 'currency',
                minWidth: 50,
                maxWidth: 120,
                suggestedWidth: 90,
                stats: { nullCount: 0, uniqueValues: 3, maxLength: 10 },
              },
              {
                index: 2,
                header: 'Growth',
                dataType: 'number',
                alignment: 'right',
                numberFormat: 'percentage',
                minWidth: 40,
                maxWidth: 80,
                suggestedWidth: 70,
                stats: { nullCount: 0, uniqueValues: 3, maxLength: 6 },
              },
            ],
            rows: [
              {
                cells: [
                  { value: 'North America', formattedValue: 'North America', alignment: 'left' },
                  { value: 650000, formattedValue: '$650,000', alignment: 'right' },
                  { value: '22.4%', formattedValue: '22.4%', alignment: 'right' },
                ],
              },
              {
                cells: [
                  { value: 'Europe & UK', formattedValue: 'Europe & UK', alignment: 'left' },
                  { value: 420000, formattedValue: '$420,000', alignment: 'right' },
                  { value: '14.1%', formattedValue: '14.1%', alignment: 'right' },
                ],
              },
              {
                cells: [
                  { value: 'Asia Pacific', formattedValue: 'Asia Pacific', alignment: 'left' },
                  { value: 180000, formattedValue: '$180,000', alignment: 'right' },
                  { value: '18.9%', formattedValue: '18.9%', alignment: 'right' },
                ],
              },
            ],
            headerStyle: { bold: true, bgColor: '#F1F5F9', textColor: '#0F172A' },
            alternatingRows: true,
          },
        },
        {
          type: 'text',
          title: 'Notes & Accounting Methodology',
          content: {
            paragraphs: [
              '1. Financial figures are reported in USD and conform to standard GAAP guidelines.',
              '2. Regional figures reflect preliminary un-audited end-of-quarter entries.',
            ],
          },
        },
      ],
      globalStyles: {
        pageSize: 'a4',
        orientation: 'portrait',
        margins: { top: 15, right: 15, bottom: 15, left: 15 },
        fontFamily: 'Liberation Sans',
        baseFontSize: 8.5,
        theme: 'modern-clean',
      },
    };

    const result = await typstWorker.renderLayoutToPDF(multiSectionLayout);
    expect(result.pdfBuffer).toBeInstanceOf(Uint8Array);
    expect(result.pageCount).toBeGreaterThanOrEqual(1);

    const magic = String.fromCharCode(...result.pdfBuffer.slice(0, 5));
    expect(magic).toBe('%PDF-');
    expect(result.typstSource).toContain('Quarterly Executive Dashboard');
    expect(result.typstSource).toContain('High-Level Metrics');
    expect(result.typstSource).toContain('Regional Breakdown');
    expect(result.typstSource).toContain('Notes & Accounting Methodology');
  }, 45000);
});
