import { compileTypstToPDF } from '../src/lib/typst/typst-compiler';

async function testHeadingRule() {
  const typstCode = `
#set page(paper: "a4")
#show heading: set block(keep-with-next: true)
= Hello World
This is a test.
`;
  try {
    const res = await compileTypstToPDF(typstCode);
    console.log('Heading rule compiled successfully, pages:', res.pageCount);
  } catch (err: any) {
    console.error('Heading rule failed:', err.message);
  }
}

testHeadingRule();
