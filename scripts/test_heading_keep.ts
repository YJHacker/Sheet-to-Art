import { compileTypstToPDF } from '../src/lib/typst/typst-compiler';

async function testKeepWithNext() {
  const typstCode1 = `
#set page(paper: "a4")
#show heading: it => block(breakable: false, it)
= Section Heading
Table content
`;

  const typstCode2 = `
#set page(paper: "a4")
#heading(level: 2)[Title]
#table(columns: (1fr), [Row 1])
`;

  try {
    const res1 = await compileTypstToPDF(typstCode1);
    console.log('Code 1 compiled, bytes:', res1.length);
  } catch (err: any) {
    console.error('Code 1 failed:', err.message);
  }
}

testKeepWithNext();
