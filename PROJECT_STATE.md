# PROJECT STATE & HANDOFF DOCUMENT

**Document Name:** `PROJECT_STATE.md`  
**Created:** 2026-09-21  
**Last Updated:** 2026-09-23  
**Project:** Spreadsheet → Intelligent Document → Beautiful PDF Platform  
**Repository Root:** `/root`  
**Working Directory:** `/root`  
**GitHub Remote:** `git@github.com:YJHacker/Sheet-to-Art.git` (synchronized)  
**Status:** Sprint 1 (Parser & Cell IR) and Sprint 2 (Layout Heuristics & Section Engine) COMPLETE. Tasks 1–8 fully implemented and verified. All 46 unit & integration tests passing. TypeScript strict check and production build passing. Ready for Sprint 3.

---

## Sprint 2 Execution Summary (Completed)

- **Task 1: Layout IR Type Definitions** (`src/types/layout-ir.ts`, `tests/unit/layout-ir.test.ts`) - Complete
- **Task 2: Header Scoring Heuristic Engine** (`src/lib/layout/header-detector.ts`, `tests/unit/header-detector.test.ts`) - Complete
- **Task 3: Column Classification & Type Inference** (`src/lib/layout/column-classifier.ts`, `tests/unit/column-classifier.test.ts`) - Complete
- **Task 4: Column Width Allocation & Page Geometry** (`src/lib/layout/column-width-allocator.ts`, `tests/unit/column-width-allocator.test.ts`) - Complete
- **Task 5: Section Detector & Segmentation** (`src/lib/layout/section-detector.ts`, `tests/unit/section-detector.test.ts`) - Complete
- **Task 6: Layout Engine Orchestrator** (`src/lib/layout/layout-engine.ts`, `tests/unit/layout-engine.test.ts`) - Complete
- **Task 7: Layout Web Worker & Comlink RPC** (`src/workers/layout.worker.ts`, `src/lib/workers.ts`, `tests/unit/layout-worker.test.ts`) - Complete
- **Task 8: End-to-End Layout Integration Test Suite** (`tests/integration/layout-flow.test.ts`) - Complete

### Quality Gates Status:
- **Unit & Integration Tests:** 46 passed across 13 test files (`npm test -- --run`)
- **TypeScript Typecheck:** `npx tsc --noEmit` clean (0 errors)
- **Production Build:** `npm run build` (`tsc && vite build`) successful (0 errors, 4 assets bundled)
- **GitHub Backup:** Pushed to `git@github.com:YJHacker/Sheet-to-Art.git` master branch

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
| **Typesetting & PDF** | `@myriaddreamin/typst.ts (^0.5.0)` | WASM-compiled Typst engine; sub-second compilation, native repeating table headers, pristine typography. |
| **PDF Assembly** | `pdf-lib (^1.17.1)` | Fast in-memory PDF buffer merging, page numbering offsets, and document assembly. |
| **UI Framework** | `React 18+` + `Tailwind CSS` + `Lucide Icons` | Declarative UI state, responsive preview controls, clean modern aesthetic. |
| **State Management** | `Zustand (^4.5.0)` | Minimal 3KB store for upload state, progress tracking, and theme/layout parameters. |
| **Testing** | `Vitest` + `Playwright` | Lightning-fast unit tests for layout math + visual regression tests for PDF snapshots. |

---

## 5. Layout Engine Design

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
Print-Ready PDF Binary
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

## 6. PDF Generation Strategy

- Generates clean Typst source code utilizing modern Typst 0.11+ `context` syntax (replacing deprecated `locate` closures):
  ```typst
  header: context {
    if here().page() > 1 [
      #grid(columns: (1fr, 1fr), align(left)[#text(size: 8pt)[Title]], align(right)[#text(size: 8pt)[Page #here().page()]])
      #v(2pt)
      #line(length: 100%, stroke: 0.5pt + luma(200))
    ]
  }
  ```
- Handles multi-table / multi-section splitting via Typst native table page breaks.
- Uses `pdf-lib` to stitch multi-section PDF byte streams into a unified document blob when necessary.

---

## 7. UI & Theme Decisions

### 7.1 UX Interaction Flow
1. **Dropzone:** Minimalist drag-and-drop file uploader accepting `.xlsx` and `.csv`.
2. **Analysis Progress:** Granular progress stages (*Parsing Workbook → Detecting Sections → Optimizing Columns → Typesetting PDF*).
3. **Interactive Studio:** Side-by-side view with live interactive document preview (page navigation) and controls (layout mode, theme, page format, orientation).
4. **Export:** One-click download of the generated PDF document.

### 7.2 Five Core Launch Themes
1. **Modern Clean:** Sans-serif (Inter), subtle borders, soft blue accent (`#2563EB`), alternating light gray rows.
2. **Executive Serif:** Classic serif typography (Libertinus/Georgia), dark slate headers (`#1E293B`), warm paper tone.
3. **Compact Ledger:** Monospace-accented, high density, tight padding, maximum paper efficiency.
4. **Emerald Report:** Forest green accents (`#059669`), modern dashboard table styling.
5. **Monochrome Pure:** High-contrast black & white styling optimized for crisp laser printing.

---

## 8. Security & Privacy Architecture

- **Execution Environment:** 100% Client-Side. No spreadsheet contents or generated documents are sent to any remote server.
- **Content Security Policy (CSP):** Strict CSP enforcing `connect-src 'self'`, `worker-src 'self' blob:`, and `script-src 'self' 'wasm-unsafe-eval'`.
- **Storage Boundaries:** IndexedDB stores only immutable WASM binaries and fonts. Zero PII / cell values in persistent storage.
- **Sanitization:** Input escaping for Typst markup special characters (`\`, `#`, `$`, `[`, `]`, `*`, `_`).

---

## 9. Testing Strategy

1. **Unit Testing (Vitest):**
   - Header heuristic scoring across edge cases (all-numeric data, missing headers, multi-level headers).
   - Column typing accuracy (currency, percentage, ISO dates, mixed data).
   - Column width allocation and constraint boundary math.
   - Typst markup escaping and sanitization.
2. **Visual & Regression Testing (Playwright):**
   - **Critical Regression Test:** Multi-section study planner sheet (Month-wise plan contiguous, no orphaned headers, grouped trailing notes).
   - Adversarial sheets: Merged cells, 30+ columns, empty rows/columns, formula errors (`#DIV/0!`, `#N/A`).
   - PDF snapshot comparison using `pdf-img-convert` + `toMatchImageSnapshot`.

---

## 10. MVP Scope Boundaries

### In-Scope for Phase 1 MVP
- `.xlsx` and `.csv` parsing.
- Automated single-sheet structure and table detection.
- Deterministic column width allocation and header detection.
- A4, Letter, Legal, A3, A5 page sizes with Portrait / Landscape / Auto-orientation.
- 5 launch themes.
- Interactive live preview in browser.
- One-click PDF download.
- Full regression suite with adversarial spreadsheets.

### Deferred to Phase 2
- Multi-sheet tab selector / combined multi-sheet PDF generation.
- Natural language editing commands ("Fix this page", "Fit into 2 pages").
- Embedded image and chart object extraction.
- User accounts, saved documents, and cloud sync.

---

## 11. Unresolved Decisions / Future Options
1. **Multi-Sheet Default:** In MVP, default to active/first non-empty sheet with a basic tab switcher, deferring complex multi-sheet merged document chapters to Phase 2.
2. **WASM Preloading vs. Lazy Loading:** Initial WASM binary (~800KB compressed) can be preloaded during idle browser time after landing page load, or lazy-loaded on file drop.

---

## 12. Important File Paths

- **Architectural Spec:** `/root/docs/superpowers/specs/2026-09-21-spreadsheet-pdf-engine-design.md`
- **Project Handoff:** `/root/PROJECT_STATE.md`
- **Project Instructions:** `/root/CLAUDE.md`

---

## 13. Exact Next Implementation Steps

When ready to proceed to implementation, follow the approved sprint sequence:
1. **Step 1:** Invoke the `superpowers:writing-plans` skill to generate the detailed step-by-step implementation plan based on the architectural specification.
2. **Step 2 (Sprint 1):** Initialize project scaffold (Vite + React + TypeScript + Tailwind) and implement Core Parsing & `Cell IR` (Web Worker with ExcelJS & CSV parser).
3. **Step 3 (Sprint 2):** Implement Layout Worker with Header Scoring heuristic, column typing, and `Layout IR` builder.
4. **Step 4 (Sprint 3):** Implement Typst Worker with `@myriaddreamin/typst.ts` WASM compilation, Typst 0.11+ template generator, and `pdf-lib` assembly.
5. **Step 5 (Sprint 4):** Build Interactive Studio UI, live preview component, and 5 launch themes.
6. **Step 6 (Sprint 5):** Build adversarial spreadsheet test fixtures, regression suite, and E2E verification.
