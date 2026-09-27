// tests/unit/persistence.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveSession,
  loadSession,
  clearSession,
  updateStoredOptions,
  updateStoredActiveSheet,
} from '../../src/lib/storage/persistence';
import type { StudioOptions } from '../../src/types/studio';

describe('IndexedDB Persistence Layer', () => {
  let mockStore: Record<string, any> = {};

  beforeEach(() => {
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
                    }, 0);
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

  it('saves and loads a workbook session successfully', async () => {
    const dummyBuffer = new Uint8Array([1, 2, 3, 4]).buffer;
    const testOptions: StudioOptions = {
      theme: 'emerald-report',
      pageSize: 'a4',
      orientation: 'landscape',
      layoutMode: 'compact',
      marginPreset: 'compact',
      fontScale: 9.0,
      customTitle: 'Quarterly Audit',
      repeatTableHeaders: true,
      showPageNumbers: true,
      showSectionSummary: false,
    };

    await saveSession({
      fileName: 'audit.xlsx',
      fileSize: 1024,
      buffer: dummyBuffer,
      sheetNames: ['Summary', 'Q1', 'Q2'],
      activeSheetIndex: 1,
      options: testOptions,
    });

    const loaded = await loadSession();
    expect(loaded).toBeDefined();
    expect(loaded?.fileName).toBe('audit.xlsx');
    expect(loaded?.fileSize).toBe(1024);
    expect(loaded?.sheetNames).toEqual(['Summary', 'Q1', 'Q2']);
    expect(loaded?.activeSheetIndex).toBe(1);
    expect(loaded?.options.theme).toBe('emerald-report');
    expect(loaded?.options.customTitle).toBe('Quarterly Audit');
  });

  it('clears session from storage', async () => {
    const dummyBuffer = new Uint8Array([1, 2, 3]).buffer;
    await saveSession({
      fileName: 'temp.csv',
      fileSize: 3,
      buffer: dummyBuffer,
      sheetNames: ['Sheet1'],
      activeSheetIndex: 0,
      options: { theme: 'modern-clean' } as any,
    });

    expect(await loadSession()).not.toBeNull();

    await clearSession();
    expect(await loadSession()).toBeNull();
  });

  it('updates stored options without re-uploading buffer', async () => {
    const dummyBuffer = new Uint8Array([1, 2, 3]).buffer;
    await saveSession({
      fileName: 'temp.csv',
      fileSize: 3,
      buffer: dummyBuffer,
      sheetNames: ['Sheet1'],
      activeSheetIndex: 0,
      options: { theme: 'modern-clean', fontScale: 8.5 } as any,
    });

    await updateStoredOptions({ theme: 'executive-serif', fontScale: 10.0 });

    const updated = await loadSession();
    expect(updated?.options.theme).toBe('executive-serif');
    expect(updated?.options.fontScale).toBe(10.0);
    expect(updated?.fileName).toBe('temp.csv');
  });

  it('updates stored active sheet index', async () => {
    const dummyBuffer = new Uint8Array([1, 2, 3]).buffer;
    await saveSession({
      fileName: 'temp.csv',
      fileSize: 3,
      buffer: dummyBuffer,
      sheetNames: ['Sheet1', 'Sheet2'],
      activeSheetIndex: 0,
      options: { theme: 'modern-clean' } as any,
    });

    await updateStoredActiveSheet(1);

    const updated = await loadSession();
    expect(updated?.activeSheetIndex).toBe(1);
  });
});
