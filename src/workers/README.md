# Worker Architecture

This directory contains Web Workers that handle computationally expensive parsing operations off the main thread.

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
- Delegate to appropriate parser (XLSX or CSV)
- Error handling and user-friendly error messages

### `xlsx-parser.ts`
ExcelJS-based XLSX parser.

**Function:**
```typescript
parseXLSX(
  buffer: ArrayBuffer,
  fileName: string,
  sheetIndex: number
): Promise<CellIR>
```

**Features:**
- Extract cell values, types (string, number, boolean, date, formula, empty)
- Extract styles (bold, italic, font size, text/background colors, alignment, number format)
- Handle merged cells (single cell at top-left position, not duplicated)
- Strip formulas, preserve cached display values
- Handle rich text, hyperlinks, formula errors

### `csv-parser.ts`
PapaParse-based CSV parser.

**Function:**
```typescript
parseCSV(
  buffer: ArrayBuffer,
  fileName: string
): Promise<CellIR>
```

**Features:**
- Auto-detect delimiter (comma, semicolon, tab)
- Infer cell types (string, number, boolean, date, empty)
- Handle inconsistent column counts (normalize to max)
- UTF-8 text decoding

## Communication Protocol

All Workers use **Comlink RPC** exclusively.

### Main Thread Usage

```typescript
import { parserWorker } from './lib/workers';

const buffer = await file.arrayBuffer();
const cellIR = await parserWorker.parseFile(buffer, file.name, 0);
```

## Testing

Workers are tested via:
1. **Unit tests**: Direct function calls to `parseXLSX` and `parseCSV`
2. **Worker API tests**: Full format detection and error handling
3. **Integration tests**: End-to-end parse flow and performance verification

Run: `npm test`
