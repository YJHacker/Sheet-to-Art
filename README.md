# Sheet to Art

Transform messy spreadsheets into beautifully typeset PDF documents with deterministic layout intelligence and client-side typesetting.

> **Product Vision:** Upload a spreadsheet. Let the system understand its semantic structure, organize sections, allocate column geometry, and typeset a publication-grade document—100% in the client browser with complete privacy.

---

## Project Status

- **Sprint 1: Core Parsing & Cell IR** ✅ **COMPLETE & ENHANCED**
- **Sprint 2: Layout Heuristics & Section Engine** ✅ **COMPLETE & ENHANCED**
- **Sprint 3: Typst WASM Typesetting & PDF Generation** ✅ **COMPLETE & ENHANCED**
- **Sprint 4: Interactive Studio UI, Multi-Sheet & Persistence** ✅ **COMPLETE & VERIFIED**
- **Sprint 5: Preset Templates, Batch Multi-Sheet Export & Polish** 🔲 Planned

### Implemented Capabilities (Sprints 1–4)

#### 1. Ingestion & Cell IR (Sprint 1)
- **XLSX Parser (`ExcelJS`):** Style extraction (bold, italic, font size, ARGB fills, borders, number formats, alignments), merged cell geometry, formula caching, trailing whitespace trimming.
- **Multi-Sheet Workbook Discovery:** Metadata discovery (`extractSheetsMetadata`) extracting sheet names, dimensions, index, and hidden flags across multi-sheet workbooks.
- **CSV Parser (`PapaParse`):** Delimiter auto-detection, UTF-8 decoding, type inference.
- **Parser Web Worker:** Off-thread processing with Comlink RPC bridge and cloned `ArrayBuffer` buffer slices (`buffer.slice(0)`) to prevent detachment.
- **Cell Intermediate Representation (`CellIR`):** 2D normalized cell grid with position, styling, and semantic metadata.

#### 2. Layout Heuristics & Section Engine (Sprint 2)
- **Layout IR Type System (`LayoutIR`):** Strongly-typed multi-section document model (`TableSection`, `KpiGridContent`, `TextSectionContent`).
- **Semantic Section Detector (`section-detector.ts`):** Prevents multi-table collapse on complex sheets by segmenting into distinct typed sections (Tables, KPI Cards, Callout Notes).
- **Deterministic Header Scoring:** Calibrated formula evaluating candidate rows:
  $$S = 0.60B + 0.30T + 0.05F + 0.03C + 0.02U$$
  *(Threshold $S \ge 0.85$ identifies header rows vs. title banners).*
- **Column Classification & Data Typing (`column-classifier.ts`):** Proportional column width allocation based on content density and automatic inference of `number`, `date`, `boolean`, `text`, and `mixed` types with semantic alignment rules.
- **Proportional Column Width Allocation:** Square-root content length weighting ($w_j \propto \sqrt{\text{length}_j}$) prevents wide text columns from compressing numeric data.
- **Page Geometry Optimizer:** Dynamic orientation switching (`portrait` / `landscape`) and font scale compression (down to 7.5pt) for wide spreadsheet layouts.
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
- **Vector Glyph Post-Processor:** Post-processes vector SVG glyphs (`fill: var(--glyph_fill, inherit)`, `stroke: var(--glyph_stroke, none)`) ensuring crisp rendering across all browsers.
- **In-Memory PDF Assembler (`pdf-lib`):** Merging multi-section PDF buffers, extracting page counts, stamping document metadata.
- **Typst WASM Compiler Wrapper (`@myriaddreamin/typst.ts`):** 100% offline, zero-network WASM compilation yielding clean `Uint8Array` PDF buffers and page SVG vector previews.
- **Typst Web Worker & Comlink RPC:** Offloaded typesetting pipeline in dedicated worker.

#### 4. Interactive Studio UI, Multi-Sheet Workspace & Persistence (Sprint 4)
- **Interactive Studio Workspace (`StudioLayout.tsx`):** Split-pane reactive workspace with Header, Sidebar, Toolbar, and Preview Viewport.
- **Multi-Sheet Navigation:** Interactive tab bar in Header and sidebar sheet selector with instantaneous re-compilation and buffer persistence.
- **Dual Preview Modes:** Seamless toggling between Vector PDF View (WASM typeset) and Document View (semantic HTML).
- **Persistence & Auto-Restore:** IndexedDB caching for active workbook buffer and user customization options with automatic restoration on page reload.
- **Live Theme & Layout Customization:** Live switching across all 5 themes, page size (A4, Letter, Legal, A3, A5), orientation (Auto, Portrait, Landscape), margins, and font scaling.
- **Export Flow & Download Utility:** Same-origin Blob download modal with custom filename support and native print triggers.
- **Mobile Responsive Workspace:** Responsive drawer navigation and horizontal theme carousel for touch devices with 44px+ touch targets.

---

## Architecture

```
Raw Spreadsheet (.xlsx / .csv)
       │
       ▼ [Parser Worker - Comlink RPC]
Raw Matrix + Cell Properties + Merged Cells + Multi-Sheet Discovery
       │
       ▼ [Normalization & Section Detection]
Clean Bounding-Box Normalized 2D Grid (Cell IR) & Semantic Sections
       │
       ▼ [Layout Worker - Comlink RPC]
Header Scoring Heuristics + Section Segmentation + Geometry Optimization
       │
       ▼ [Layout IR Output]
Structured Document Sections (Tables, KPI Grids, Notes) & Page Styles
       │
       ▼ [Typst Worker - Comlink RPC]
Typst 0.11+ Markup + Typst WASM Compilation + Vector Glyph Post-Processing ──► Publication-Grade PDF & Vector SVG
```

### Privacy & Security
- **100% Client-Side:** Zero file data or document content leaves the browser.
- **Zero Network Dependency:** No external API or remote font calls during layout or PDF computation.
- **Sandboxed Execution:** Multi-threaded computation isolated in Web Workers.

---

## Quality Gates & Verification

- **Tests:** 170 passing tests across 39 test files (`Vitest`)
  - Unit tests: Studio store, Preview viewport, Typst generator, Section detector, XLSX parser, Sidebar controls, Document pipeline, Persistence, UI primitives, Header detector, Column width allocator, Dropzone, Typst compiler, Layout engine, Column classifier, Export flow, Typst themes, Layout IR, CSV parser, PDF assembler, Sample data, Theme selector, Typst escaper, Cell IR, Parser worker, Layout worker, Typst worker, Typst types.
  - Integration tests: GATE 2027 end-to-end acceptance, GATE 2027 data fidelity (all 7 sheets), Product core acceptance, PDF generation flow, Studio UI flow, Mobile responsiveness, Parse flow, Layout flow, Persistence auto-restore flow, GATE 2027 studio UI flow.
- **Strict TypeScript:** `npx tsc --noEmit` clean with `strict: true` and `noUncheckedIndexedAccess: true` (0 errors).
- **Production Build:** `npm run build` cleanly bundles main app, 3 Web Worker chunks, WASM modules, and CSS assets.

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
