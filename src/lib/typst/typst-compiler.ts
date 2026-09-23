import { createTypstCompiler, initOptions, type TypstCompiler } from '@myriaddreamin/typst.ts';
import type { LayoutIR } from '../../types/layout-ir';
import type { PDFRenderResult, TypstGeneratorOptions } from '../../types/typst';
import { generateTypstDocument } from './typst-generator';
import { getPDFPageCount } from './pdf-assembler';

let compilerInstance: TypstCompiler | null = null;
let initPromise: Promise<TypstCompiler> | null = null;

/**
 * Resolves the WASM binary module across Node.js (Vitest) and Browser (Web Worker) environments.
 */
async function getWasmModule(): Promise<ArrayBuffer | Uint8Array> {
  // Check if running in Node.js / Vitest environment
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const wasmPath = path.resolve('node_modules/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm');
      if (fs.existsSync(wasmPath)) {
        return fs.readFileSync(wasmPath);
      }
    } catch {
      // Fall through to browser fetch
    }
  }

  // Browser / Web Worker environment
  if (typeof fetch === 'function') {
    const response = await fetch(
      new URL('@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm', import.meta.url).href
    );
    return response.arrayBuffer();
  }

  throw new Error('Unsupported runtime environment for Typst WASM loading');
}

/**
 * Initializes the Typst WASM compiler engine with offline font and asset handling.
 */
export async function initTypstEngine(): Promise<TypstCompiler> {
  if (compilerInstance) {
    return compilerInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const wasmModule = await getWasmModule();
    const compiler = createTypstCompiler();

    await compiler.init({
      getModule: () => wasmModule,
      beforeBuild: [
        initOptions.disableDefaultFontAssets(),
      ],
    });

    compilerInstance = compiler;
    return compiler;
  })();

  return initPromise;
}

/**
 * Compiles a raw Typst 0.11+ source code string into a binary PDF Uint8Array buffer.
 */
export async function compileTypstToPDF(source: string): Promise<Uint8Array> {
  if (!source || !source.trim()) {
    throw new Error('Typst source cannot be empty');
  }

  const compiler = await initTypstEngine();
  const mainFilePath = `/doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.typ`;

  try {
    compiler.addSource(mainFilePath, source);

    const result = await compiler.compile({
      mainFilePath,
      format: 1, // CompileFormatEnum.pdf
    });

    if (!result || !result.result || result.result.length === 0) {
      throw new Error('Typst compiler produced an empty PDF result');
    }

    return result.result as Uint8Array;
  } catch (err: any) {
    const msg = err && typeof err === 'object' && err.message ? err.message : String(err);
    throw new Error(`Typst compilation failed: ${msg}`);
  }
}

/**
 * Transforms LayoutIR directly into a fully-rendered PDF document with metadata.
 */
export async function compileLayoutToPDF(
  layout: LayoutIR,
  options?: TypstGeneratorOptions
): Promise<PDFRenderResult> {
  const typstSource = generateTypstDocument(layout, options);
  const pdfBuffer = await compileTypstToPDF(typstSource);
  const pageCount = await getPDFPageCount(pdfBuffer);

  return {
    pdfBuffer,
    pageCount: Math.max(pageCount, 1),
    typstSource,
  };
}
