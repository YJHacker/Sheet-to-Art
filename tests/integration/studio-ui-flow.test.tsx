// tests/integration/studio-ui-flow.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/App';
import { useStudioStore } from '../../src/store/useStudioStore';
import { THEMES } from '../../src/lib/typst/themes';
import type { ThemeName } from '../../src/types/typst';

describe('Studio UI End-to-End User Flow Integration Suite', { timeout: 60000 }, () => {
  beforeEach(() => {
    useStudioStore.getState().resetStudio();
  });

  it('Journey 1: Sample Load -> Worker Pipeline -> Live PDF Preview', async () => {
    render(<App />);

    // 1. Initial State has Dropzone and Sample buttons
    expect(screen.getByText(/upload your spreadsheet/i)).toBeDefined();
    const salesSampleBtn = screen.getByRole('button', { name: /regional sales performance/i });
    expect(salesSampleBtn).toBeDefined();

    // 2. Click Sample button to trigger end-to-end pipeline
    fireEvent.click(salesSampleBtn);

    // 3. Wait for pipeline to complete and Studio to mount
    await waitFor(
      () => {
        const modernCleanMatches = screen.getAllByText(/Modern Clean/i);
        expect(modernCleanMatches.length).toBeGreaterThanOrEqual(1);
        const exportPdfBtns = screen.getAllByRole('button', { name: /export pdf/i });
        expect(exportPdfBtns.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 25000 }
    );

    // 4. Verify store state is properly populated
    const state = useStudioStore.getState();
    expect(state.cellIR).toBeDefined();
    expect(state.layoutIR).toBeDefined();
    expect(state.pdfResult).toBeDefined();
    expect(state.pdfBlobUrl).toBeDefined();
    expect(state.pdfResult?.pageCount).toBeGreaterThanOrEqual(1);
  });

  it('Journey 2: Theme Switching across all 5 themes updates active theme in store', async () => {
    render(<App />);

    // Load sample
    const sampleBtn = screen.getByRole('button', { name: /financial profit & loss/i });
    fireEvent.click(sampleBtn);

    await waitFor(
      () => {
        const exportPdfBtns = screen.getAllByRole('button', { name: /export pdf/i });
        expect(exportPdfBtns.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 25000 }
    );

    const themeNames: ThemeName[] = [
      'modern-clean',
      'executive-serif',
      'compact-ledger',
      'emerald-report',
      'monochrome-pure',
    ];

    for (const theme of themeNames) {
      const themeDef = THEMES[theme];
      const themeBtns = screen.getAllByRole('button', { name: new RegExp(themeDef.displayName, 'i') });
      fireEvent.click(themeBtns[0]!);

      expect(useStudioStore.getState().options.theme).toBe(theme);
    }
  });

  it('Journey 3: Page Setup & Layout Mode adjustments update store options', async () => {
    render(<App />);

    const sampleBtn = screen.getByRole('button', { name: /financial profit & loss/i });
    fireEvent.click(sampleBtn);

    await waitFor(
      () => {
        const exportPdfBtns = screen.getAllByRole('button', { name: /export pdf/i });
        expect(exportPdfBtns.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 25000 }
    );

    // Switch to Layout Tab in desktop sidebar
    const layoutTab = screen.getByRole('tab', { name: /layout & setup/i });
    fireEvent.click(layoutTab);

    // Change Page Size to US Letter
    const sizeSelects = screen.getAllByLabelText(/page size/i);
    fireEvent.change(sizeSelects[0]!, { target: { value: 'letter' } });
    expect(useStudioStore.getState().options.pageSize).toBe('letter');

    // Change Orientation to Landscape
    const orientationSelects = screen.getAllByLabelText(/orientation/i);
    fireEvent.change(orientationSelects[0]!, { target: { value: 'landscape' } });
    expect(useStudioStore.getState().options.orientation).toBe('landscape');
  });

  it('Journey 4: Export Modal opens and allows downloading PDF with customized name', async () => {
    render(<App />);

    const sampleBtn = screen.getByRole('button', { name: /financial profit & loss/i });
    fireEvent.click(sampleBtn);

    await waitFor(
      () => {
        const exportPdfBtns = screen.getAllByRole('button', { name: /export pdf/i });
        expect(exportPdfBtns.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 25000 }
    );

    const exportBtn = screen.getAllByRole('button', { name: /export pdf/i })[0]!;
    fireEvent.click(exportBtn);

    // Modal should be open
    await waitFor(() => {
      expect(screen.getByText(/Export Publication PDF/i)).toBeDefined();
      expect(screen.getByLabelText(/Filename/i)).toBeDefined();
    });
  });
});
