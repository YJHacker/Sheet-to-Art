import fs from 'fs';
import path from 'path';
import { compileTypstToPDF } from '../src/lib/typst/typst-compiler';
import { parseXLSX } from '../src/workers/xlsx-parser';
import { analyzeCellIR } from '../src/lib/layout/layout-engine';

async function testHeaderLayouts() {
  const typst1 = `
#set page(paper: "a4", flipped: true, margin: 10mm)
#set text(font: "Liberation Sans", size: 8pt)

#table(
  columns: (100pt, 200pt, 200pt, 200pt, 50pt),
  table.header(
    table.cell(colspan: 5, fill: rgb("#F1F5F9"), stroke: (bottom: 1pt + rgb("#2563EB")))[
      #text(size: 9pt, weight: "bold", fill: rgb("#2563EB"))[10 · ERROR LOG — every wrong question, with its exact reason]
    ],
    [#text(weight: "bold")[Date]],
    [#text(weight: "bold")[Subject]],
    [#text(weight: "bold")[Asked]],
    [#text(weight: "bold")[Reason]],
    [#text(weight: "bold")[Done]]
  ),
  [2026-09-01], [Maths], [Calculus], [Misread formula], [X],
  [2026-09-02], [Algorithms], [Graphs], [Time limit], [X]
)
`;

  const pdf = await compileTypstToPDF(typst1);
  fs.writeFileSync('/tmp/test_table_header.pdf', Buffer.from(pdf));
  console.log('Compiled table header test successfully! PDF bytes:', pdf.length);
}

testHeaderLayouts().catch(console.error);
