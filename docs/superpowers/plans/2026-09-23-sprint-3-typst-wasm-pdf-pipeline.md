# Sprint 3: Typst WASM Typesetting & PDF Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Typst typesetting and PDF generation pipeline that transforms `LayoutIR` into publication-grade PDF documents using modern Typst 0.11+ markup, `@myriaddreamin/typst.ts` WASM compilation, and `pdf-lib` document assembly inside a dedicated Web Worker.

**Architecture:** Client-side Web Worker architecture with Comlink RPC. The Typst worker translates `LayoutIR` (sections, tables, KPI grids, column widths, data types, styles) into optimized Typst 0.11+ source markup with `context` expressions, compiles it to PDF bytes via WASM, and assembles/merges buffers using `pdf-lib` with zero server transmission.

**Tech Stack:**
- `@myriaddreamin/typst.ts` ^0.7.0 (WASM Typst compiler & renderer)
- `pdf-lib` ^1.17.1 (in-memory PDF buffer manipulation and multi-part merging)
- `comlink` ^4.4.1 (type-safe Web Worker RPC)
- `typescript` ^5.6.0 (strict type safety)
- `vitest` ^2.1.0 (unit and integration tests)

**Spec:** `docs/superpowers/specs/2026-09-21-spreadsheet-pdf-engine-design.md`

---

## Global Constraints

- Node.js >= 20.x (v20.20.2)
- TypeScript strict mode enabled (`strict: true`, `noUncheckedIndexedAccess: true`)
- All file paths use forward slashes (`/`)
- Web Worker communication uses Comlink RPC exclusively
- Typst code generation must strictly adhere to modern Typst 0.11+ syntax (`context` blocks for dynamic headers/footers; no legacy `locate` methods)
- Input escaping: all dynamic user content must be sanitized via `escapeTypst()` for Typst reserved characters (`\`, `[`, `]`, `#`, `$`, `_`, `*`, `@`, `<`, `>`, `"`)
- 5 launch themes must be supported: `modern-clean`, `executive-serif`, `compact-ledger`, `emerald-report`, `monochrome-pure`
- Zero external network requests during PDF compilation (100% client-side execution)
- Return clean `Uint8Array` PDF buffers with `%PDF-` binary magic header

---

## File Structure

```
/root/
├── src/
│   ├── types/
│   │   ├── cell-ir.ts                       # Cell IR type definitions (Sprint 1)
│   │   ├── layout-ir.ts                     # Layout IR type definitions (Sprint 2)
│   │   └── typst.ts                         # Typst & PDF generation type definitions (Sprint 3)
│   ├── lib/
│   │   ├── workers.ts                       # Worker bridge (Parser + Layout + Typst)
│   │   ├── layout/                          # Layout heuristics engine (Sprint 2)
│   │   └── typst/
│   │       ├── typst-escaper.ts             # Typst syntax character sanitizer
│   │       ├── themes.ts                    # 5 theme definitions (colors, fonts, strokes)
│   │       ├── typst-generator.ts           # LayoutIR -> Typst 0.11+ markup generator
│   │       ├── pdf-assembler.ts             # pdf-lib buffer merging & metadata
│   │       └── typst-compiler.ts            # @myriaddreamin/typst.ts WASM compiler wrapper
│   └── workers/
│       ├── parser.worker.ts                 # Parser worker (Sprint 1)
│       ├── layout.worker.ts                 # Layout worker (Sprint 2)
│       └── typst.worker.ts                  # Web Worker exposing TypstWorkerAPI via Comlink
└── tests/
    ├── unit/
    │   ├── typst-types.test.ts              # Typst type validation
    │   ├── typst-escaper.test.ts            # Escaper unit tests
    │   ├── typst-themes.test.ts             # Theme configuration unit tests
    │   ├── typst-generator.test.ts          # Markup generation unit tests
    │   ├── pdf-assembler.test.ts            # pdf-lib merging unit tests
    │   ├── typst-compiler.test.ts           # Typst WASM compilation unit tests
    │   └── typst-worker.test.ts             # Typst worker Comlink RPC unit tests
    └── integration/
        └── pdf-generation-flow.test.ts      # End-to-end: XLSX/CSV -> Parser -> Layout -> Typst -> PDF
```

---

## Tasks

### Task 1: Package Dependencies & Typst Type Definitions

**Files:**
- Modify: `package.json`
- Create: `src/types/typst.ts`
- Test: `tests/unit/typst-types.test.ts`

**Interfaces:**
- Consumes: `LayoutIR`, `GlobalStyles`, `DocumentSection` from `src/types/layout-ir.ts`
- Produces: `ThemeDefinition`, `ThemeName`, `TypstGeneratorOptions`, `TypstWorkerAPI`, `PDFRenderResult`

- [x] **Step 1: Install dependencies (`pdf-lib`, `@myriaddreamin/typst.ts`)**
- [x] **Step 2: Write the failing test (`tests/unit/typst-types.test.ts`)**
- [x] **Step 3: Write minimal implementation (`src/types/typst.ts`)**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 2: Typst Syntax Escaper & Sanitizer

**Files:**
- Create: `src/lib/typst/typst-escaper.ts`
- Test: `tests/unit/typst-escaper.test.ts`

**Interfaces:**
- Produces: `escapeTypst(text: string): string`, `escapeTypstString(text: string): string`

- [x] **Step 1: Write the failing test (`tests/unit/typst-escaper.test.ts`)**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Write minimal implementation (`src/lib/typst/typst-escaper.ts`)**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 3: Theme Configuration & Styling Engine

**Files:**
- Create: `src/lib/typst/themes.ts`
- Test: `tests/unit/typst-themes.test.ts`

**Interfaces:**
- Consumes: `ThemeDefinition`, `ThemeName` from `src/types/typst.ts`
- Produces: `THEMES: Record<ThemeName, ThemeDefinition>`, `getTheme(name?: string): ThemeDefinition`

- [x] **Step 1: Write the failing test (`tests/unit/typst-themes.test.ts`)**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Write minimal implementation with 5 themes (`src/lib/typst/themes.ts`)**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 4: Typst Document & Section Generator

**Files:**
- Create: `src/lib/typst/typst-generator.ts`
- Test: `tests/unit/typst-generator.test.ts`

**Interfaces:**
- Consumes: `LayoutIR`, `TableSection`, `KpiGridContent`, `TextSectionContent` from `src/types/layout-ir.ts`
- Produces: `generateTypstDocument(layout: LayoutIR, options?: TypstGeneratorOptions): string`

- [x] **Step 1: Write the failing test (`tests/unit/typst-generator.test.ts`)**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Write minimal implementation (`src/lib/typst/typst-generator.ts`)**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 5: PDF Buffer Assembler & Merging with `pdf-lib`

**Files:**
- Create: `src/lib/typst/pdf-assembler.ts`
- Test: `tests/unit/pdf-assembler.test.ts`

**Interfaces:**
- Produces: `mergePdfBuffers(buffers: Uint8Array[]): Promise<Uint8Array>`, `getPDFPageCount(buffer: Uint8Array): Promise<number>`

- [x] **Step 1: Write the failing test (`tests/unit/pdf-assembler.test.ts`)**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Write minimal implementation (`src/lib/typst/pdf-assembler.ts`)**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 6: Typst WASM Compiler & Engine Bridge

**Files:**
- Create: `src/lib/typst/typst-compiler.ts`
- Test: `tests/unit/typst-compiler.test.ts`

**Interfaces:**
- Produces: `compileTypstToPDF(source: string): Promise<Uint8Array>`, `initTypstEngine(): Promise<void>`

- [x] **Step 1: Write the failing test (`tests/unit/typst-compiler.test.ts`)**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Write minimal implementation (`src/lib/typst/typst-compiler.ts`)**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 7: Typst Web Worker & Comlink RPC Integration

**Files:**
- Create: `src/workers/typst.worker.ts`
- Modify: `src/lib/workers.ts`
- Test: `tests/unit/typst-worker.test.ts`

**Interfaces:**
- Consumes: `LayoutIR` from `src/types/layout-ir.ts`, `TypstWorkerAPI` from `src/types/typst.ts`
- Produces: `typstWorker` in `src/lib/workers.ts`

- [x] **Step 1: Write the failing test (`tests/unit/typst-worker.test.ts`)**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Write minimal implementation (`src/workers/typst.worker.ts`, `src/lib/workers.ts`)**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 8: End-to-End Spreadsheet-to-PDF Integration Test Suite

**Files:**
- Create: `tests/integration/pdf-generation-flow.test.ts`

**Interfaces:**
- Tests full pipeline: Raw XLSX/CSV ArrayBuffer -> Parser Worker (`CellIR`) -> Layout Worker (`LayoutIR`) -> Typst Worker -> Valid PDF (`Uint8Array`)

- [x] **Step 1: Write integration tests (`tests/integration/pdf-generation-flow.test.ts`)**
- [x] **Step 2: Run integration tests to verify they pass**
- [x] **Step 3: Run full test suite (`npm test -- --run`) and TypeScript typecheck (`npx tsc --noEmit`)**
- [x] **Step 4: Commit**
