import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  executeDocumentPipeline,
  recompilePDF,
  mapStudioOptionsToTypstOptions,
  mapStudioOptionsToLayoutOptions,
} from '../../src/lib/pipeline/document-pipeline';
import { formatFileSize, sanitizeFileName } from '../../src/lib/utils/formatters';
import type { StudioOptions, PipelineProgress } from '../../src/types/studio';
import { getSampleSpreadsheet } from '../../src/lib/utils/sample-data';

const defaultOptions: StudioOptions = {
  theme: 'modern-clean',
  pageSize: 'a4',
  orientation: 'auto',
  layoutMode: 'auto',
  marginPreset: 'normal',
  fontScale: 8.5,
  customTitle: '',
  repeatTableHeaders: true,
  showPageNumbers: true,
  showSectionSummary: false,
};

describe('Formatters Utility', () => {
  it('formatFileSize correctly formats bytes into B, KB, MB', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
  });

  it('sanitizeFileName guarantees safe filenames with .pdf extension', () => {
    expect(sanitizeFileName('My Financial Report.xlsx')).toBe('My Financial Report.pdf');
    expect(sanitizeFileName('report/invalid\\chars:*.csv')).toBe('report_invalid_chars__.pdf');
    expect(sanitizeFileName('already-pdf.pdf')).toBe('already-pdf.pdf');
    expect(sanitizeFileName('')).toBe('document.pdf');
  });
});

describe('Document Pipeline Orchestrator', () => {
  it('mapStudioOptionsToTypstOptions maps StudioOptions to TypstGeneratorOptions', () => {
    const typstOpts = mapStudioOptionsToTypstOptions({
      ...defaultOptions,
      theme: 'emerald-report',
      fontScale: 9.0,
      customTitle: 'Custom Report Title',
    });

    expect(typstOpts.theme).toBe('emerald-report');
    expect(typstOpts.customTitle).toBe('Custom Report Title');
    expect(typstOpts.baseFontSize).toBe(9.0);
    expect(typstOpts.repeatHeader).toBe(true);
  });

  it('mapStudioOptionsToLayoutOptions maps StudioOptions to LayoutOptions', () => {
    const layoutOpts = mapStudioOptionsToLayoutOptions({
      ...defaultOptions,
      pageSize: 'letter',
      orientation: 'landscape',
    });

    expect(layoutOpts.pageSize).toBe('letter');
    expect(layoutOpts.orientation).toBe('landscape');
  });

  it('executeDocumentPipeline runs end-to-end with progress reporting', async () => {
    const sample = getSampleSpreadsheet('financial-statement');
    const progressUpdates: PipelineProgress[] = [];

    const result = await executeDocumentPipeline(
      sample.buffer,
      sample.name,
      0,
      defaultOptions,
      (p) => progressUpdates.push({ ...p })
    );

    expect(result.cellIR).toBeDefined();
    expect(result.layoutIR).toBeDefined();
    expect(result.pdfResult).toBeDefined();
    expect(result.pdfResult.pdfBuffer).toBeInstanceOf(Uint8Array);
    expect(result.pdfResult.pageCount).toBeGreaterThanOrEqual(1);
    expect(result.pdfBlobUrl).toBeDefined();

    // Verify progress progression
    expect(progressUpdates.length).toBeGreaterThanOrEqual(3);
    const stages = progressUpdates.map((u) => u.stage);
    expect(stages).toContain('parsing');
    expect(stages).toContain('layout');
    expect(stages).toContain('compiling');
    expect(stages).toContain('ready');
  });

  it('recompilePDF re-compiles layout with new options quickly without re-parsing', async () => {
    const sample = getSampleSpreadsheet('sales-report');
    const initial = await executeDocumentPipeline(
      sample.buffer,
      sample.name,
      0,
      defaultOptions
    );

    const recompiled = await recompilePDF(initial.layoutIR, {
      ...defaultOptions,
      theme: 'executive-serif',
      customTitle: 'Updated Sales Summary',
    });

    expect(recompiled.pdfResult).toBeDefined();
    expect(recompiled.pdfResult.pdfBuffer).toBeInstanceOf(Uint8Array);
    expect(recompiled.pdfBlobUrl).toBeDefined();
  });
});
