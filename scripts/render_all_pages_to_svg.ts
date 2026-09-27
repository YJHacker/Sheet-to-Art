import fs from 'fs';
import path from 'path';
import { createTypstCompiler, createTypstRenderer, initOptions } from '@myriaddreamin/typst.ts';
import { parseXLSX } from '../src/workers/xlsx-parser';
import { analyzeCellIR } from '../src/lib/layout/layout-engine';
import { generateTypstDocument } from '../src/lib/typst/typst-generator';

async function getWasmModules() {
  const compilerWasmPath = path.resolve('node_modules/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm');
  const rendererWasmPath = path.resolve('node_modules/@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm');

  const compilerWasm = fs.readFileSync(compilerWasmPath);
  const rendererWasm = fs.readFileSync(rendererWasmPath);

  return { compilerWasm, rendererWasm };
}

async function renderAllPagesToSvg() {
  const outputDir = path.resolve('rendered_pages');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const { compilerWasm, rendererWasm } = await getWasmModules();

  const compiler = createTypstCompiler();
  await compiler.init({
    getModule: () => compilerWasm,
    beforeBuild: [initOptions.disableDefaultFontAssets()],
  });

  const renderer = createTypstRenderer();
  await renderer.init({
    getModule: () => rendererWasm,
    beforeBuild: [initOptions.disableDefaultFontAssets()],
  });

  const fixturePath = path.resolve('tests/fixtures/GATE2027_Tracker_AllBranches.xlsx');
  const fileBuffer = fs.readFileSync(fixturePath);
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

  const sheetNames = ['START_HERE', 'CS', 'DA', 'ECE', 'EE', 'ME', 'CE'];

  console.log('=== RENDERING ALL PAGES TO SVG ACROSS ALL 7 SHEETS ===\n');

  for (let sIdx = 0; sIdx < 7; sIdx++) {
    const sheetName = sheetNames[sIdx];
    const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', sIdx);
    const layout = analyzeCellIR(cellIR, { pageSize: 'a4', orientation: 'auto', theme: 'modern-clean' });
    const typstSource = generateTypstDocument(layout, { theme: 'modern-clean' });

    const mainFilePath = `/doc_${sIdx}.typ`;
    compiler.addSource(mainFilePath, typstSource);

    const compileResult = await compiler.compile({
      mainFilePath,
      format: 0, // vector format
    });

    if (!compileResult || !compileResult.result) {
      throw new Error(`Failed to compile vector artifact for sheet ${sIdx}`);
    }

    const artifact = compileResult.result as Uint8Array;

    const svg = await renderer.renderSvg({
      artifactContent: artifact,
    });

    const svgPath = path.join(outputDir, `GATE2027_${sheetName}.svg`);
    fs.writeFileSync(svgPath, svg, 'utf-8');
    console.log(`Sheet [${sIdx}] "${sheetName}": saved ${svgPath} (${(svg.length / 1024).toFixed(1)} KB)`);
  }

  console.log('\nAll SVG pages rendered successfully.');
}

renderAllPagesToSvg().catch(console.error);
