// src/lib/utils/download.ts
import { sanitizeFileName } from './formatters';

/**
 * Initiates a browser download for a Blob.
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

  // Clean up object URL
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }, 1000);
  }
}

/**
 * Downloads a PDF buffer or Blob with a sanitized filename.
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
    blob = new Blob([pdfData as unknown as BlobPart], { type: 'application/pdf' });
  } else {
    blob = new Blob([new Uint8Array(pdfData) as unknown as BlobPart], { type: 'application/pdf' });
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
        document.body.removeChild(iframe);
      }, 5000);
    }
  };

  document.body.appendChild(iframe);
}
