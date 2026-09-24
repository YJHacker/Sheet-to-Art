import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { readFileSync } from 'fs';
import App from '../../src/App';
import { useStudioStore } from '../../src/store/useStudioStore';

describe('GATE 2027 Studio UI Interactive User Flow', { timeout: 60000 }, () => {
  beforeEach(() => {
    useStudioStore.getState().resetStudio();
  });

  it('End-to-End Journey: Upload GATE2027 XLSX -> Multi-Sheet UI -> Switch Sheet -> Export PDF', async () => {
    const fileBuffer = readFileSync('tests/fixtures/GATE2027_Tracker_AllBranches.xlsx');
    const file = new File([fileBuffer], 'GATE2027_Tracker_AllBranches.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    render(<App />);

    // 1. Dropzone is displayed
    const fileInput = screen.getByTestId('file-input');
    expect(fileInput).toBeDefined();

    // 2. Upload the real GATE 2027 workbook
    fireEvent.change(fileInput, { target: { files: [file] } });

    // 3. Wait for Worker Pipeline to complete and Studio to mount
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /export pdf/i })).toBeDefined();
        expect(screen.getAllByText(/START HERE/i).length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 25000 }
    );

    // 4. Verify all 7 sheet names are populated in the store and rendered in the Sheet selector
    const storeState = useStudioStore.getState();
    expect(storeState.file?.sheetNames).toEqual([
      'START HERE',
      'CS',
      'DA',
      'ECE',
      'EE',
      'ME',
      'CE',
    ]);
    expect(storeState.file?.activeSheetIndex).toBe(0);

    const sheetSelects = screen.getAllByLabelText(/sheet/i);
    expect(sheetSelects.length).toBeGreaterThanOrEqual(1);
    const primarySelect = sheetSelects[0] as HTMLSelectElement;
    expect(primarySelect.options).toHaveLength(7);
    expect(primarySelect.options[0]?.text).toBe('START HERE');
    expect(primarySelect.options[1]?.text).toBe('CS');

    // 5. Switch to CS Sheet (index 1)
    fireEvent.change(primarySelect, { target: { value: '1' } });

    // Wait for the new sheet pipeline execution
    await waitFor(
      () => {
        const state = useStudioStore.getState();
        expect(state.file?.activeSheetIndex).toBe(1);
        expect(state.cellIR?.metadata.sheetName).toBe('CS');
      },
      { timeout: 25000 }
    );

    // Verify CS sheet layout sections
    const csState = useStudioStore.getState();
    expect(csState.layoutIR?.title).toContain('CS');
    expect(csState.layoutIR?.sections.length).toBeGreaterThanOrEqual(10);

    // 6. Test Export Modal
    const exportBtn = screen.getByRole('button', { name: /export pdf/i });
    fireEvent.click(exportBtn);

    expect(screen.getByText(/export publication pdf/i)).toBeDefined();

    const filenameInput = screen.getByLabelText(/filename/i) as HTMLInputElement;
    fireEvent.change(filenameInput, { target: { value: 'GATE2027_CS_Plan.pdf' } });

    const downloadBtn = screen.getByRole('button', { name: /download pdf/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(screen.queryByText(/export publication pdf/i)).toBeNull();
    });
  });
});
