# Sheet to Art

Transform messy spreadsheets into beautifully typeset PDF documents with intelligent layout analysis.

## Project Status

**Current Sprint:** Sprint 1 - Core Parsing & Cell IR ✅ **COMPLETE**

### Completed Features
- ✅ XLSX parsing with ExcelJS (cell values, types, styles, merged cells)
- ✅ CSV parsing with PapaParse (auto-delimiter detection, type inference)
- ✅ Web Worker architecture with Comlink RPC
- ✅ Cell Intermediate Representation (Cell IR) type system
- ✅ Comprehensive unit and integration tests (19 tests across 5 test suites)

### Upcoming Sprints
- 🔲 Sprint 2: Layout Heuristics & Section Engine (Layout IR)
- 🔲 Sprint 3: Typst WASM Integration & PDF Pipeline
- 🔲 Sprint 4: Interactive Studio UI & 5 Themes
- 🔲 Sprint 5: Adversarial Regression Testing & Polish

## Quick Start

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open `http://localhost:5173` to access the parser test UI.

### Testing & Build

```bash
# Run all unit and integration tests
npm test

# Build production bundle
npm run build
```

## Architecture

### Sprint 1: Parser Architecture

```
Main Thread (React UI)
       │
       │ Comlink RPC
       ▼
Parser Worker (parser.worker.ts)
       │
       ├──► XLSX Parser (ExcelJS) ──► Cell IR
       │
       └──► CSV Parser (PapaParse) ──► Cell IR
```

### Cell Intermediate Representation (Cell IR)

The Cell IR is a normalized, typed data structure representing the spreadsheet contents:

- **Cell**: Individual cell with `value`, `rawValue`, `type`, `style`, and `position`
- **CellRow**: Array of cells at a specific row index
- **CellIR**: Complete representation with rows and metadata

See `src/types/cell-ir.ts` for full type definitions.

## File Format Support

| Format | Status | Notes |
|--------|--------|-------|
| `.xlsx` | ✅ Supported | OpenXML format with full style extraction |
| `.csv` | ✅ Supported | Auto-delimiter detection (comma, semicolon, tab) |
| `.xls` | ❌ Not Supported | Legacy binary format (convert to `.xlsx`) |

## Tech Stack

- **Build**: Vite 5.4+ with TypeScript 5.6+
- **UI**: React 18.3+
- **XLSX**: ExcelJS 4.4.0 (MIT)
- **CSV**: PapaParse 5.4.0
- **Workers**: Comlink 4.4.1 (type-safe RPC)
- **Testing**: Vitest 2.1+

## Documentation

- [Architectural Specification](docs/superpowers/specs/2026-09-21-spreadsheet-pdf-engine-design.md)
- [Sprint 1 Implementation Plan](docs/superpowers/plans/2026-09-21-sprint-1-parser-cell-ir.md)
- [Project State & Handoff](PROJECT_STATE.md)
- [Worker Architecture](src/workers/README.md)
