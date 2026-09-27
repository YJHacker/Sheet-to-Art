// src/lib/storage/persistence.ts
import type { StudioOptions } from '../../types/studio';

export interface StoredSession {
  id: string;
  fileName: string;
  fileSize: number;
  buffer: ArrayBuffer;
  sheetNames: string[];
  activeSheetIndex: number;
  options: StudioOptions;
  savedAt: number;
}

const DB_NAME = 'sheet_to_art_db';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';
const SESSION_KEY = 'active_session';

/**
 * Opens or initializes the IndexedDB instance.
 */
function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('IndexedDB open error:', request.error);
        resolve(null);
      };

      request.onblocked = () => {
        console.warn('IndexedDB open blocked');
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB unavailable:', err);
      resolve(null);
    }
  });
}

/**
 * Persists the current workbook buffer, metadata, and studio options to IndexedDB.
 */
export async function saveSession(
  sessionData: {
    fileName: string;
    fileSize: number;
    buffer: ArrayBuffer;
    sheetNames: string[];
    activeSheetIndex: number;
    options: StudioOptions;
  }
): Promise<void> {
  const db = await openDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record: StoredSession = {
        id: SESSION_KEY,
        fileName: sessionData.fileName,
        fileSize: sessionData.fileSize,
        buffer: sessionData.buffer.slice(0), // Clean clone for storage
        sheetNames: sessionData.sheetNames,
        activeSheetIndex: sessionData.activeSheetIndex,
        options: sessionData.options,
        savedAt: Date.now(),
      };

      store.put(record);

      tx.oncomplete = () => {
        db.close();
        resolve();
      };

      tx.onerror = () => {
        console.warn('Failed to save session to IndexedDB:', tx.error);
        db.close();
        resolve();
      };
    } catch (err) {
      console.warn('Error saving session:', err);
      db.close();
      resolve();
    }
  });
}

/**
 * Retrieves the persisted session from IndexedDB if one exists.
 */
export async function loadSession(): Promise<StoredSession | null> {
  const db = await openDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(SESSION_KEY);

      request.onsuccess = () => {
        db.close();
        const record = request.result as StoredSession | undefined;
        if (record && record.buffer && record.fileName) {
          resolve(record);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.warn('Failed to load session from IndexedDB:', request.error);
        db.close();
        resolve(null);
      };
    } catch (err) {
      console.warn('Error reading session:', err);
      db.close();
      resolve(null);
    }
  });
}

/**
 * Clears the persisted session from IndexedDB (e.g., when the user resets or starts new).
 */
export async function clearSession(): Promise<void> {
  const db = await openDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(SESSION_KEY);

      tx.oncomplete = () => {
        db.close();
        resolve();
      };

      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

/**
 * Updates only the options in the stored session without re-cloning large buffers.
 */
export async function updateStoredOptions(options: Partial<StudioOptions>): Promise<void> {
  const db = await openDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(SESSION_KEY);

      getRequest.onsuccess = () => {
        const record = getRequest.result as StoredSession | undefined;
        if (record) {
          record.options = {
            ...record.options,
            ...options,
          };
          record.savedAt = Date.now();
          store.put(record);
        }
      };

      tx.oncomplete = () => {
        db.close();
        resolve();
      };

      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

/**
 * Updates active worksheet index in stored session.
 */
export async function updateStoredActiveSheet(activeSheetIndex: number): Promise<void> {
  const db = await openDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(SESSION_KEY);

      getRequest.onsuccess = () => {
        const record = getRequest.result as StoredSession | undefined;
        if (record) {
          record.activeSheetIndex = activeSheetIndex;
          record.savedAt = Date.now();
          store.put(record);
        }
      };

      tx.oncomplete = () => {
        db.close();
        resolve();
      };

      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}
