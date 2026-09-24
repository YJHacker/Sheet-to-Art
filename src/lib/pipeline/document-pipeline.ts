// src/lib/pipeline/document-pipeline.ts
import type { CellIR } from '../../types/cell-ir';
import type { LayoutIR, LayoutOptions } from '../../types/layout-ir';
import type { TypstGeneratorOptions, PDFRenderResult } from '../../types/typst';
import type { StudioOptions, PipelineProgress } from '../../types/studio';
import { parserWorker, layoutWorker, typstWorker } from '../workers';

/**
 * Maps Studio state options to Typst code generator options.
 */
export function mapStudioOptionsToTypstOptions(options: StudioOptions): TypstGeneratorOptions {
  return {
    theme: options.theme,
    pageSize: options.pageSize,
    orientation: options.orientation === 'auto' ? undefined : options.orientation,
    baseFontSize: options.fontScale,
    headerTitle: options.customTitle || undefined,
    repeatTableHeaders: options.repeatTableHeaders,
    showPageNumbers: options.showPageNumbers,
  };
}

/**
 * Maps Studio state options to Layout Engine options.
 */
export function mapStudioOptionsToLayoutOptions(options: StudioOptions): LayoutOptions {
  return {
    pageSize: options.pageSize,
    orientation: options.orientation,
  };
}

/**
 * Creates a browser Blob Object URL from a PDF Uint8Array buffer.
 */
export function createPDFBlobUrl(pdfBuffer: Uint8Array): string {
  const blob = new Blob([pdfBuffer as unknown as BlobPart], { type: 'application/pdf' });
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    return URL.createObjectURL(blob);
  }
  return `blob:mock-pdf-${Math.random().toString(36).slice(2)}`;
}

/**
 * Safely revokes a previous Blob Object URL to prevent browser memory leaks.
 */
export function revokePDFBlobUrl(url: string | null | undefined): void {
  if (url && url.startsWith('blob:') && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore revocation error
    }
  }
}

export interface PipelineExecutionResult {
  cellIR: CellIR;
  layoutIR: LayoutIR;
  pdfResult: PDFRenderResult;
  pdfBlobUrl: string;
}

export interface RecompileResult {
  pdfResult: PDFRenderResult;
  pdfBlobUrl: string;
}

/**
 * Executes the full end-to-end client-side document pipeline:
 * [File Buffer] -> ParserWorker (CellIR) -> LayoutWorker (LayoutIR) -> TypstWorker (WASM PDF)
 */
export async function executeDocumentPipeline(
  buffer: ArrayBuffer,
  fileName: string,
  sheetIndex: number = 0,
  options: StudioOptions,
  onProgress?: (progress: PipelineProgress) => void
): Promise<PipelineExecutionResult> {
  const notify = (stage: PipelineProgress['stage'], percent: number, message: string, error: string | null = null) => {
    if (onProgress) {
      onProgress({ stage, percent, message, error });
    }
  };

  try {
    // 1. Parsing Stage (0% - 30%)
    notify('parsing', 10, `Parsing spreadsheet structure from ${fileName}...`);
    const cellIR = await parserWorker.parseFile(buffer, fileName, sheetIndex);
    notify('parsing', 30, `Parsed ${cellIR.metadata.totalRows} rows and ${cellIR.metadata.totalCols} columns successfully.`);

    // 2. Layout Analysis Stage (30% - 65%)
    notify('layout', 40, 'Analyzing document semantics, table boundaries, and headers...');
    const layoutOpts = mapStudioOptionsToLayoutOptions(options);
    const layoutIR = await layoutWorker.analyzeLayout(cellIR, layoutOpts, (workerProgress) => {
      const mapped = 40 + Math.round(workerProgress * 0.25);
      notify('layout', mapped, 'Detecting sections and formatting layout...');
    });
    notify('layout', 65, `Identified ${layoutIR.sections.length} semantic sections.`);

    // 3. Typst WASM Typesetting Stage (65% - 95%)
    notify('compiling', 70, `Generating publication markup with theme: ${options.theme}...`);
    const typstOpts = mapStudioOptionsToTypstOptions(options);
    notify('compiling', 80, 'Compiling document via offline Typst WASM engine...');
    const pdfResult = await typstWorker.renderLayoutToPDF(layoutIR, typstOpts);
    notify('compiling', 95, `Assembled ${pdfResult.pageCount} page PDF.`);

    // 4. Ready Stage (100%)
    const pdfBlobUrl = createPDFBlobUrl(pdfResult.pdfBuffer);
    notify('ready', 100, 'Document ready.');

    return {
      cellIR,
      layoutIR,
      pdfResult,
      pdfBlobUrl,
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'An unexpected error occurred during document processing.';
    notify('error', 0, 'Document processing failed.', errorMsg);
    throw err;
  }
}

/**
 * Re-compiles an existing LayoutIR with modified options (theme, page size, font scale, title)
 * without re-parsing the original spreadsheet.
 */
export async function recompilePDF(
  layoutIR: LayoutIR,
  options: StudioOptions
): Promise<RecompileResult> {
  const typstOpts = mapStudioOptionsToTypstOptions(options);
  const pdfResult = await typstWorker.renderLayoutToPDF(layoutIR, typstOpts);
  const pdfBlobUrl = createPDFBlobUrl(pdfResult.pdfBuffer);

  return {
    pdfResult,
    pdfBlobUrl,
  };
}
