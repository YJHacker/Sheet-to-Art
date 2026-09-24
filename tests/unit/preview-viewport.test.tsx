import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZoomControls } from '../../src/components/preview/ZoomControls';
import { PageNav } from '../../src/components/preview/PageNav';
import { DOMPreviewFallback } from '../../src/components/preview/DOMPreviewFallback';
import { PDFViewer } from '../../src/components/preview/PDFViewer';
import { PreviewViewport } from '../../src/components/preview/PreviewViewport';
import type { LayoutIR } from '../../src/types/layout-ir';

const mockLayoutIR: LayoutIR = {
  documentType: 'report',
  title: 'Annual Executive Summary',
  globalStyles: {
    pageSize: 'a4',
    orientation: 'portrait',
    margins: { top: 15, right: 15, bottom: 15, left: 15 },
    fontFamily: 'Liberation Sans',
    baseFontSize: 8.5,
    theme: 'modern-clean',
  },
  sections: [
    {
      type: 'kpi-grid',
      title: 'Financial Highlights',
      content: {
        columns: 3,
        items: [
          { label: 'Total ARR', value: '$24.5M', change: '+34% YoY' },
          { label: 'Net Retention', value: '118%', change: '+2% YoY' },
          { label: 'Gross Margin', value: '78.5%', change: '+1.5% YoY' },
        ],
      },
    },
    {
      type: 'table',
      title: 'Quarterly Breakdown',
      content: {
        headerStyle: { bold: true, bgColor: '#F1F5F9', textColor: '#0F172A' },
        alternatingRows: true,
        columns: [
          {
            index: 0,
            header: 'Quarter',
            dataType: 'text',
            alignment: 'left',
            minWidth: 60,
            maxWidth: 120,
            suggestedWidth: 100,
            stats: { nullCount: 0, uniqueValues: 4, maxLength: 2 },
          },
          {
            index: 1,
            header: 'Target',
            dataType: 'number',
            alignment: 'right',
            minWidth: 60,
            maxWidth: 120,
            suggestedWidth: 100,
            stats: { nullCount: 0, uniqueValues: 4, maxLength: 6 },
          },
          {
            index: 2,
            header: 'Actual',
            dataType: 'number',
            alignment: 'right',
            minWidth: 60,
            maxWidth: 120,
            suggestedWidth: 100,
            stats: { nullCount: 0, uniqueValues: 4, maxLength: 6 },
          },
        ],
        rows: [
          {
            cells: [
              { value: 'Q1', formattedValue: 'Q1', alignment: 'left' },
              { value: 5000000, formattedValue: '$5.0M', alignment: 'right' },
              { value: 5200000, formattedValue: '$5.2M', alignment: 'right' },
            ],
          },
        ],
      },
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
