// src/lib/utils/download.ts
import { sanitizeFileName } from './formatters';

/**
 * Initiates a browser download for a Blob using a clean, standard anchor element.
 * Complies with WHATWG / Chromium download specifications without triggering
 * cross-origin navigation warnings.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const url =
    typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
      ? URL.createObjectURL(blob)
      : `blob:mock-download-${Date.now()}`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Allow browser sufficient window for download stream initiation before revoking
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }, 10000);
  }
}

/**
 * Downloads a PDF buffer or Blob with a sanitized filename and explicit MIME type.
 */
export function downloadPDF(
  pdfData: Uint8Array | ArrayBuffer | Blob,
  filename: string = 'document.pdf'
): void {
  const safeName = sanitizeFileName(filename, '.pdf');
  let blob: Blob;

  if (pdfData instanceof Blob) {
    blob = pdfData;
  } else if (pdfData instanceof Uint8Array) {
    const cleanBuffer = pdfData.buffer.slice(
      pdfData.byteOffset,
      pdfData.byteOffset + pdfData.byteLength
    );
    blob = new Blob([cleanBuffer as BlobPart], { type: 'application/pdf' });
  } else {
    blob = new Blob([pdfData as BlobPart], { type: 'application/pdf' });
  }

  downloadBlob(blob, safeName);
}

/**
 * Triggers a native print dialog for a PDF blob URL.
 */
export function printPDF(blobUrl: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Failed to trigger native print dialog:', err);
      window.open(blobUrl, '_blank')?.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000);
    }
  };

  document.body.appendChild(iframe);
}
