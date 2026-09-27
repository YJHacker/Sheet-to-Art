// tests/integration/persistence-flow.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../src/App';
import { useStudioStore } from '../../src/store/useStudioStore';
import { saveSession } from '../../src/lib/storage/persistence';
import { getSampleSpreadsheet } from '../../src/lib/utils/sample-data';

describe('App Workbook Persistence & Auto-Restore Flow', { timeout: 30000 }, () => {
  let mockStore: Record<string, any> = {};

  beforeEach(() => {
    useStudioStore.getState().resetStudio();
    mockStore = {};

    const mockIDB = {
      open: vi.fn(() => {
        const req: any = {
          result: {
            objectStoreNames: {
              contains: vi.fn(() => true),
            },
            createObjectStore: vi.fn(),
            transaction: vi.fn(() => {
              const tx: any = {
                objectStore: vi.fn(() => ({
                  put: vi.fn((val: any) => {
                    mockStore[val.id] = val;
                  }),
                  get: vi.fn((key: string) => {
                    const getReq: any = {
                      result: mockStore[key],
                      onsuccess: null,
                    };
                    setTimeout(() => {
                      if (getReq.onsuccess) getReq.onsuccess({ target: getReq });
                    }, 10);
                    return getReq;
                  }),
                  delete: vi.fn((key: string) => {
                    delete mockStore[key];
                  }),
                })),
                oncomplete: null,
                onerror: null,
              };

              setTimeout(() => {
                if (tx.oncomplete) tx.oncomplete({ target: tx });
              }, 10);

              return tx;
            }),
            close: vi.fn(),
          },
          onsuccess: null,
          onerror: null,
        };

        setTimeout(() => {
          if (req.onsuccess) req.onsuccess({ target: req });
        }, 10);

        return req;
      }),
    };

    vi.stubGlobal('indexedDB', mockIDB);
  });

  it('restores stored workbook and custom options on app initial load', async () => {
    // 1. Pre-seed IndexedDB with sample spreadsheet data
    const sample = getSampleSpreadsheet('financial-statement');
    await saveSession({
      fileName: 'preloaded_report.csv',
      fileSize: sample.buffer.byteLength,
      buffer: sample.buffer,
      sheetNames: ['Sheet1'],
      activeSheetIndex: 0,
      options: {
        theme: 'emerald-report',
        pageSize: 'a4',
        orientation: 'portrait',
        layoutMode: 'balanced',
        marginPreset: 'normal',
        fontScale: 8.5,
        customTitle: 'Persisted Report Title',
        repeatTableHeaders: true,
        showPageNumbers: true,
        showSectionSummary: true,
      },
    });

    // 2. Render App (simulating opening or returning to tab in Chrome)
    render(<App />);

    // 3. App should automatically restore session and render StudioLayout with preloaded_report.csv
    await waitFor(
      () => {
        const matches = screen.getAllByText('preloaded_report.csv');
        expect(matches.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 20000 }
    );
  });
});
