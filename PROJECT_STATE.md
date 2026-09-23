# PROJECT STATE & HANDOFF DOCUMENT

**Document Name:** `PROJECT_STATE.md`  
**Created:** 2026-09-21  
**Last Updated:** 2026-09-23  
**Project:** Spreadsheet → Intelligent Document → Beautiful PDF Platform  
**Repository Root:** `/root`  
**Working Directory:** `/root`  
**GitHub Remote:** `git@github.com:YJHacker/Sheet-to-Art.git` (synchronized)  
**Status:** Sprint 1 (Parser & Cell IR), Sprint 2 (Layout Heuristics & Section Engine), and Sprint 3 (Typst WASM Typesetting & PDF Generation) COMPLETE. Tasks 1–8 of Sprint 3 fully implemented and verified. All 80 unit & integration tests passing across 21 test files. TypeScript strict check and production build passing. Ready for Sprint 4.

---

## Sprint 3 Execution Summary (Completed)

- **Task 1: Package Dependencies & Typst Type Definitions** (`package.json`, `src/types/typst.ts`, `tests/unit/typst-types.test.ts`) - Complete
- **Task 2: Typst Syntax Escaper & Sanitizer** (`src/lib/typst/typst-escaper.ts`, `tests/unit/typst-escaper.test.ts`) - Complete
- **Task 3: Theme Configuration & Styling Engine (5 Themes)** (`src/lib/typst/themes.ts`, `tests/unit/typst-themes.test.ts`) - Complete
- **Task 4: Typst Document & Section Generator** (`src/lib/typst/typst-generator.ts`, `tests/unit/typst-generator.test.ts`) - Complete
- **Task 5: PDF Buffer Assembler & Merging with pdf-lib** (`src/lib/typst/pdf-assembler.ts`, `tests/unit/pdf-assembler.test.ts`) - Complete
- **Task 6: Typst WASM Compiler & Engine Bridge** (`src/lib/typst/typst-compiler.ts`, `tests/unit/typst-compiler.test.ts`) - Complete
- **Task 7: Typst Web Worker & Comlink RPC Integration** (`src/workers/typst.worker.ts`, `src/lib/workers.ts`, `tests/unit/typst-worker.test.ts`) - Complete
- **Task 8: End-to-End Spreadsheet-to-PDF Integration Suite** (`tests/integration/pdf-generation-flow.test.ts`) - Complete

### Quality Gates Status:
- **Unit & Integration Tests:** 80 passed across 21 test files (`npm test -- --run`)
- **TypeScript Typecheck:** `npx tsc --noEmit` clean (0 errors)
- **Production Build:** `npm run build` (`tsc && vite build`) successful (0 errors, 3 worker bundles + WASM asset)
- **GitHub Backup:** Ready for push to `git@github.com:YJHacker/Sheet-to-Art.git` master branch

---

## 1. Product Vision

The core product idea is:
> *“Upload a spreadsheet. Let the system understand it, organize it, and turn it into a document that actually makes sense.”*

Unlike standard converters that simply execute a blind "Print to PDF" routine (causing sliced columns, microscopic scaled text, awkward page breaks, and massive dead whitespace), this platform acts as an **intelligent document engine**:
- Understands the semantic structure of messy spreadsheets (tables, KPI grids, notes, schedules).
- Eliminates unnecessary whitespace and keeps related sections together.
- Employs deterministic constraint-based layout algorithms to paginate content efficiently without losing information.
- Typesets output with publication-grade typography (headers, margins, font hierarchies, repeating table headers).
- Runs **100% in the client browser** for complete data privacy.

---

## 2. Completed Research Summary

Four parallel research tracks were executed prior to architecture specification:

1. **XLSX & Spreadsheet Ingestion (`ExcelJS` vs. `SheetJS` vs. `read-excel-file`):**
   - *Findings:* SheetJS Community Edition paywalls cell style extraction (colors, fills, font weights). `read-excel-file` does not extract styles or merges. `ExcelJS` (MIT) is the only free library supporting cell style/color extraction, merged cells, hidden rows/columns, and streaming reader support.
   - *Decision:* Standardized on `ExcelJS` for `.xlsx` and `PapaParse` / `csv-parse` for `.csv`. `.xls` (legacy binary BIFF8) is excluded from MVP.

2. **PDF Generation Engines (`Typst WASM` vs. `jsPDF` vs. `PDFKit` vs. `@react-pdf/renderer` vs. `WeasyPrint`):**
   - *Findings:* Headless Chromium / HTML-to-PDF introduces non-determinism across OS environments and heavy memory footprints. `jsPDF + jspdf-autotable` has good table pagination but basic typography. `Typst` (Rust compiled to WASM via `@myriaddreamin/typst.ts`) provides world-class micro-typography, sub-500ms compilation for 20-page documents, deterministic byte-level builds, and native table pagination with repeating headers.
   - *Decision:* Primary PDF typesetting powered by `Typst WASM`, combined with `pdf-lib` for in-memory page/chunk assembly and merging.

3. **Competitor & Market Analysis:**
   - *Findings:* All major online converters (Smallpdf, iLovePDF, CloudConvert, Gotenberg) perform naive 1:1 headless print conversions. None perform semantic section detection, adaptive table reflow, or intelligent whitespace compaction.
   - *SEO Opportunity:* 40k–60k monthly searches for *"how to fit excel to one page"* and high demand for clean automated report conversion.

4. **Tech Stack & Architecture Options:**
   - *Findings:* A static Single Page Application (SPA) architecture utilizing Web Workers with Comlink RPC ensures 60fps main-thread UI responsiveness and absolute data privacy with zero server hosting costs.

---

## 3. Key Architectural Decisions

1. **Client-Side Worker Pipeline:**
   - **Main Thread:** Handles UI interaction, file dropzone, live canvas/DOM preview, and export triggers.
   - **Parser Worker:** Streams `.xlsx` / `.csv` parsing into a clean, normalized `Cell IR`.
   - **Layout Worker:** Performs structural inference, header detection scoring, data-typing, and column width distribution, emitting `Layout IR`.
   - **Typst Worker:** Generates modern Typst 0.11+ source markup, compiles to PDF via WASM, and assembles final PDF blobs via `pdf-lib`.
2. **Deterministic Layout Over LLM Pagination:**
   - Layout calculation, column sizing, and page break decisions are strictly deterministic mathematical procedures. AI/heuristics are confined to structure classification and metadata extraction.
3. **Data Privacy by Design:**
   - No backend servers, no analytics/telemetry transmitting document data.
   - IndexedDB caching is strictly limited to static WASM binaries, font files, and anonymized layout ratios. User spreadsheet content exists solely in transient worker memory.
4. **Comlink RPC Standardization:**
   - All inter-worker communication is structured via typed Comlink RPC interfaces.

---

## 4. Chosen Technologies & Justifications

| Layer | Technology | Justification |
|---|---|---|
| **Build & Bundler** | `Vite 5+` / `TypeScript 5.6+` | Ultra-fast ESM builds, worker bundling, WASM asset support, strict type safety. |
| **XLSX Parser** | `exceljs (^4.4.0)` | MIT license, extracts font weights, ARGB fills, borders, merged cell coordinates. |
| **CSV Parser** | `papaparse (^5.4.0)` | High-performance, streaming browser CSV parsing with delimiter detection. |
| **Worker Bridge** | `comlink (^4.4.1)` | Type-safe RPC abstraction over Web Workers. |
| **Typesetting & PDF** | `@myriaddreamin/typst.ts (^0.7.0)` | WASM-compiled Typst engine; sub-second compilation, native repeating table headers, pristine typography. |
| **PDF Assembly** | `pdf-lib (^1.17.1)` | Fast in-memory PDF buffer merging, page numbering offsets, and document assembly. |
| **UI Framework** | `React 18+` + `Tailwind CSS` + `Lucide Icons` | Declarative UI state, responsive preview controls, clean modern aesthetic. |
| **Testing** | `Vitest` + `Playwright` | Lightning-fast unit tests for layout math + visual regression tests for PDF snapshots. |

---

## 5. Layout & PDF Generation Engine Design

### 5.1 Pipeline Stages
```
Raw Spreadsheet (.xlsx / .csv)
       │
       ▼ [Parser Worker]
Raw Matrix + Cell Properties + Merges
       │
       ▼ [Normalization]
Clean Bounding-Box Normalized 2D Grid (Cell IR)
       │
       ▼ [Layout Worker - Header Scoring & Type Inference]
Table Section & Column Descriptors (Layout IR)
       │
       ▼ [Typst Worker - Markup Generation]
Typst 0.11+ Code with Context Blocks
       │
       ▼ [Typst WASM Compiler + pdf-lib]
Print-Ready PDF Binary (Uint8Array with %PDF- header)
```

### 5.2 Header Heuristic Formula
Header identification evaluates candidate rows using calibrated weights:
$$S = 0.60B + 0.30T + 0.05F + 0.03C + 0.02U$$
- $B$: Proportion of bold cells
- $T$: Top row position score ($0.30$ for Row 0, $0.15$ for Row 1, $0.00$ for others)
- $F$: Proportion of filled (non-empty) cells
- $C$: Proportion of colored/shaded background cells
- $U$: Proportion of string-typed cells

*Rule:* Row is designated as Table Header when $S \ge 0.85$. A bold top row achieves $S \approx 0.97$.

### 5.3 Column Width Allocation
- Calculates Minimum Content Width (MCW) and Preferred Content Width (PCW).
- Allocates proportional widths using square-root content weighting ($w_j \propto \sqrt{\text{length}_j}$) to prevent multi-line notes from crushing numeric columns.
- Automatic page orientation flip: If table width exceeds portrait limits, automatically switch to `landscape` and elastically compress font scale down to 7.5pt before breaking.

---

## 6. PDF Generation Strategy & Themes

- Modern Typst 0.11+ source generation with `context` blocks for dynamic headers/footers.
- Automatic repeating table headers via `table.header(...)`.
- 5 launch themes:
  1. `modern-clean` (Default sans-serif, blue accent `#2563EB`, subtle slate borders)
  2. `executive-serif` (Classic serif typography, dark slate `#1E293B` header)
  3. `compact-ledger` (High density, monospace-accented, tight padding)
  4. `emerald-report` (Modern dashboard green `#059669`)
  5. `monochrome-pure` (Crisp black & white laser printing)
- Zero external network calls during compilation; 100% offline WASM execution.

---

## 7. Security & Privacy Architecture

- **Execution Environment:** 100% Client-Side. No spreadsheet contents or generated documents are sent to any remote server.
- **Content Security Policy (CSP):** Strict CSP enforcing `connect-src 'self'`, `worker-src 'self' blob:`, and `script-src 'self' 'wasm-unsafe-eval'`.
- **Sanitization:** Input escaping for all Typst markup special characters (`\`, `#`, `$`, `[`, `]`, `*`, `_`, `@`, `<`, `>`, `"`, `~`).

---

## 8. Exact Next Implementation Steps

- **Sprint 4 (Next):** Interactive Studio UI, live PDF preview component, theme switcher, and export controls.
- **Sprint 5 (Planned):** Adversarial spreadsheet fixtures, Playwright visual regression suite, and final polish.
