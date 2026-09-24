import { describe, it, expect, beforeEach } from 'vitest';
import { useStudioStore } from '../../src/store/useStudioStore';
import type { LayoutIR } from '../../src/types/layout-ir';
import type { CellIR } from '../../src/types/cell-ir';
import type { PDFRenderResult } from '../../src/types/typst';

describe('useStudioStore - Central State Management', () => {
  beforeEach(() => {
    useStudioStore.getState().resetStudio();
  });

  it('should initialize with default idle state and sensible studio options', () => {
    const state = useStudioStore.getState();
    expect(state.pipeline.stage).toBe('idle');
    expect(state.pipeline.percent).toBe(0);
    expect(state.file).toBeNull();
    expect(state.cellIR).toBeNull();
    expect(state.layoutIR).toBeNull();
    expect(state.pdfResult).toBeNull();
    expect(state.pdfBlobUrl).toBeNull();

    // Studio Options defaults
    expect(state.options.theme).toBe('modern-clean');
    expect(state.options.pageSize).toBe('a4');
    expect(state.options.orientation).toBe('portrait');
    expect(state.options.layoutMode).toBe('auto');
    expect(state.options.marginPreset).toBe('normal');
    expect(state.options.fontScale).toBe(8.5);
    expect(state.options.repeatTableHeaders).toBe(true);
    expect(state.options.showPageNumbers).toBe(true);

    // View State defaults
    expect(state.view.zoom).toBe(100);
    expect(state.view.currentPage).toBe(1);
    expect(state.view.totalPages).toBe(1);
    expect(state.view.previewMode).toBe('pdf');
    expect(state.view.isSidebarOpen).toBe(true);
    expect(state.view.activeSidebarTab).toBe('theme');
  });

  it('should update file and pipeline progress', () => {
    const store = useStudioStore.getState();
    store.setFile({
      name: 'financials.xlsx',
      size: 10240,
      buffer: new ArrayBuffer(8),
      sheetNames: ['Q1', 'Q2'],
      activeSheetIndex: 0,
    });

    store.setPipelineProgress({
      stage: 'parsing',
      percent: 25,
      message: 'Reading spreadsheet cells...',
      error: null,
    });

    const state = useStudioStore.getState();
    expect(state.file?.name).toBe('financials.xlsx');
    expect(state.file?.sheetNames).toEqual(['Q1', 'Q2']);
    expect(state.pipeline.stage).toBe('parsing');
    expect(state.pipeline.percent).toBe(25);
    expect(state.pipeline.message).toBe('Reading spreadsheet cells...');
  });

  it('should update document data and totalPages', () => {
    const store = useStudioStore.getState();
    const mockCellIR = {
      matrix: [],
      properties: {},
      merges: [],
      metadata: { totalRows: 10, totalCols: 4, fileName: 'data.csv', sheetName: 'Sheet1' },
    } as CellIR;

    const mockLayoutIR = {
      sections: [],
      globalStyles: {} as any,
      metadata: { totalRows: 10, totalCols: 4, documentType: 'table', title: 'Data' },
      pageSize: 'a4',
      orientation: 'portrait',
    } as LayoutIR;

    const mockPdfResult: PDFRenderResult = {
      pdfBuffer: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
      pageCount: 3,
      typstSource: '#set page(paper: "a4")',
    };

    store.setDocumentData({
      cellIR: mockCellIR,
      layoutIR: mockLayoutIR,
      pdfResult: mockPdfResult,
      pdfBlobUrl: 'blob:http://localhost/test-pdf-123',
    });

    const state = useStudioStore.getState();
    expect(state.cellIR).toBe(mockCellIR);
    expect(state.layoutIR).toBe(mockLayoutIR);
    expect(state.pdfResult).toBe(mockPdfResult);
    expect(state.pdfBlobUrl).toBe('blob:http://localhost/test-pdf-123');
    expect(state.view.totalPages).toBe(3);
    expect(state.pipeline.stage).toBe('ready');
    expect(state.pipeline.percent).toBe(100);
  });

  it('should update options and clamp zoom levels', () => {
    const store = useStudioStore.getState();
    store.setOptions({
      theme: 'emerald-report',
      pageSize: 'letter',
      layoutMode: 'compact',
      fontScale: 7.5,
    });

    let state = useStudioStore.getState();
    expect(state.options.theme).toBe('emerald-report');
    expect(state.options.pageSize).toBe('letter');
    expect(state.options.layoutMode).toBe('compact');
    expect(state.options.fontScale).toBe(7.5);

    // Zoom clamping (25% to 200%)
    store.setZoom(250);
    state = useStudioStore.getState();
    expect(state.view.zoom).toBe(200);

    store.setZoom(10);
    state = useStudioStore.getState();
    expect(state.view.zoom).toBe(25);

    store.setZoom(125);
    state = useStudioStore.getState();
    expect(state.view.zoom).toBe(125);
  });

  it('should clamp current page within 1 and totalPages', () => {
    const store = useStudioStore.getState();
    store.setDocumentData({
      cellIR: null,
      layoutIR: null,
      pdfResult: { pdfBuffer: new Uint8Array(), pageCount: 5, typstSource: '' },
      pdfBlobUrl: 'blob:test',
    });

    store.setCurrentPage(3);
    expect(useStudioStore.getState().view.currentPage).toBe(3);

    store.setCurrentPage(10); // over total
    expect(useStudioStore.getState().view.currentPage).toBe(5);

    store.setCurrentPage(-2); // under 1
    expect(useStudioStore.getState().view.currentPage).toBe(1);
  });

  it('should toggle sidebar and switch tabs', () => {
    const store = useStudioStore.getState();
    expect(store.view.isSidebarOpen).toBe(true);

    store.toggleSidebar();
    expect(useStudioStore.getState().view.isSidebarOpen).toBe(false);

    store.toggleSidebar();
    expect(useStudioStore.getState().view.isSidebarOpen).toBe(true);

    store.setActiveSidebarTab('layout');
    expect(useStudioStore.getState().view.activeSidebarTab).toBe('layout');
  });

  it('should reset studio completely on resetStudio()', () => {
    const store = useStudioStore.getState();
    store.setFile({ name: 'test.csv', size: 100, buffer: new ArrayBuffer(0), sheetNames: ['Sheet1'], activeSheetIndex: 0 });
    store.setOptions({ theme: 'monochrome-pure' });
    store.setZoom(150);

    store.resetStudio();
    const state = useStudioStore.getState();
    expect(state.file).toBeNull();
    expect(state.options.theme).toBe('modern-clean');
    expect(state.view.zoom).toBe(100);
    expect(state.pipeline.stage).toBe('idle');
  });
});
