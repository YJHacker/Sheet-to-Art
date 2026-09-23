# Sheet to Art

Transform messy spreadsheets into beautifully typeset PDF documents with deterministic layout intelligence and client-side typesetting.

> **Product Vision:** Upload a spreadsheet. Let the system understand its semantic structure, organize sections, allocate column geometry, and typeset a publication-grade document—100% in the client browser with complete privacy.

---

## Project Status

- **Sprint 1: Core Parsing & Cell IR** ✅ **COMPLETE**
- **Sprint 2: Layout Heuristics & Section Engine** ✅ **COMPLETE**
- **Sprint 3: Typst WASM Typesetting & PDF Generation** ✅ **COMPLETE** (Tasks 1–8)
- **Sprint 4: Interactive Studio UI & 5 Themes** 🔲 **NEXT**
- **Sprint 5: Adversarial Regression Testing & Polish** 🔲 Planned

### Implemented Capabilities (Sprints 1, 2 & 3)

#### 1. Ingestion & Cell IR (Sprint 1)
- **XLSX Parser (`ExcelJS`):** Style extraction (bold, italic, font size, fills, borders, number formats, alignments), merged cell geometry, formula caching.
- **CSV Parser (`PapaParse`):** Delimiter auto-detection, UTF-8 decoding, type inference.
- **Parser Web Worker:** Off-thread processing with Comlink RPC bridge.
- **Cell Intermediate Representation (`CellIR`):** 2D normalized cell grid with position and style metadata.

#### 2. Layout Heuristics & Section Engine (Sprint 2)
- **Layout IR Type System (`LayoutIR`):** Strongly-typed multi-section document model (`TableSection`, `KpiGridContent`, `TextSectionContent`).
- **Deterministic Header Scoring:** Calibrated formula evaluating candidate rows:
  $$S = 0.60B + 0.30T + 0.05F + 0.03C + 0.02U$$
  *(Threshold $S \ge 0.85$ identifies header rows vs. title banners).*
- **Column Classification & Data Typing:** Automatic inference of `number` (integer/decimal/currency/percent), `date`, `boolean`, `text`, and `mixed` types with semantic alignment rules.
- **Proportional Column Width Allocation:** Square-root content length weighting ($w_j \propto \sqrt{\text{length}_j}$) prevents wide text columns from compressing numeric data.
- **Page Geometry Optimizer:** Dynamic orientation switching (`portrait` / `landscape`) and font scale compression (down to 7.5pt) for wide spreadsheets.
- **Multi-Section Detector:** Segmenting sheets into title banners, primary tables, KPI summary cards, and trailing explanatory notes.
- **Layout Web Worker & Comlink RPC:** Fully decoupled Web Worker with progress callbacks and main-thread fallback bridges.

#### 3. Typst WASM Typesetting & PDF Generation (Sprint 3)
- **Typst 0.11+ Source Generator:** Translates `LayoutIR` into modern Typst markup with `context` blocks for dynamic headers/footers, repeating `table.header(...)`, styled KPI cards, and note blocks.
- **Syntax Escaper & Sanitizer:** Comprehensive character sanitizer escaping `\`, `[`, `]`, `#`, `$`, `_`, `*`, `@`, `<`, `>`, `"`, `~`.
- **5 Core Launch Themes:**
  1. `modern-clean` (Default sans-serif, blue accent `#2563EB`, subtle slate borders)
  2. `executive-serif` (Classic serif typography, dark slate `#1E293B` header)
  3. `compact-ledger` (High density, monospace-accented, tight padding)
  4. `emerald-report` (Modern dashboard green `#059669`)
  5. `monochrome-pure` (Crisp black & white laser printing)
- **In-Memory PDF Assembler (`pdf-lib`):** Merging multi-section PDF buffers, extracting page counts, stamping document metadata.
- **Typst WASM Compiler Wrapper (`@myriaddreamin/typst.ts`):** 100% offline, zero-network WASM compilation yielding clean `Uint8Array` PDF buffers with `%PDF-` binary magic headers.
- **Typst Web Worker & Comlink RPC:** Offloaded typesetting pipeline in dedicated worker.
- **End-to-End PDF Integration Suite:** Validated end-to-end pipeline from raw file buffer to valid multi-page PDF output across all themes.

---

## Architecture

```
Raw Spreadsheet (.xlsx / .csv)
       │
       ▼ [Parser Worker - Comlink RPC]
Raw Matrix + Cell Properties + Merged Cells
       │
       ▼ [Normalization]
Clean Bounding-Box Normalized 2D Grid (Cell IR)
       │
       ▼ [Layout Worker - Comlink RPC]
Header Scoring Heuristics + Section Segmentation + Geometry Optimization
       │
       ▼ [Layout IR Output]
Structured Document Sections (Tables, KPI Grids, Notes) & Page Styles
       │
       ▼ [Typst Worker - Comlink RPC]
Typst 0.11+ Markup + Typst WASM Compilation + pdf-lib ──► Publication-Grade PDF
```

### Privacy & Security
- **100% Client-Side:** Zero file data or document content leaves the browser.
- **Zero Network Dependency:** No external API or remote font calls during layout or PDF computation.
- **Sandboxed Execution:** Multi-threaded computation isolated in Web Workers.

---

## Quality Gates & Verification

- **Tests:** 80 passing tests across 21 test files (`Vitest`)
  - Unit tests: Cell IR, XLSX parser, CSV parser, Layout IR, Header detector, Column classifier, Column width allocator, Section detector, Layout engine, Parser worker, Layout worker, Typst types, Typst escaper, Typst themes, Typst generator, PDF assembler, Typst compiler, Typst worker.
  - Integration tests: End-to-end parse flow, end-to-end layout flow, end-to-end PDF generation flow.
- **Strict TypeScript:** `npx tsc --noEmit` clean with `strict: true` and `noUncheckedIndexedAccess: true`.
- **Production Build:** Vite production bundle with separate worker chunks verified.

---

## Quick Start

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Test Suite & Production Build

```bash
# Run full unit and integration test suite
npm test -- --run

# Strict TypeScript type check
npx tsc --noEmit

# Build production bundle
npm run build
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Bundler & Tooling** | Vite 5.4+, TypeScript 5.6+ |
| **Worker RPC Bridge** | Comlink 4.4+ |
| **Spreadsheet Ingestion** | ExcelJS 4.4+ (XLSX), PapaParse 5.4+ (CSV) |
| **Layout & Heuristic Engine** | Custom deterministic TypeScript layout orchestrator |
| **Typesetting & PDF Engine** | `@myriaddreamin/typst.ts` (Typst 0.11+ WASM), `pdf-lib` |
| **Testing** | Vitest 2.1+ |

---

## Documentation Links

- [Architectural Specification](docs/superpowers/specs/2026-09-21-spreadsheet-pdf-engine-design.md)
- [Sprint 1 Plan](docs/superpowers/plans/2026-09-21-sprint-1-parser-cell-ir.md)
- [Sprint 2 Plan](docs/superpowers/plans/2026-09-22-sprint-2-layout-heuristics-section-engine.md)
- [Sprint 3 Plan](docs/superpowers/plans/2026-09-23-sprint-3-typst-wasm-pdf-pipeline.md)
- [Project State & Handoff](PROJECT_STATE.md)
- [Worker Architecture Guide](src/workers/README.md)
