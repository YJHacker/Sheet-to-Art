import { compileTypstToPDF } from '../src/lib/typst/typst-compiler';

async function testHeadingRules() {
  const tests = [
    {
      name: 'show heading with set block(above, below)',
      code: `
#set page(paper: "a4")
#show heading: set block(above: 8pt, below: 4pt)
= Heading 1
Content 1
`
    },
    {
      name: 'show heading: it => [ ... ]',
      code: `
#set page(paper: "a4")
#show heading: it => [
  #v(6pt)
  #text(weight: "bold", fill: blue)[#it.body]
  #v(2pt)
]
= Heading 1
Content 1
`
    }
  ];

  for (const t of tests) {
    try {
      const res = await compileTypstToPDF(t.code);
      console.log(`${t.name}: SUCCESS, bytes = ${res.length}`);
    } catch (e: any) {
      console.log(`${t.name}: FAILED (${e.message})`);
    }
  }
}

testHeadingRules();
