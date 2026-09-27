import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { render, screen, fireEvent } from '@testing-library/react';
import { parseXLSX, getWorkbookInfoXLSX } from '../../src/workers/xlsx-parser';
import { analyzeCellIR } from '../../src/lib/layout/layout-engine';
import { generateTypstDocument } from '../../src/lib/typst/typst-generator';
import { compileLayoutToPDF } from '../../src/lib/typst/typst-compiler';
import { DocumentPreview } from '../../src/components/preview/DocumentPreview';
import { Header } from '../../src/components/studio/Header';

describe('Product Core Acceptance & UI/PDF Experience Suite', { timeout: 120000 }, () => {
  const filePath = 'tests/fixtures/GATE2027_Tracker_AllBranches.xlsx';
  const fileBuffer = readFileSync(filePath);
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength
  );

  it('1. Discover and parse all 7 worksheets from real GATE2027 workbook', async () => {
    const info = await getWorkbookInfoXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx');
    expect(info.sheetNames).toEqual(['START HERE', 'CS', 'DA', 'ECE', 'EE', 'ME', 'CE']);
    expect(info.sheets).toHaveLength(7);
  });

  it('2. Document Preview renders real structured data in a clean document format with themes', async () => {
    const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', 1); // CS sheet
    const layout = analyzeCellIR(cellIR, { theme: 'emerald-report', pageSize: 'a4', orientation: 'landscape' });

    const { container } = render(<DocumentPreview layoutIR={layout} />);

    // Document Title
    expect(screen.getByText(/GATE 2027 · CS/i)).toBeDefined();

    // KPI section
    expect(screen.getByText(/MY TARGET SCORE:/i)).toBeDefined();
    expect(screen.getByText(/MY DAILY STUDY HOURS:/i)).toBeDefined();

    // Table section headers
    expect(screen.getByText(/1 · MARKS MAP/i)).toBeDefined();
    expect(screen.getAllByText(/Subject/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Approx\. marks/i)).toBeDefined();

    // Data in tables
    expect(screen.getAllByText(/Engineering Mathematics/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/General Aptitude/i).length).toBeGreaterThan(0);

    // Check table elements
    const tables = container.querySelectorAll('table');
    expect(tables.length).toBeGreaterThanOrEqual(8);
  });

  it('3. Header renders interactive worksheet tab bar for multi-sheet workbooks', () => {
    const handleSheetChange = vi.fn();
    const handleExport = vi.fn();
    const handleDirectDownload = vi.fn();

    render(
      <Header
        hasDocument={true}
        fileName="GATE2027_Tracker_AllBranches.xlsx"
        sheetNames={['START HERE', 'CS', 'DA', 'ECE', 'EE', 'ME', 'CE']}
        activeSheetIndex={1}
        onSheetChange={handleSheetChange}
        onExportClick={handleExport}
        onDirectDownload={handleDirectDownload}
      />
    );

    // Verify all 7 sheet tabs are rendered
    expect(screen.getByRole('button', { name: 'START HERE' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'CS' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'DA' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'ECE' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'EE' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'ME' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'CE' })).toBeDefined();

    // Click DA sheet tab
    fireEvent.click(screen.getByRole('button', { name: 'DA' }));
    expect(handleSheetChange).toHaveBeenCalledWith(2);

    // Direct download button works
    const downloadBtn = screen.getByRole('button', { name: /direct download/i });
    fireEvent.click(downloadBtn);
    expect(handleDirectDownload).toHaveBeenCalledTimes(1);

    // Export PDF button works
    const exportBtn = screen.getByRole('button', { name: /export pdf/i });
    fireEvent.click(exportBtn);
    expect(handleExport).toHaveBeenCalledTimes(1);
  });

  it('4. Real Workbook End-to-End Across All 7 Sheets: Typst WASM and PDF Generation', async () => {
    const sheetIndices = [0, 1, 2, 3, 4, 5, 6];

    for (const idx of sheetIndices) {
      const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', idx);
      const layout = analyzeCellIR(cellIR, { pageSize: 'a4', orientation: 'auto', theme: 'modern-clean' });
      const typstSource = generateTypstDocument(layout, { theme: 'modern-clean' });
      const pdfResult = await compileLayoutToPDF(layout, { theme: 'modern-clean' });

      expect(pdfResult.pdfBuffer).toBeInstanceOf(Uint8Array);
      expect(pdfResult.pdfBuffer.length).toBeGreaterThan(50000);
      expect(pdfResult.pageCount).toBeGreaterThanOrEqual(2);
      expect(typstSource).toContain('#set page(');
    }
  });
});
