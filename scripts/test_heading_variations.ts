import { compileTypstToPDF } from '../src/lib/typst/typst-compiler';

async function testHeadingVariations() {
  const variations = [
    { name: 'Direct heading', code: '#set page(paper: "a4")\n#heading(level: 2)[Title]\nContent' },
    { name: 'Show heading with block', code: '#set page(paper: "a4")\n#show heading: it => block(below: 6pt, it)\n#heading(level: 2)[Title]\nContent' },
    { name: 'Show heading: set text', code: '#set page(paper: "a4")\n#show heading: set text(fill: blue)\n#heading(level: 2)[Title]\nContent' },
  ];

  for (const v of variations) {
    try {
      const pdfBytes = await compileTypstToPDF(v.code);
      console.log(`${v.name}: SUCCESS, bytes = ${pdfBytes.length}`);
    } catch (err: any) {
      console.log(`${v.name}: FAILED (${err.message})`);
    }
  }
}

testHeadingVariations();
