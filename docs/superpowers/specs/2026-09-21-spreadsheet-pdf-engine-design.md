# Spreadsheet → Intelligent Document → Beautiful PDF Platform
## Phase 1: Core Engine MVP - Architectural Specification

**Document Version:** 1.1 (Final Architecture Spec)  
**Date:** 2026-09-21  
**Status:** Approved & Implementation-Ready  
**Scope:** Phase 1 MVP (Parser → Layout Engine → PDF Generation)

---

## 1. Executive Summary

### Vision & Objective
The platform transforms raw, messy spreadsheet files (`.xlsx`, `.csv`) into beautifully typeset, publication-grade PDF documents. By automating structural analysis, table classification, typographic hierarchy, and pagination, the platform eliminates manual layout formatting while running **100% in the client browser with zero server roundtrips**.

### Phase 1 MVP Scope
- **Spreadsheet Ingestion**: Parsing `.xlsx` (OpenXML) and `.csv` files using `ExcelJS` and `csv-parse` in dedicated Web Workers.
- **Structural Inference**: Deterministic header identification, data-type inference, column width allocation, section grouping, and document layout categorization.
- **Document Generation**: Compiling documents into PDF format using Typst (WASM via `@myriaddreamin/typst.ts`) with `pdf-lib` document assembly.
- **Performance Objective**: Under 2.5 seconds end-to-end for a 1,000-row spreadsheet on standard hardware.
- **Privacy Assurance**: 100% client-side execution; zero raw data transmission or persistence.

### Key Corrections in Version 1.1
1. **File Format Support**: Removed `.xls` binary support to align with ExcelJS capabilities; limited scope to `.xlsx` and `.csv`.
2. **Header Detection Math**: Re-calibrated scoring formula to $S = 0.60B + 0.30T + 0.05F + 0.03C + 0.02U$ so that bold top rows achieve a score of $\ge 0.90$.
3. **Data Privacy Clarification**: Explicitly restricted IndexedDB caching to compiled WASM binaries, fonts, and layout metadata. Raw cell values and user content are never stored.
4. **Worker Communication**: Standardized exclusively on Comlink RPC across all worker boundaries, removing conflicting direct `postMessage` patterns.
5. **Type Definitions**: Added complete TypeScript interface definitions for `ColumnDescriptor` and related domain models.
6. **PDF Merging Pipeline**: Integrated `pdf-lib` to handle multi-section/multi-blob merges produced by Typst compilation.
7. **Typst 0.11+ Syntax**: Updated legacy `locate(loc => ...)` constructs to modern context expressions (`context { ... }`).

---

## 2. System Architecture

### Processing Pipeline

```
+-----------------------------------------------------------------+
|                          Main Thread                            |
|  +------------+       +-------------------+       +-----------+ |
|  | File Input | ----> | Canvas/DOM Preview| ----> | PDF Blob  | |
|  +------------+       +-------------------+       +-----------+ |
|        |                       ^                        ^       |
|        | Comlink RPC           | Comlink RPC            |       |
+--------|-----------------------|------------------------|-------+
         v                       |                        |
+-------------------+            |                        |
|   Parser Worker   |            |                        |
|  (ExcelJS / CSV)  |            |                        |
+-------------------+            |                        |
         |                       |                        |
         | Cell IR (Streaming)   |                        |
         v                       |                        |
+-------------------+            |                        |
|   Layout Worker   |            |                        |
| (Header & Typing) |            |                        |
+-------------------+            |                        |
         |                       |                        |
         | Layout IR             |                        |
         v                       |                        |
+------------------------------------------------+        |
|                  Typst Worker                  |        |
|  +-------------------+    +-----------------+  |        |
|  | Typst WASM Engine | -> | pdf-lib Merging | -+--------+
|  +-------------------+    +-----------------+  |
+------------------------------------------------+
```

### Worker RPC Protocol
All Web Workers are instantiated and consumed using Comlink RPC interfaces.

```typescript
// src/lib/workers.ts
import * as Comlink from 'comlink';
import type { ParserWorkerAPI } from './workers/parser.worker';
import type { LayoutWorkerAPI } from './workers/layout.worker';
import type { TypstWorkerAPI } from './workers/typst.worker';

export const parserWorker = Comlink.wrap<ParserWorkerAPI>(
  new Worker(new URL('./workers/parser.worker.ts', import.meta.url), { type: 'module' })
);

export const layoutWorker = Comlink.wrap<LayoutWorkerAPI>(
  new Worker(new URL('./workers/layout.worker.ts', import.meta.url), { type: 'module' })
);

export const typstWorker = Comlink.wrap<TypstWorkerAPI>(
  new Worker(new URL('./workers/typst.worker.ts', import.meta.url), { type: 'module' })
);
```

---

## 3. Layout Engine & Data Models

### 3.1 Parser Worker: Cell Intermediate Representation (Cell IR)

Supported inputs: `.xlsx` (OpenXML) and `.csv` (RFC 4180). Binary `.xls` is rejected during pre-flight validation.

```typescript
export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  bgColor?: string;
  textColor?: string;
  horizontalAlignment?: 'left' | 'center' | 'right';
  numFmt?: string;
}

export interface Cell {
  value: string | number | boolean | null;
  rawValue?: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'formula' | 'empty';
  style?: CellStyle;
  position: { row: number; col: number };
}

export interface CellRow {
  rowIndex: number;
  cells: Cell[];
}

export interface CellIR {
  rows: CellRow[];
  metadata: {
    fileName: string;
    sheetName: string;
    totalRows: number;
    totalCols: number;
  };
}

export interface ParserWorkerAPI {
  parseFile(buffer: ArrayBuffer, fileName: string, sheetIndex?: number): Promise<CellIR>;
}
```

---

### 3.2 Layout Worker: Analysis & Layout IR

#### Header Detection Formula
Header scoring uses weighted evaluation across the initial rows:

$$S = 0.60B + 0.30T + 0.05F + 0.03C + 0.02U$$

Where:
- $B \in [0, 1]$: Proportion of cells with bold typography
- $T \in \{0.30, 0.15, 0.00\}$: Top row position score (Row 0 = 0.30, Row 1 = 0.15, Others = 0.00)
- $F \in [0, 1]$: Proportion of non-empty cells
- $C \in [0, 1]$: Proportion of cells with background fill colors
- $U \in [0, 1]$: Proportion of string-typed cells

A row is designated as the table header when $S \ge 0.85$. A bold top row yields $S = 0.60(1.0) + 0.30 + 0.05(1.0) + 0.00 + 0.02(1.0) = 0.97 \ge 0.85$.

```typescript
export function computeHeaderScore(row: CellRow, rowIndex: number): number {
  if (row.cells.length === 0) return 0.0;

  const boldCount = row.cells.filter(c => c.style?.bold).length;
  const filledCount = row.cells.filter(c => c.value !== null && c.value !== '').length;
  const coloredCount = row.cells.filter(c => !!c.style?.bgColor).length;
  const stringCount = row.cells.filter(c => c.type === 'string').length;
  const total = row.cells.length;

  const B = boldCount / total;
  const T = rowIndex === 0 ? 0.30 : rowIndex === 1 ? 0.15 : 0.0;
  const F = filledCount / total;
  const C = coloredCount / total;
  const U = stringCount / total;

  return (0.60 * B) + T + (0.05 * F) + (0.03 * C) + (0.02 * U);
}
```

#### Column Classification & ColumnDescriptor Interface

```typescript
export interface ColumnDescriptor {
  index: number;
  header: string;
  dataType: 'text' | 'number' | 'date' | 'boolean' | 'mixed';
  alignment: 'left' | 'center' | 'right';
  minWidth: number;          // Typographic points (pt)
  maxWidth: number;          // Typographic points (pt)
  suggestedWidth: number;    // Computed proportional width (pt)
  numberFormat?: 'integer' | 'decimal' | 'currency' | 'percentage';
  dateFormat?: string;
  stats: {
    nullCount: number;
    uniqueValues: number;
    maxLength: number;
  };
}

export interface TableCell {
  value: string | number | boolean | null;
  formattedValue: string;
  alignment: 'left' | 'center' | 'right';
  style?: CellStyle;
}

export interface TableRow {
  cells: TableCell[];
}

export interface TableSection {
  columns: ColumnDescriptor[];
  rows: TableRow[];
  headerStyle: {
    bold: boolean;
    bgColor: string;
    textColor: string;
  };
  alternatingRows: boolean;
}

export interface DocumentSection {
  type: 'table' | 'text' | 'kpi-grid';
  title?: string;
  content: TableSection;
}

export interface LayoutIR {
  documentType: 'table' | 'report' | 'list';
  title?: string;
  sections: DocumentSection[];
  globalStyles: {
    pageSize: 'letter' | 'a4' | 'legal' | 'a3' | 'a5';
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number };
    fontFamily: string;
    baseFontSize: number;
    theme: string;
  };
}

export interface LayoutWorkerAPI {
  analyzeLayout(
    cellIR: CellIR,
    onProgress?: (progress: number) => void
  ): Promise<LayoutIR>;
}
```

---

### 3.3 Typst Worker: PDF Rendering & Document Assembly

#### Typst 0.11+ Context Syntax Generation
The generator produces valid modern Typst syntax, utilizing `context` blocks for dynamic layout information rather than deprecated `locate` methods.

```typescript
export function generateTypstDocument(layout: LayoutIR): string {
  const { globalStyles, sections } = layout;

  return `
#set page(
  paper: "${globalStyles.pageSize}",
  flipped: ${globalStyles.orientation === 'landscape'},
  margin: (
    top: ${globalStyles.margins.top}pt,
    right: ${globalStyles.margins.right}pt,
    bottom: ${globalStyles.margins.bottom}pt,
    left: ${globalStyles.margins.left}pt
  ),
  header: context {
    if here().page() > 1 [
      #grid(
        columns: (1fr, 1fr),
        align(left)[#text(size: 8pt, fill: luma(120))[${escapeTypst(layout.title || sections[0]?.content.columns[0]?.header || '')}]],
        align(right)[#text(size: 8pt, fill: luma(120))[Page #here().page()]]
      )
      #v(2pt)
      #line(length: 100%, stroke: 0.5pt + luma(200))
    ]
  }
)

#set text(
  font: "${globalStyles.fontFamily}",
  size: ${globalStyles.baseFontSize}pt
)

${sections.map(section => generateSection(section)).join('\n\n')}
`;
}

function escapeTypst(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/#/g, '\\#')
    .replace(/\$/g, '\\$')
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*');
}
```

#### PDF Merging with pdf-lib
When processing large multi-section tables or multi-part documents where Typst emits split buffers, `pdf-lib` concatenates the outputs into a single binary.

```typescript
import { PDFDocument } from 'pdf-lib';

export class TypstWorkerAPI {
  async renderPDF(
    layout: LayoutIR,
    onProgress?: (progress: number) => void
  ): Promise<Uint8Array> {
    onProgress?.(0.2);
    const source = generateTypstDocument(layout);

    onProgress?.(0.5);
    const pdfBuffers: Uint8Array[] = await this.compileTypst(source);

    onProgress?.(0.8);
    if (pdfBuffers.length === 1) {
      onProgress?.(1.0);
      return pdfBuffers[0];
    }

    const merged = await this.mergePdfBuffers(pdfBuffers);
    onProgress?.(1.0);
    return merged;
  }

  private async compileTypst(source: string): Promise<Uint8Array[]> {
    // Invoke Typst WASM compilation engine
    return [/* compiled bytes */];
  }

  private async mergePdfBuffers(buffers: Uint8Array[]): Promise<Uint8Array> {
    const mergedDoc = await PDFDocument.create();
    for (const buf of buffers) {
      const doc = await PDFDocument.load(buf);
      const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
      copiedPages.forEach(page => mergedDoc.addPage(page));
    }
    return mergedDoc.save();
  }
}
```

---

## 4. Technology Stack

| Component | Library / Tool | Target Version | Architectural Rationale |
|---|---|---|---|
| **XLSX Ingestion** | `exceljs` | `^4.4.0` | Browser-compatible OpenXML reader supporting cell styles, fills, fonts, and merges (MIT). |
| **CSV Ingestion** | `papaparse` / `csv-parse` | `^5.4.0` | Fast browser-native CSV parser with delimiter sniffing. |
| **Worker Bridge** | `comlink` | `^4.4.1` | Type-safe RPC abstraction replacing raw message handling. |
| **Typography & Layout** | `@myriaddreamin/typst.ts` | `^0.5.0` | WASM-based typesetting engine for deterministic, publication-grade PDFs. |
| **Document Assembly** | `pdf-lib` | `^1.17.1` | In-memory manipulation and merging of PDF page buffers. |
| **Build & Bundling** | `vite` | `^5.4.0` | Fast ESM development & worker bundler with WebAssembly asset integration. |
| **UI Framework** | `react` + `tailwind` + `shadcn/ui` | `^18.3.0` | Declarative UI for interactive document customizer & live preview. |
| **State Management** | `zustand` | `^4.5.0` | Lightweight (3KB) store for upload state, processing queue, layout settings. |
| **Testing** | `vitest` + `playwright` | `^2.1.0` | Unit tests for layout math + visual regression for generated PDFs. |
| **Language Target** | `typescript` | `^5.6.0` | Strict type validation and shared interface schemas. |

---

## 5. Performance Targets & Optimizations

### SLA Targets (Client-Side, Mid-Tier Hardware)
- **1,000 Rows $\times$ 10 Columns**:
  - Parse stage: $\le 450\text{ ms}$
  - Layout analysis: $\le 600\text{ ms}$
  - Typst compilation: $\le 1,200\text{ ms}$
  - **End-to-End Latency: $\le 2.5\text{ s}$**
- **Peak Memory**: $\le 120\text{ MB}$ within Worker instances.

### Optimization Mechanisms
1. **Chunked Processing**: ExcelJS and Layout Workers process records in 250-row chunks to prevent blocking event dispatchers.
2. **Pre-compiled WASM Binary Caching**: The Typst WebAssembly module is compiled once and cached in IndexedDB across conversion sessions.
3. **Optimized Column Metrics**: Text dimension calculations are computed over sample distributions for sets exceeding 500 rows.

---

## 6. Security & Privacy Architecture

### Storage Policy
- **IndexedDB**: Used strictly to cache static assets:
  - Compiled Typst WASM modules.
  - Standard font binaries (e.g., Libertinus Serif, Inter, Roboto).
  - Anonymized layout parameters (column count, width ratios, orientation).
- **Transient Memory**: Raw spreadsheet data, cell contents, formulas, and generated documents reside strictly in transient worker memory and are released upon pipeline completion or error.

### Content Security Policy (CSP)
```text
default-src 'self';
script-src 'self' 'wasm-unsafe-eval';
worker-src 'self' blob:;
style-src 'self' 'unsafe-inline';
connect-src 'self';
img-src 'self' data: blob:;
```

---

## 7. UX Design & Interaction Flow

```
+-------------------------------------------------------------------+
|  Spreadsheet to Intelligent Document Studio                       |
+-------------------------------------------------------------------+
|  [ Drag & Drop .xlsx or .csv here ]                               |
|                                                                   |
|  Status: Analyzing layout heuristics & table boundaries...        |
|  [=========================>                 ] 65%                |
+-------------------------------------------------------------------+
|  Interactive Preview (Page 1 of 3)        |  Document Controls    |
|  +-------------------------------------+  |  Layout Mode:         |
|  | #  | Task Name    | Priority | Status|  |  ( ) Auto (Intelligent)
|  |----+--------------+----------+-------|  |  ( ) Compact          |
|  | 1  | Month-1 Plan | High     | Done  |  |  ( ) Balanced         |
|  | 2  | Review Trap  | Med      | Open  |  |  ( ) Presentation     |
|  +-------------------------------------+  |                       |
|                                           |  Theme:               |
|  [ < Prev ]  Page 1 / 3  [ Next > ]       |  [ Modern Clean   v ] |
|                                           |  Page: [ A4       v ] |
|                                           |  Orient: [ Auto   v ] |
|                                           |                       |
|                                           |  [ Download PDF ]     |
+-------------------------------------------------------------------+
```

### Pipeline State Management
```typescript
export type PipelinePhase = 'idle' | 'parsing' | 'analyzing' | 'rendering' | 'merging' | 'complete' | 'error';

export interface PipelineStatus {
  phase: PipelinePhase;
  percentage: number;
  statusMessage: string;
  error?: string;
}
```

---

## 8. Theme System (5 Core Launch Themes)

1. **Modern Clean**: Clean sans-serif (Inter), subtle borders, soft blue accent (#2563EB), alternating gray rows.
2. **Executive Serif**: Classic serif (Libertinus / Georgia), dark slate headers (#1E293B), warm page tone, thin divider lines.
3. **Compact Ledger**: Monospace-accented, high density, minimal padding, high contrast for maximum paper efficiency.
4. **Emerald Report**: Forest green accents (#059669), rounded table headers, fresh modern aesthetic for dashboards.
5. **Monochrome Pure**: Strict black & white typography, grayscale fills, optimized for 100% crisp laser printing.

---

## 9. Testing & Quality Strategy

### Unit Tests (Vitest)
- **Header Detection Accuracy**: Verify heuristic scoring across variations (bold headers, colored headers, missing top rows).
- **Column Typing**: Test classification across currency, integer, ISO-8601 dates, and mixed columns.
- **Typst Template Escaping**: Validate sanitization of reserved characters (`#`, `$`, `[`, `]`, `\`, `_`, `*`).
- **Regression Test Sheet**: Test the multi-section study planner sheet:
  - Month-wise plan must stay contiguous when it fits.
  - No orphan headings across page breaks.
  - Trailing sections grouped logically.

### End-to-End Tests (Playwright)
- Ingest `.xlsx` and `.csv` files and verify valid binary PDF output.
- Verify explicit failure and error messaging when attempting to parse unsupported formats.
- Visual regression tests on generated PDF page snapshots using `toMatchImageSnapshot`.

---

## 10. Phase 1 MVP Delivery Sequence

1. **Sprint 1: Core Parsing & Intermediate Representation (Cell IR)**
   - Implement ExcelJS workbook parsing in Web Worker.
   - Implement CSV parsing with delimiter detection.
   - Implement Bounding Box Crop and empty space normalization.

2. **Sprint 2: Layout Heuristics & Section Engine (Layout IR)**
   - Implement header detection scoring algorithm ($S = 0.60B + 0.30T + \dots$).
   - Implement column classification and width allocation.
   - Implement multi-section detector (tables, notes, KPI blocks).

3. **Sprint 3: Typst WASM Integration & PDF Pipeline**
   - Integrate `@myriaddreamin/typst.ts` WASM compiler in worker.
   - Implement modern Typst 0.11+ template generator with `context` expressions.
   - Integrate `pdf-lib` for document assembly and multi-chunk merge.

4. **Sprint 4: Interactive Studio UI & 5 Themes**
   - Build drag-and-drop file dropzone with progress indicator.
   - Build interactive document preview with page navigation.
   - Implement 5 launch themes (Modern, Executive, Compact, Emerald, Monochrome).
   - Add export PDF download button.

5. **Sprint 5: Adversarial Regression Testing & Polish**
   - Test adversarial spreadsheets (huge whitespace, merged cells, 30+ columns).
   - Validate regression test: study planner multi-section document.
   - Final audit and documentation.
