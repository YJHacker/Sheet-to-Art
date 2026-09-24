// src/lib/utils/formatters.ts

/**
 * Formats a byte size into a human-readable string (B, KB, MB, GB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const clampedI = Math.min(i, units.length - 1);
  if (clampedI === 0) return `${bytes} B`;
  const value = bytes / Math.pow(1024, clampedI);
  return `${value.toFixed(1)} ${units[clampedI]}`;
}

/**
 * Sanitizes a base filename and ensures it ends with the specified extension (default: .pdf).
 */
export function sanitizeFileName(name: string, extension: string = '.pdf'): string {
  if (!name || !name.trim()) {
    return `document${extension}`;
  }

  // Remove existing common extensions (.xlsx, .csv, .pdf, .xls)
  const base = name.replace(/\.(xlsx|csv|pdf|xls)$/i, '').trim();

  // Replace invalid characters (/ \ : * ? " < > |) with underscores
  const sanitized = base.replace(/[/\\:*?"<>|]/g, '_');

  const cleanExt = extension.startsWith('.') ? extension : `.${extension}`;
  return `${sanitized || 'document'}${cleanExt}`;
}

/**
 * Formats page counter for toolbar (e.g. "Page 1 of 4").
 */
export function formatPageCount(current: number, total: number): string {
  return `Page ${Math.max(1, current)} of ${Math.max(1, total)}`;
}

/**
 * Formats zoom percentage (e.g. "100%").
 */
export function formatZoom(zoom: number): string {
  return `${Math.round(zoom)}%`;
}
