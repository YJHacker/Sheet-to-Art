import fs from 'fs';
import path from 'path';
import { createTypstCompiler, initOptions, loadFonts } from '@myriaddreamin/typst.ts';

async function testFontLoading() {
  const wasmPath = path.resolve('node_modules/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm');
  const wasmModule = fs.readFileSync(wasmPath);

  const fontFiles = [
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  ].filter(f => fs.existsSync(f));

  console.log(`Loading ${fontFiles.length} fonts from disk...`);
  const fontBuffers = fontFiles.map(f => fs.readFileSync(f));

  const compiler = createTypstCompiler();
  await compiler.init({
    getModule: () => wasmModule,
    beforeBuild: [
      loadFonts(fontBuffers),
    ],
  });

  const typstCode = `
#set page(paper: "a4", margin: 15mm)
#set text(font: "Liberation Sans", size: 12pt)
= Hello GATE 2027
This is a test with real fonts loaded into Typst!
- Marks Map
- Weekly Non-Negotiables
`;

  compiler.addSource('/test.typ', typstCode);
  const res = await compiler.compile({
    mainFilePath: '/test.typ',
    format: 1, // PDF
  });

  if (res && res.result) {
    console.log(`Compiled successfully! PDF bytes: ${res.result.length}`);
    fs.writeFileSync('/tmp/test_font.pdf', Buffer.from(res.result));
  }
}

testFontLoading().catch(console.error);
