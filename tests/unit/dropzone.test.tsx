import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dropzone } from '../../src/components/upload/Dropzone';
import { FileInfoCard } from '../../src/components/upload/FileInfoCard';
import { useStudioStore } from '../../src/store/useStudioStore';

describe('Dropzone & File Upload Components', () => {
  beforeEach(() => {
    useStudioStore.getState().resetStudio();
  });

  describe('Dropzone', () => {
    it('renders upload instructions, format badges, and privacy notice', () => {
      render(<Dropzone onFileSelected={vi.fn()} onSampleSelected={vi.fn()} />);

      expect(screen.getByText(/upload your spreadsheet/i)).toBeDefined();
      expect(screen.getAllByText(/XLSX/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/CSV/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/100% In-Browser Private/i)).toBeDefined();
    });

    it('triggers onFileSelected when a valid .xlsx or .csv is dropped or selected', () => {
      const handleFileSelected = vi.fn();
      render(<Dropzone onFileSelected={handleFileSelected} onSampleSelected={vi.fn()} />);

      const file = new File(['test,csv,data'], 'sales.csv', { type: 'text/csv' });
      const input = screen.getByTestId('file-input') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });
      expect(handleFileSelected).toHaveBeenCalledWith(file);
    });

    it('rejects invalid file formats with error callback or message', () => {
      const handleFileSelected = vi.fn();
      const handleError = vi.fn();
      render(
        <Dropzone
          onFileSelected={handleFileSelected}
          onSampleSelected={vi.fn()}
          onError={handleError}
        />
      );

      const invalidFile = new File(['binary'], 'image.png', { type: 'image/png' });
      const input = screen.getByTestId('file-input') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [invalidFile] } });
      expect(handleFileSelected).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(expect.stringContaining('Unsupported file format'));
    });

    it('renders sample dataset buttons and triggers onSampleSelected', () => {
      const handleSampleSelected = vi.fn();
      render(<Dropzone onFileSelected={vi.fn()} onSampleSelected={handleSampleSelected} />);

      const financialBtn = screen.getByRole('button', { name: /financial profit & loss/i });
      expect(financialBtn).toBeDefined();

      fireEvent.click(financialBtn);
      expect(handleSampleSelected).toHaveBeenCalledWith('financial-statement');
    });
  });

  describe('FileInfoCard', () => {
    it('displays file metadata, sheet selector, and reset action', () => {
      const handleSheetChange = vi.fn();
      const handleReset = vi.fn();

      render(
        <FileInfoCard
          fileName="Quarterly_Report_2026.xlsx"
          fileSize={1024 * 45}
          sheetNames={['Summary', 'Q1 Details', 'Q2 Details']}
          activeSheetIndex={0}
          onSheetChange={handleSheetChange}
          onReset={handleReset}
        />
      );

      expect(screen.getByText('Quarterly_Report_2026.xlsx')).toBeDefined();
      expect(screen.getByText('45.0 KB')).toBeDefined();
      expect(screen.getByText('XLSX')).toBeDefined();

      const select = screen.getByLabelText(/sheet/i) as HTMLSelectElement;
      expect(select.value).toBe('0');

      fireEvent.change(select, { target: { value: '1' } });
      expect(handleSheetChange).toHaveBeenCalledWith(1);

      const changeBtn = screen.getByRole('button', { name: /change file/i });
      fireEvent.click(changeBtn);
      expect(handleReset).toHaveBeenCalledTimes(1);
    });
  });
});
