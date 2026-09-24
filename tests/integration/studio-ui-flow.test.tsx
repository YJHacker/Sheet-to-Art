import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/App';
import { useStudioStore } from '../../src/store/useStudioStore';
import { THEMES } from '../../src/lib/typst/themes';
import type { ThemeName } from '../../src/types/typst';

describe('Studio UI End-to-End User Flow Integration Suite', { timeout: 30000 }, () => {
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
        expect(screen.getByText(/Modern Clean/i)).toBeDefined();
        expect(screen.getByRole('button', { name: /export pdf/i })).toBeDefined();
      },
      { timeout: 10000 }
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
        expect(screen.getByRole('button', { name: /export pdf/i })).toBeDefined();
      },
      { timeout: 10000 }
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
      const themeBtn = screen.getByRole('button', { name: new RegExp(themeDef.displayName, 'i') });
      fireEvent.click(themeBtn);

      expect(useStudioStore.getState().options.theme).toBe(theme);
    }
  });

  it('Journey 3: Page Setup & Layout Mode adjustments update store options', async () => {
    render(<App />);

    const sampleBtn = screen.getByRole('button', { name: /financial profit & loss/i });
    fireEvent.click(sampleBtn);

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /export pdf/i })).toBeDefined();
      },
      { timeout: 10000 }
    );

    // Switch to Layout Tab
    const layoutTab = screen.getByRole('tab', { name: /layout & setup/i });
    fireEvent.click(layoutTab);

    // Change Page Size to US Letter
    const sizeSelect = screen.getByLabelText(/page size/i);
    fireEvent.change(sizeSelect, { target: { value: 'letter' } });
    expect(useStudioStore.getState().options.pageSize).toBe('letter');

    // Change Orientation to Landscape
    const orientationSelect = screen.getByLabelText(/orientation/i);
    fireEvent.change(orientationSelect, { target: { value: 'landscape' } });
    expect(useStudioStore.getState().options.orientation).toBe('landscape');

    // Change Font Scale Slider
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '9.0' } });
    expect(useStudioStore.getState().options.fontScale).toBe(9.0);

    // Change Custom Title
    const titleInput = screen.getByLabelText(/document title/i);
    fireEvent.change(titleInput, { target: { value: 'Q3 Board Review' } });
    expect(useStudioStore.getState().options.customTitle).toBe('Q3 Board Review');
  });

  it('Journey 4: Export Modal opens and allows downloading PDF with customized name', async () => {
    render(<App />);

    const sampleBtn = screen.getByRole('button', { name: /financial profit & loss/i });
    fireEvent.click(sampleBtn);

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /export pdf/i })).toBeDefined();
      },
      { timeout: 10000 }
    );

    // Click Export PDF button in header
    const exportBtn = screen.getByRole('button', { name: /export pdf/i });
    fireEvent.click(exportBtn);

    // Modal is opened
    expect(screen.getByText(/export publication pdf/i)).toBeDefined();

    const filenameInput = screen.getByLabelText(/filename/i) as HTMLInputElement;
    fireEvent.change(filenameInput, { target: { value: 'Final_Q3_Report.pdf' } });

    // Click Download PDF
    const downloadBtn = screen.getByRole('button', { name: /download pdf/i });
    fireEvent.click(downloadBtn);

    // Modal closes
    await waitFor(() => {
      expect(screen.queryByText(/export publication pdf/i)).toBeNull();
    });
  });
});
