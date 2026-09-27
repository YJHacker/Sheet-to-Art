import fs from 'fs';
import path from 'path';
import { parseXLSX } from '../src/workers/xlsx-parser';
import { analyzeCellIR } from '../src/lib/layout/layout-engine';
import { compileTypstToPDF } from '../src/lib/typst/typst-compiler';
import { PDFDocument } from 'pdf-lib';
import { escapeTypst } from '../src/lib/typst/typst-escaper';
import { getTheme } from '../src/lib/typst/themes';
import type { LayoutIR, DocumentSection, TableSection, KpiGridContent, TextSectionContent } from '../src/types/layout-ir';

function generateOptimizedTypst(layout: LayoutIR, themeName: string = 'modern-clean'): string {
  const theme = getTheme(themeName);
  const lines: string[] = [];

  const isFlipped = layout.globalStyles.orientation === 'landscape';
  const paper = layout.globalStyles.pageSize === 'letter' ? 'us-letter' : 'a4';

  lines.push('// Sheet-to-Art Publication Layout Engine');
  lines.push('#set page(');
  lines.push(`  paper: "${paper}",`);
  lines.push(`  flipped: ${isFlipped},`);
  lines.push(`  margin: (top: 10mm, bottom: 10mm, left: 10mm, right: 10mm),`);
  lines.push('  header: context if here().page() > 1 [');
  lines.push('    #grid(');
  lines.push('      columns: (1fr, auto),');
  lines.push(`      align(left + bottom)[#text(size: 6.5pt, fill: rgb("${theme.secondaryColor}"))[${escapeTypst(layout.title || '')}]],`);
  lines.push(`      align(right + bottom)[#text(size: 6.5pt, fill: rgb("${theme.secondaryColor}"))[Page #counter(page).display()]]`);
  lines.push('    )');
  lines.push('    #v(1.5pt)');
  lines.push(`    #line(length: 100%, stroke: 0.5pt + rgb("${theme.borderColor}"))`);
  lines.push('  ],');
  lines.push('  footer: context align(center)[');
  lines.push(`    #text(size: 7pt, fill: rgb("${theme.secondaryColor}"))[Page #counter(page).display()]`);
  lines.push('  ]');
  lines.push(')');
  lines.push('');

  lines.push(`#set text(font: "${theme.fontFamily}", size: 7.8pt, fill: rgb("${theme.textColor}"))`);
  lines.push('#set par(justify: false, leading: 0.48em)');
  lines.push('');

  // Title Banner
  if (layout.title) {
    lines.push('#block(');
    lines.push('  width: 100%,');
    lines.push('  inset: (bottom: 4pt),');
    lines.push(`  stroke: (bottom: 1.5pt + rgb("${theme.primaryColor}")),`);
    lines.push('  [');
    lines.push(`    #text(size: 11pt, weight: "bold", fill: rgb("${theme.primaryColor}"))[${escapeTypst(layout.title)}]`);
    lines.push('  ]');
    lines.push(')');
    lines.push('#v(4pt)');
  }

  // Render Sections
  for (let sIdx = 0; sIdx < layout.sections.length; sIdx++) {
    const sec = layout.sections[sIdx]!;
    if (sIdx > 0) {
      lines.push('#v(5pt)');
    }

    if (sec.type === 'kpi-grid') {
      const content = sec.content as KpiGridContent;
      if (!content || !content.items || content.items.length === 0) continue;

      if (sec.title) {
        lines.push(`#heading(level: 2, numbering: none)[#text(size: 8.5pt, weight: "bold", fill: rgb("${theme.primaryColor}"))[${escapeTypst(sec.title)}]]`);
        lines.push('#v(2pt)');
      }

      const numCols = content.columns || Math.min(content.items.length, 5) || 2;
      const colSpec = Array(numCols).fill('1fr').join(', ');

      lines.push('#block(');
      lines.push('  width: 100%,');
      lines.push('  breakable: false,');
      lines.push('  [');
      lines.push('    #grid(');
      lines.push(`      columns: (${colSpec}),`);
      lines.push('      gutter: 5pt,');
      for (const item of content.items) {
        lines.push('      block(');
        lines.push(`        fill: rgb("${theme.kpiBackground}"),`);
        lines.push(`        stroke: 0.5pt + rgb("${theme.kpiBorderColor}"),`);
        lines.push('        radius: 3pt,');
        lines.push('        inset: (x: 6pt, y: 4pt),');
        lines.push('        width: 100%,');
        lines.push('        [');
        lines.push(`          #text(size: 6.8pt, weight: "medium", fill: rgb("${theme.secondaryColor}"))[${escapeTypst(item.label)}]`);
        lines.push('          #v(1.5pt)');
        lines.push(`          #text(size: 8.5pt, weight: "bold", fill: rgb("${theme.kpiAccentColor}"))[${escapeTypst(item.value)}]`);
        if (item.change) {
          lines.push('          #v(1pt)');
          lines.push(`          #text(size: 6.5pt, fill: rgb("${theme.secondaryColor}"))[${escapeTypst(item.change)}]`);
        }
        lines.push('        ]');
        lines.push('      ),');
      }
      lines.push('    )');
      lines.push('  ]');
      lines.push(')');
    } else if (sec.type === 'table') {
      const content = sec.content as TableSection;
      if (!content || !content.columns || content.columns.length === 0) continue;

      if (sec.title) {
        lines.push(`#heading(level: 2, numbering: none)[#text(size: 8.5pt, weight: "bold", fill: rgb("${theme.primaryColor}"))[${escapeTypst(sec.title)}]]`);
        lines.push('#v(2pt)');
      }

      // Column widths calculation: printable width = 841.9 - 20mm (56.7pt) = 785.2pt
      const totalWidth = 785;
      const columns = content.columns;

      // Ensure Month columns or header columns have proper minimums
      const colWidths = columns.map(c => {
        let w = c.suggestedWidth || c.minWidth || 50;
        if (c.header.toLowerCase() === 'month' && w < 65) w = 65;
        return `${w.toFixed(1)}pt`;
      }).join(', ');

      const alignments = columns.map(c => c.alignment || 'left').join(', ');

      lines.push('#table(');
      lines.push(`  columns: (${colWidths}),`);
      lines.push(`  align: (${alignments}),`);
      lines.push('  inset: (x: 3.5pt, y: 2.2pt),');
      lines.push(`  stroke: (x, y) => ${theme.tableStroke},`);
      lines.push(`  fill: (col, row) => if row == 0 { rgb("${theme.headerBackground}") } else if calc.even(row) { rgb("${theme.zebraBackground}") } else { none },`);
      lines.push('  table.header(');
      for (const col of columns) {
        lines.push(`    [#text(weight: "bold", fill: rgb("${theme.headerTextColor}"))[${escapeTypst(col.header)}]],`);
      }
      lines.push('  ),');

      for (const row of content.rows) {
        for (let cIdx = 0; cIdx < columns.length; cIdx++) {
          const cell = row.cells[cIdx];
          const val = cell ? cell.formattedValue : '';
          const escaped = escapeTypst(val);

          if (cell?.style?.bgColor) {
            let cellContent = escaped;
            if (cell.style.bold) cellContent = `#text(weight: "bold")[${cellContent}]`;
            if (cell.style.italic) cellContent = `#text(style: "italic")[${cellContent}]`;
            lines.push(`  table.cell(fill: rgb("${cell.style.bgColor}"))[${cellContent}],`);
          } else if (cell?.style?.bold) {
            lines.push(`  [#text(weight: "bold")[${escaped}]],`);
          } else if (cell?.style?.italic) {
            lines.push(`  [#text(style: "italic")[${escaped}]],`);
          } else {
            lines.push(`  [${escaped}],`);
          }
        }
      }
      lines.push(')');
    } else if (sec.type === 'text') {
      const content = sec.content as TextSectionContent;
      if (!content || !content.paragraphs || content.paragraphs.length === 0) continue;

      if (sec.title) {
        lines.push(`#heading(level: 2, numbering: none)[#text(size: 8.5pt, weight: "bold", fill: rgb("${theme.primaryColor}"))[${escapeTypst(sec.title)}]]`);
        lines.push('#v(2pt)');
      }

      for (const para of content.paragraphs) {
        lines.push('#block(');
        lines.push('  width: 100%,');
        lines.push(`  fill: rgb("${theme.noteBackground}"),`);
        lines.push(`  stroke: (left: 2.5pt + rgb("${theme.noteBorderColor}")),`);
        lines.push('  inset: (x: 6pt, y: 3.5pt),');
        lines.push('  radius: (right: 3pt),');
        lines.push('  [');
        lines.push(`    #text(size: 7.2pt, fill: rgb("${theme.textColor}"))[${escapeTypst(para)}]`);
        lines.push('  ]');
        lines.push(')');
        lines.push('#v(1.5pt)');
      }
    }
  }

  return lines.join('\n');
}

async function runTest() {
  const fixturePath = path.resolve('tests/fixtures/GATE2027_Tracker_AllBranches.xlsx');
  const fileBuffer = fs.readFileSync(fixturePath);
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

  const sheetNames = ['START_HERE', 'CS', 'DA', 'ECE', 'EE', 'ME', 'CE'];

  for (let sIdx = 0; sIdx < 7; sIdx++) {
    const cellIR = await parseXLSX(arrayBuffer, 'GATE2027_Tracker_AllBranches.xlsx', sIdx);
    const layout = analyzeCellIR(cellIR, { pageSize: 'a4', orientation: 'auto', theme: 'modern-clean' });
    const typst = generateOptimizedTypst(layout, 'modern-clean');

    const pdfBuffer = await compileTypstToPDF(typst);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    const pdfPath = `generated_pdfs/GATE2027_${sheetNames[sIdx]}_opt.pdf`;
    fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer));

    console.log(`Sheet [${sIdx}] "${sheetNames[sIdx]}": ${pageCount} pages, size = ${pdfBuffer.length} bytes`);
  }
}

runTest().catch(console.error);
