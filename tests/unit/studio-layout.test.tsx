import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudioLayout } from '../../src/components/layout/StudioLayout';
import App from '../../src/App';
import { useStudioStore } from '../../src/store/useStudioStore';

describe('StudioLayout & App Integration', () => {
  beforeEach(() => {
    useStudioStore.getState().resetStudio();
  });

  describe('StudioLayout', () => {
    it('renders header, sidebar, and preview viewport', () => {
      render(
        <StudioLayout
          fileName="Sales_Report.csv"
          fileSize={1024 * 50}
          onExportClick={vi.fn()}
          onReset={vi.fn()}
        />
      );

      expect(screen.getByText(/Sheet to Art/i)).toBeDefined();
      expect(screen.getByText(/Modern Clean/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /export pdf/i })).toBeDefined();
    });
  });

  describe('App', () => {
    it('initial state displays the Upload Dropzone and sample loaders', () => {
      render(<App />);

      expect(screen.getByText(/upload your spreadsheet/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /financial profit & loss/i })).toBeDefined();
    });

    it('clicking a sample dataset triggers pipeline and enters Studio view', async () => {
      render(<App />);

      const sampleBtn = screen.getByRole('button', { name: /financial profit & loss/i });
      fireEvent.click(sampleBtn);

      // Should show progress or studio view
      await waitFor(
        () => {
          expect(screen.getByText(/Sheet to Art/i)).toBeDefined();
        },
        { timeout: 5000 }
      );
    });
  });
});
