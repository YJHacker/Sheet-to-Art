// tests/integration/mobile-responsive.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudioLayout } from '../../src/components/layout/StudioLayout';
import { ThemeSelector } from '../../src/components/studio/ThemeSelector';
import { useStudioStore } from '../../src/store/useStudioStore';

describe('Mobile Responsiveness & Layout Architecture', () => {
  beforeEach(() => {
    useStudioStore.getState().resetStudio();
  });

  describe('ThemeSelector Variant: Horizontal', () => {
    it('renders 5 launch themes horizontally for mobile carousel', () => {
      const onThemeChange = vi.fn();
      render(
        <ThemeSelector
          activeTheme="modern-clean"
          onThemeChange={onThemeChange}
          variant="horizontal"
        />
      );

      expect(screen.getByText(/Document Themes/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Modern Clean/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Executive Serif/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Emerald Report/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Compact Ledger/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Monochrome Pure/i })).toBeDefined();
    });

    it('clicking a theme in horizontal mode triggers onThemeChange', () => {
      const onThemeChange = vi.fn();
      render(
        <ThemeSelector
          activeTheme="modern-clean"
          onThemeChange={onThemeChange}
          variant="horizontal"
        />
      );

      const emeraldBtn = screen.getByRole('button', { name: /Emerald Report/i });
      fireEvent.click(emeraldBtn);

      expect(onThemeChange).toHaveBeenCalledWith('emerald-report');
    });
  });

  describe('StudioLayout Mobile & Desktop Viewports', () => {
    it('renders mobile layout elements: horizontal theme selector, live preview, and quick download', () => {
      const onExportClick = vi.fn();
      const onReset = vi.fn();

      render(
        <StudioLayout
          fileName="Balance_Sheet.xlsx"
          fileSize={1024 * 100}
          sheetNames={['Assets', 'Liabilities']}
          activeSheetIndex={0}
          onExportClick={onExportClick}
          onReset={onReset}
        />
      );

      // Header Brand
      expect(screen.getByText(/Sheet to Art/i)).toBeDefined();

      // Mobile Accordion Triggers
      expect(screen.getByText(/Page Setup & Layout Options/i)).toBeDefined();
      expect(screen.getByText(/Document Outline & Sections/i)).toBeDefined();
      expect(screen.getByText(/File Metadata & Worksheet/i)).toBeDefined();

      // Mobile Quick Action Bar Buttons
      const exportButtons = screen.getAllByRole('button', { name: /export pdf/i });
      expect(exportButtons.length).toBeGreaterThanOrEqual(1);

      // Expanding an accordion
      const layoutAccordionBtn = screen.getByText(/Page Setup & Layout Options/i);
      fireEvent.click(layoutAccordionBtn);

      expect(screen.getByText(/Page Size/i)).toBeDefined();
      expect(screen.getByText(/Layout Strategy Preset/i)).toBeDefined();
    });
  });
});
