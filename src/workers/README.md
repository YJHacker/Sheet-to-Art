# Worker Architecture

This directory contains Web Workers that handle computationally intensive operations off the main thread to maintain 60fps UI responsiveness.

## Workers

### `parser.worker.ts`
Main parser worker entry point. Exposes `ParserWorkerAPI` via Comlink RPC.

**API:**
```typescript
interface ParserWorkerAPI {
  parseFile(
    buffer: ArrayBuffer,
    fileName: string,
    sheetIndex?: number
  ): Promise<CellIR>;
}
```

**Responsibilities:**
- File format detection (`.xlsx`, `.csv`, reject `.xls`)
- Delegate to appropriate parser (XLSX via ExcelJS or CSV via PapaParse)
- Normalized extraction into `CellIR`

### `layout.worker.ts`
Main layout worker entry point. Exposes `LayoutWorkerAPI` via Comlink RPC.

**API:**
```typescript
interface LayoutWorkerAPI {
  analyzeLayout(
    cellIR: CellIR,
    options?: LayoutOptions,
    onProgress?: (progress: number) => void
  ): Promise<LayoutIR>;
}
```

**Responsibilities:**
- Multi-section segmentation (tables, KPI metric grids, text notes)
- Deterministic header detection scoring formula ($S = 0.60B + 0.30T + 0.05F + 0.03C + 0.02U$)
- Column classification, data typing, and alignment inference
- Proportional column width allocation using square-root weighting ($w_j \propto \sqrt{\text{length}_j}$)
- Automatic page orientation optimization and typography scaling

## Communication Protocol

All Web Workers communicate using **Comlink RPC** exclusively with type-safe proxy bridges in `src/lib/workers.ts`.

### Main Thread Usage

```typescript
import { parserWorker, layoutWorker } from './lib/workers';

// 1. Parse spreadsheet into Cell IR
const buffer = await file.arrayBuffer();
const cellIR = await parserWorker.parseFile(buffer, file.name, 0);

// 2. Analyze layout into Layout IR
const layoutIR = await layoutWorker.analyzeLayout(cellIR, { pageSize: 'a4' });
```

## Testing

Workers and layout engines are tested via:
1. **Unit tests**: Individual heuristics, classification, width math, and worker APIs
2. **Integration tests**: End-to-end parse and layout pipeline flows

Run: `npm test`
