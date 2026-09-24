import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../../src/components/studio/Header';
import { Toolbar } from '../../src/components/studio/Toolbar';
import { ExportModal } from '../../src/components/studio/ExportModal';

describe('Header, Toolbar & Export Flow', () => {
  describe('Header', () => {
    it('renders branding, privacy indicator, and export CTA', () => {
      const handleExport = vi.fn();
      const handleReset = vi.fn();

      render(
        <Header
          hasDocument={true}
          fileName="Quarterly_Metrics.xlsx"
          onExportClick={handleExport}
          onReset={handleReset}
        />
      );

      expect(screen.getByText(/Sheet to Art/i)).toBeDefined();
      expect(screen.getByText(/100% In-Browser Private/i)).toBeDefined();

      const exportBtn = screen.getByRole('button', { name: /export pdf/i });
      fireEvent.click(exportBtn);
      expect(handleExport).toHaveBeenCalledTimes(1);
    });
  });

  describe('Toolbar', () => {
    it('handles sidebar toggle and reset triggers', () => {
      const handleToggleSidebar = vi.fn();
      render(
        <Toolbar
          isSidebarOpen={true}
          onToggleSidebar={handleToggleSidebar}
        />
      );

      const toggleBtn = screen.getByRole('button', { name: /toggle sidebar/i });
      fireEvent.click(toggleBtn);
      expect(handleToggleSidebar).toHaveBeenCalledTimes(1);
    });
  });

  describe('ExportModal', () => {
    it('renders modal with filename customization, download action, and print action', () => {
      const handleClose = vi.fn();
      const handleDownload = vi.fn();
      const handlePrint = vi.fn();

      render(
        <ExportModal
          isOpen={true}
          defaultFileName="Financial_Statement.xlsx"
          pageCount={3}
          fileSize={1024 * 180}
          onClose={handleClose}
          onDownload={handleDownload}
          onPrint={handlePrint}
        />
      );

      expect(screen.getByText(/export publication pdf/i)).toBeDefined();
      expect(screen.getByText(/3 Pages/i)).toBeDefined();
      expect(screen.getByText(/180.0 KB/i)).toBeDefined();

      const filenameInput = screen.getByLabelText(/filename/i) as HTMLInputElement;
      expect(filenameInput.value).toBe('Financial_Statement.pdf');

      fireEvent.change(filenameInput, { target: { value: 'Custom_Report_2026.pdf' } });

      const downloadBtn = screen.getByRole('button', { name: /download pdf/i });
      fireEvent.click(downloadBtn);
      expect(handleDownload).toHaveBeenCalledWith('Custom_Report_2026.pdf');

      const printBtn = screen.getByRole('button', { name: /print document/i });
      fireEvent.click(printBtn);
      expect(handlePrint).toHaveBeenCalledTimes(1);

      const closeBtn = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalled();
    });

    it('does not render when isOpen is false', () => {
      render(
        <ExportModal
          isOpen={false}
          defaultFileName="test.xlsx"
          onClose={vi.fn()}
          onDownload={vi.fn()}
          onPrint={vi.fn()}
        />
      );

      expect(screen.queryByText(/export publication pdf/i)).toBeNull();
    });
  });
});
