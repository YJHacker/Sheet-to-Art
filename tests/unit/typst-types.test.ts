import { describe, it, expect } from 'vitest';
import type {
  ThemeName,
  ThemeDefinition,
  TypstGeneratorOptions,
  PDFRenderResult,
  TypstWorkerAPI,
} from '../../src/types/typst';

describe('Typst Type Definitions', () => {
  it('should support valid ThemeName values', () => {
    const validThemes: ThemeName[] = [
      'modern-clean',
      'executive-serif',
      'compact-ledger',
      'emerald-report',
      'monochrome-pure',
    ];
    expect(validThemes).toHaveLength(5);
  });

  it('should allow constructing a valid ThemeDefinition object', () => {
    const theme: ThemeDefinition = {
      name: 'modern-clean',
      displayName: 'Modern Clean',
      fontFamily: 'Inter',
      primaryColor: '#2563EB',
      secondaryColor: '#64748B',
      accentColor: '#3B82F6',
      headerBackground: '#F1F5F9',
      headerTextColor: '#0F172A',
      zebraBackground: '#F8FAFC',
      borderColor: '#E2E8F0',
      textColor: '#334155',
      kpiBackground: '#F8FAFC',
      kpiBorderColor: '#CBD5E1',
      kpiAccentColor: '#2563EB',
      noteBackground: '#FEF3C7',
      noteBorderColor: '#F59E0B',
      tableStroke: '0.5pt + rgb("e2e8f0")',
      margins: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
      cellPadding: { x: '4pt', y: '3pt' },
      baseFontSize: 9,
    };
    expect(theme.name).toBe('modern-clean');
    expect(theme.margins.top).toBe('15mm');
  });

  it('should allow constructing valid TypstGeneratorOptions and PDFRenderResult', () => {
    const options: TypstGeneratorOptions = {
      theme: 'modern-clean',
      pageSize: 'a4',
      orientation: 'portrait',
      showPageNumbers: true,
      repeatTableHeaders: true,
    };
    expect(options.theme).toBe('modern-clean');

    const result: PDFRenderResult = {
      pdfBuffer: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
      pageCount: 1,
      typstSource: '#set page(paper: "a4")',
    };
    expect(result.pageCount).toBe(1);
    expect(result.pdfBuffer[0]).toBe(0x25);

    const mockWorkerAPI: Partial<TypstWorkerAPI> = {
      compileToPDF: async () => result.pdfBuffer,
    };
    expect(mockWorkerAPI.compileToPDF).toBeDefined();
  });
});
