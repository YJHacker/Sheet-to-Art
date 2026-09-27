// src/lib/typst/typst-compiler.ts
import {
  createTypstCompiler,
  createTypstRenderer,
  initOptions,
  loadFonts,
  type TypstCompiler,
  type TypstRenderer,
} from '@myriaddreamin/typst.ts';
import type { LayoutIR } from '../../types/layout-ir';
import type { PDFRenderResult, TypstGeneratorOptions } from '../../types/typst';
import { generateTypstDocument } from './typst-generator';
import { getPDFPageCount } from './pdf-assembler';

let compilerInstance: TypstCompiler | null = null;
let compilerInitPromise: Promise<TypstCompiler> | null = null;

let rendererInstance: TypstRenderer | null = null;
let rendererInitPromise: Promise<TypstRenderer> | null = null;

/**
 * Resolves font binary buffers across Node.js (filesystem) and Browser (network fetch) environments.
 */
async function getFontBuffers(): Promise<Uint8Array[]> {
  const fontNames = [
    'LiberationSans-Regular.ttf',
    'LiberationSans-Bold.ttf',
    'LiberationSans-Italic.ttf',
    'LiberationSans-BoldItalic.ttf',
    'LiberationSerif-Regular.ttf',
    'LiberationSerif-Bold.ttf',
    'LiberationSerif-Italic.ttf',
    'LiberationMono-Regular.ttf',
    'LiberationMono-Bold.ttf',
  ];

  const fontBuffers: Uint8Array[] = [];

  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      for (const name of fontNames) {
        const p1 = path.resolve('public/fonts', name);
        const p2 = path.resolve('/usr/share/fonts/truetype/liberation', name);
        const p = fs.existsSync(p1) ? p1 : fs.existsSync(p2) ? p2 : null;
        if (p) {
          const buf = fs.readFileSync(p);
          fontBuffers.push(new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
        }
      }
    } catch {
      // Fall through
    }
  } else if (typeof fetch === 'function') {
    // Browser environment: fetch pre-bundled fonts from public /fonts/
    const fontPromises = fontNames.map(async (name) => {
      try {
        const res = await fetch(`/fonts/${name}`);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          return new Uint8Array(ab);
        }
      } catch (err) {
        console.warn(`Failed to fetch font /fonts/${name}:`, err);
      }
      return null;
    });

    const results = await Promise.all(fontPromises);
    for (const b of results) {
      if (b) fontBuffers.push(b);
    }
  }

  return fontBuffers;
}

/**
 * Resolves font options and builds hooks for compiler/renderer initialization.
 */
async function getFontBeforeBuild(): Promise<any[]> {
  const hooks: any[] = [initOptions.disableDefaultFontAssets()];
  const fontBuffers = await getFontBuffers();
  if (fontBuffers.length > 0) {
    hooks.push(loadFonts(fontBuffers));
  }
  return hooks;
}

/**
 * Resolves the Compiler WASM binary module across Node.js and Browser environments.
 */
async function getCompilerWasmModule(): Promise<ArrayBuffer | Uint8Array> {
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

  if (typeof fetch === 'function') {
    const response = await fetch(
      new URL('@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm', import.meta.url).href
    );
    return response.arrayBuffer();
  }

  throw new Error('Unsupported runtime environment for Typst Compiler WASM loading');
}

/**
 * Resolves the Renderer WASM binary module across Node.js and Browser environments.
 */
async function getRendererWasmModule(): Promise<ArrayBuffer | Uint8Array> {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const wasmPath = path.resolve('node_modules/@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm');
      if (fs.existsSync(wasmPath)) {
        return fs.readFileSync(wasmPath);
      }
    } catch {
      // Fall through to browser fetch
    }
  }

  if (typeof fetch === 'function') {
    const response = await fetch(
      new URL('@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm', import.meta.url).href
    );
    return response.arrayBuffer();
  }

  throw new Error('Unsupported runtime environment for Typst Renderer WASM loading');
}

/**
 * Initializes the Typst WASM compiler engine with font assets.
 */
export async function initTypstEngine(): Promise<TypstCompiler> {
  if (compilerInstance) {
    return compilerInstance;
  }

  if (compilerInitPromise) {
    return compilerInitPromise;
  }

  compilerInitPromise = (async () => {
    const wasmModule = await getCompilerWasmModule();
    const fontBeforeBuild = await getFontBeforeBuild();
    const compiler = createTypstCompiler();

    await compiler.init({
      getModule: () => wasmModule,
      beforeBuild: fontBeforeBuild,
    });

    compilerInstance = compiler;
    return compiler;
  })();

  return compilerInitPromise;
}

/**
 * Initializes the Typst WASM renderer engine for vector SVG rendering.
 */
export async function initTypstRenderer(): Promise<TypstRenderer> {
  if (rendererInstance) {
    return rendererInstance;
  }

  if (rendererInitPromise) {
    return rendererInitPromise;
  }

  rendererInitPromise = (async () => {
    const wasmModule = await getRendererWasmModule();
    const fontBeforeBuild = await getFontBeforeBuild();
    const renderer = createTypstRenderer();

    await renderer.init({
      getModule: () => wasmModule,
      beforeBuild: fontBeforeBuild,
    });

    rendererInstance = renderer;
    return renderer;
  })();

  return rendererInitPromise;
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
 * Compiles Typst markup into a scalable vector SVG string for universal preview.
 * Fixes text outline glyph fill/stroke inheritance so text renders crisply across all browsers.
 */
export async function compileTypstToVectorSvg(source: string): Promise<string | undefined> {
  try {
    const compiler = await initTypstEngine();
    const renderer = await initTypstRenderer();
    const mainFilePath = `/doc_svg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.typ`;

    compiler.addSource(mainFilePath, source);
    const compileResult = await compiler.compile({
      mainFilePath,
      format: 0, // Vector artifact format
    });

    if (compileResult?.result) {
      let svg = await renderer.renderSvg({
        artifactContent: compileResult.result as Uint8Array,
        format: 'vector',
      } as any);

      if (svg) {
        // Fix glyph fill and stroke CSS variable inheritance in Typst-rendered SVG
        // When --glyph_fill is unset, outline_glyph paths must inherit fill from <g class="typst-text" fill="...">
        svg = svg.replace(/fill:\s*var\(--glyph_fill\);/g, 'fill: var(--glyph_fill, inherit);');
        svg = svg.replace(/stroke:\s*var\(--glyph_stroke\);/g, 'stroke: var(--glyph_stroke, none);');

        // Inject default fallback styles for glyphs into the SVG style block
        const glyphStyleFix = `
.typst-doc {
  --glyph_fill: inherit;
  --glyph_stroke: none;
}
.outline_glyph path,
path.outline_glyph {
  fill: var(--glyph_fill, inherit);
  stroke: var(--glyph_stroke, none);
}
`;
        svg = svg.replace('<style type="text/css">', `<style type="text/css">${glyphStyleFix}`);
      }

      return svg;
    }
  } catch (err) {
    console.warn('Vector SVG compilation fallback:', err);
  }
  return undefined;
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
  const svg = await compileTypstToVectorSvg(typstSource);

  return {
    pdfBuffer,
    pageCount: Math.max(pageCount, 1),
    typstSource,
    svg,
  };
}
