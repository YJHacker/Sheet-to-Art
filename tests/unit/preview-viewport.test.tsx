import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZoomControls } from '../../src/components/preview/ZoomControls';
import { PageNav } from '../../src/components/preview/PageNav';
import { DOMPreviewFallback } from '../../src/components/preview/DOMPreviewFallback';
import { PDFViewer } from '../../src/components/preview/PDFViewer';
import { PreviewViewport } from '../../src/components/preview/PreviewViewport';
import type { LayoutIR } from '../../src/types/layout-ir';

const mockLayoutIR: LayoutIR = {
  documentTitle: 'Annual Executive Summary',
  pageSize: 'a4',
  orientation: 'portrait',
  totalPagesEstimate: 2,
  sections: [
    {
      id: 'sec-kpi',
      type: 'kpi-grid',
      title: 'Financial Highlights',
      startRow: 0,
      endRow: 1,
      rowCount: 2,
      colCount: 3,
      data: [
        [
          { rawValue: 'Total ARR', formattedValue: 'Total ARR', dataType: 'string', row: 0, col: 0 },
          { rawValue: '$24.5M', formattedValue: '$24.5M', dataType: 'currency', row: 0, col: 1 },
          { rawValue: '+34% YoY', formattedValue: '+34% YoY', dataType: 'percentage', row: 0, col: 2 },
        ],
      ],
    },
    {
      id: 'sec-table',
      type: 'table',
      title: 'Quarterly Breakdown',
      startRow: 2,
      endRow: 6,
      rowCount: 5,
      colCount: 3,
      headers: [
        {
          rowIndex: 2,
          cells: [
            { rawValue: 'Quarter', formattedValue: 'Quarter', dataType: 'string', row: 2, col: 0 },
            { rawValue: 'Target', formattedValue: 'Target', dataType: 'string', row: 2, col: 1 },
            { rawValue: 'Actual', formattedValue: 'Actual', dataType: 'string', row: 2, col: 2 },
          ],
        },
      ],
      columns: [
        { index: 0, headerName: 'Quarter', inferredType: 'string', widthPt: 100, minWidthPt: 60, isNumeric: false, alignment: 'left' },
        { index: 1, headerName: 'Target', inferredType: 'currency', widthPt: 100, minWidthPt: 60, isNumeric: true, alignment: 'right' },
        { index: 2, headerName: 'Actual', inferredType: 'currency', widthPt: 100, minWidthPt: 60, isNumeric: true, alignment: 'right' },
      ],
      rows: [
        {
          rowIndex: 3,
          cells: [
            { rawValue: 'Q1', formattedValue: 'Q1', dataType: 'string', row: 3, col: 0 },
            { rawValue: '$5.0M', formattedValue: '$5.0M', dataType: 'currency', row: 3, col: 1 },
            { rawValue: '$5.2M', formattedValue: '$5.2M', dataType: 'currency', row: 3, col: 2 },
          ],
        },
      ],
    },
  ],
};

describe('Preview Viewport, Zoom & Navigation', () => {
  describe('ZoomControls', () => {
    it('handles Zoom In, Zoom Out, and Preset buttons', () => {
      const handleZoomChange = vi.fn();
      render(
        <ZoomControls
          zoom={100}
          onZoomChange={handleZoomChange}
        />
      );

      const zoomInBtn = screen.getByRole('button', { name: /zoom in/i });
      fireEvent.click(zoomInBtn);
      expect(handleZoomChange).toHaveBeenCalledWith(110);

      const zoomOutBtn = screen.getByRole('button', { name: /zoom out/i });
      fireEvent.click(zoomOutBtn);
      expect(handleZoomChange).toHaveBeenCalledWith(90);

      const fitWidthBtn = screen.getByRole('button', { name: /fit width/i });
      fireEvent.click(fitWidthBtn);
      expect(handleZoomChange).toHaveBeenCalledWith(100);
    });
  });

  describe('PageNav', () => {
    it('navigates between pages and disables invalid directions', () => {
      const handlePageChange = vi.fn();
      const { rerender } = render(
        <PageNav
          currentPage={1}
          totalPages={3}
          onPageChange={handlePageChange}
        />
      );

      expect(screen.getByText('Page 1 of 3')).toBeDefined();
      const prevBtn = screen.getByRole('button', { name: /previous page/i });
      expect(prevBtn).toHaveProperty('disabled', true);

      const nextBtn = screen.getByRole('button', { name: /next page/i });
      expect(nextBtn).toHaveProperty('disabled', false);

      fireEvent.click(nextBtn);
      expect(handlePageChange).toHaveBeenCalledWith(2);

      rerender(
        <PageNav
          currentPage={3}
          totalPages={3}
          onPageChange={handlePageChange}
        />
      );

      const nextBtnLast = screen.getByRole('button', { name: /next page/i });
      expect(nextBtnLast).toHaveProperty('disabled', true);
    });
  });

  describe('DOMPreviewFallback', () => {
    it('renders structured tables and KPI metrics from LayoutIR', () => {
      render(<DOMPreviewFallback layoutIR={mockLayoutIR} />);

      expect(screen.getByText('Financial Highlights')).toBeDefined();
      expect(screen.getByText('Total ARR')).toBeDefined();
      expect(screen.getByText('Quarterly Breakdown')).toBeDefined();
      expect(screen.getByText('Quarter')).toBeDefined();
      expect(screen.getByText('Q1')).toBeDefined();
    });
  });

  describe('PDFViewer', () => {
    it('renders iframe with PDF blob URL', () => {
      render(<PDFViewer pdfBlobUrl="blob:http://localhost/test-pdf" />);

      const iframe = screen.getByTitle(/pdf preview/i) as HTMLIFrameElement;
      expect(iframe).toBeDefined();
      expect(iframe.src).toContain('blob:http://localhost/test-pdf');
    });
  });

  describe('PreviewViewport', () => {
    it('renders canvas with correct zoom scale and preview mode', () => {
      render(
        <PreviewViewport
          layoutIR={mockLayoutIR}
          pdfBlobUrl="blob:http://localhost/test-pdf"
          previewMode="pdf"
          zoom={120}
          currentPage={1}
          totalPages={2}
          onZoomChange={vi.fn()}
          onPageChange={vi.fn()}
          onPreviewModeChange={vi.fn()}
        />
      );

      expect(screen.getByTitle(/pdf preview/i)).toBeDefined();
    });
  });
});
