import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageSetupControls } from '../../src/components/studio/PageSetupControls';
import { LayoutModeControls } from '../../src/components/studio/LayoutModeControls';
import { DocumentOutline } from '../../src/components/studio/DocumentOutline';
import { Sidebar } from '../../src/components/studio/Sidebar';
import type { StudioOptions } from '../../src/types/studio';
import type { LayoutIR } from '../../src/types/layout-ir';

const mockOptions: StudioOptions = {
  theme: 'modern-clean',
  pageSize: 'a4',
  orientation: 'auto',
  layoutMode: 'auto',
  marginPreset: 'normal',
  fontScale: 8.5,
  customTitle: 'Quarterly Executive Summary',
  repeatTableHeaders: true,
  showPageNumbers: true,
  showSectionSummary: true,
};

const mockLayoutIR: LayoutIR = {
  documentTitle: 'Quarterly Executive Summary',
  pageSize: 'a4',
  orientation: 'portrait',
  totalPagesEstimate: 1,
  sections: [
    {
      id: 'sec-kpi',
      type: 'kpi-grid',
      title: 'Key Financial Metrics',
      startRow: 0,
      endRow: 2,
      rowCount: 3,
      colCount: 4,
      data: [],
    },
    {
      id: 'sec-table',
      type: 'table',
      title: 'Detailed Revenue Breakdown',
      startRow: 3,
      endRow: 15,
      rowCount: 13,
      colCount: 6,
      headers: [{ rowIndex: 3, cells: [] }],
      columns: [],
      rows: [],
    },
  ],
  stats: {
    totalSections: 2,
    totalTables: 1,
    totalKpiGrids: 1,
    totalNotes: 0,
    totalCells: 80,
    analyzedAt: new Date().toISOString(),
  },
};

describe('Sidebar & Layout Mode Controls', () => {
  describe('PageSetupControls', () => {
    it('handles page size, orientation, and margin changes', () => {
      const handleOptionChange = vi.fn();
      render(
        <PageSetupControls
          options={mockOptions}
          onOptionsChange={handleOptionChange}
        />
      );

      const sizeSelect = screen.getByLabelText(/page size/i);
      fireEvent.change(sizeSelect, { target: { value: 'letter' } });
      expect(handleOptionChange).toHaveBeenCalledWith({ pageSize: 'letter' });

      const orientationSelect = screen.getByLabelText(/orientation/i);
      fireEvent.change(orientationSelect, { target: { value: 'landscape' } });
      expect(handleOptionChange).toHaveBeenCalledWith({ orientation: 'landscape' });
    });
  });

  describe('LayoutModeControls', () => {
    it('handles font scale, custom title, and toggle switches', () => {
      const handleOptionChange = vi.fn();
      render(
        <LayoutModeControls
          options={mockOptions}
          onOptionsChange={handleOptionChange}
        />
      );

      const titleInput = screen.getByLabelText(/document title/i);
      fireEvent.change(titleInput, { target: { value: 'New Custom Title' } });
      expect(handleOptionChange).toHaveBeenCalledWith({ customTitle: 'New Custom Title' });

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '9.5' } });
      expect(handleOptionChange).toHaveBeenCalledWith({ fontScale: 9.5 });

      const headerSwitch = screen.getByRole('switch', { name: /repeat table headers/i });
      fireEvent.click(headerSwitch);
      expect(handleOptionChange).toHaveBeenCalledWith({ repeatTableHeaders: false });
    });
  });

  describe('DocumentOutline', () => {
    it('renders section cards and statistics', () => {
      render(<DocumentOutline layoutIR={mockLayoutIR} />);

      expect(screen.getByText('Key Financial Metrics')).toBeDefined();
      expect(screen.getByText('Detailed Revenue Breakdown')).toBeDefined();
      expect(screen.getByText(/2 Sections Detected/i)).toBeDefined();
    });
  });

  describe('Sidebar', () => {
    it('renders tab buttons and switches between Theme, Layout, and Outline views', () => {
      const handleTabChange = vi.fn();
      render(
        <Sidebar
          activeTab="theme"
          onTabChange={handleTabChange}
          options={mockOptions}
          onOptionsChange={vi.fn()}
          layoutIR={mockLayoutIR}
        />
      );

      const layoutTab = screen.getByRole('tab', { name: /layout & setup/i });
      fireEvent.click(layoutTab);
      expect(handleTabChange).toHaveBeenCalledWith('layout');

      const outlineTab = screen.getByRole('tab', { name: /outline/i });
      fireEvent.click(outlineTab);
      expect(handleTabChange).toHaveBeenCalledWith('outline');
    });
  });
});
