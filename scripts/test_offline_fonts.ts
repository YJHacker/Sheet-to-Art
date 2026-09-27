import fs from 'node:fs';
import path from 'node:path';
import { createTypstCompiler, initOptions, loadFonts } from '@myriaddreamin/typst.ts';

async function testFontLoading() {
  const wasmPath = path.resolve('node_modules/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm');
  const wasmModule = fs.readFileSync(wasmPath);

  const fontCandidates = [
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf',
  ];
  const fontBuffers: Uint8Array[] = [];
  for (const p of fontCandidates) {
    if (fs.existsSync(p)) {
      const buf = fs.readFileSync(p);
      fontBuffers.push(new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
    }
  }

  const compiler = createTypstCompiler();
  await compiler.init({
    getModule: () => wasmModule,
    beforeBuild: [
      initOptions.disableDefaultFontAssets(),
      loadFonts(fontBuffers),
    ],
  });

  const typstCode = `
#set page(paper: "a4", margin: 10mm)
#set text(font: "Liberation Sans", size: 8pt)
= Offline Font Test
- Success! No remote network fetch is triggered!
`;

  compiler.addSource('/test_offline.typ', typstCode);
  const res = await compiler.compile({
    mainFilePath: '/test_offline.typ',
    format: 1, // PDF
  });

  console.log(`Success! PDF bytes: ${res?.result?.length}`);
}

testFontLoading().catch(console.error);
