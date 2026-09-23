# Sprint 2: Layout Heuristics & Section Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Layout Worker and deterministic heuristic engine that transforms `CellIR` into `LayoutIR`, performing header scoring, column classification, width allocation, and multi-section segmentation (tables, KPI grids, notes).

**Architecture:** Web Worker-based layout analysis using Comlink RPC. The layout engine applies deterministic mathematical heuristics (calibrated header detection formula $S = 0.60B + 0.30T + 0.05F + 0.03C + 0.02U$, data-type inference, square-root column width allocation, and whitespace-aware section splitting) to construct a structured `LayoutIR` without server roundtrips or non-deterministic LLM calls.

**Tech Stack:**
- `typescript` ^5.6.0 (strict type checking)
- `comlink` ^4.4.1 (type-safe Web Worker RPC)
- `vitest` ^2.1.0 (unit and integration testing)

**Spec:** `docs/superpowers/specs/2026-09-21-spreadsheet-pdf-engine-design.md`

---

## Global Constraints

- Node.js >= 20.x (v20.20.2)
- TypeScript strict mode enabled (`strict: true`, `noUncheckedIndexedAccess: true`)
- All file paths use forward slashes (`/`)
- Web Worker communication uses Comlink RPC exclusively
- Header scoring formula must strictly follow $S = 0.60B + 0.30T + 0.05F + 0.03C + 0.02U$ with threshold $S \ge 0.85$
- Column width distribution uses square-root content weighting ($w_j \propto \sqrt{\text{length}_j}$) with min/max clamping
- Page orientation automatically switches from portrait to landscape if total content width exceeds printable portrait width
- Zero external network requests during layout computation (100% client-side execution)
- Memory allocation: process rows efficiently without duplicating full sheet cell matrices

---

## Review Focus

1. **Title vs. Table Header Confusion**: A top row with a single merged string (e.g., "Q3 Financial Report") must be classified as a Document Title rather than a 1-column table header, allowing the true table header on row 1 or 2 to be identified.
2. **Mixed Type Columns with Notes or Totals**: A column with mostly numbers and a few text cells (e.g. "N/A", "TBD", "Total: $1,200") must be classified with appropriate alignment (numeric/right) and formatted values without throwing runtime errors.
3. **Empty / Sparse Columns inside Tables**: A column where 80%+ of cells are blank must retain a sensible minimum width (e.g., 36pt) and not collapse to 0pt or cause division-by-zero errors in width allocation math.
4. **Extreme Column Count (Wide Spreadsheets)**: Tables with 15+ columns exceeding printable portrait width must automatically flip to `landscape` orientation and scale the base font size down to 7.5pt if needed.
5. **Multi-Section Spreadsheets with Trailing Footnotes/KPIs**: Spreadsheets containing a primary data table followed by blank rows and free-form notes or key-value metric blocks must segment into distinct `DocumentSection` entities (`table`, `text`, `kpi-grid`) rather than corrupting the table column definitions.

---

## File Structure

```
/root/
├── src/
│   ├── types/
│   │   ├── cell-ir.ts                       # Existing Cell IR definitions
│   │   └── layout-ir.ts                     # Layout IR & ColumnDescriptor type definitions
│   ├── lib/
│   │   ├── workers.ts                       # Worker bridge (ParserWorker + LayoutWorker)
│   │   └── layout/
│   │       ├── header-detector.ts           # Header scoring heuristic (S = 0.60B + 0.30T + ...)
│   │       ├── column-classifier.ts         # Type inference (number, date, boolean, text, mixed)
│   │       ├── column-width-allocator.ts    # Square-root width allocation & orientation/font scaling
│   │       ├── section-detector.ts          # Multi-section splitter (tables, KPI grids, notes)
│   │       └── layout-engine.ts             # Orchestrator assembling CellIR into LayoutIR
│   └── workers/
│       └── layout.worker.ts                 # Web Worker exposing LayoutWorkerAPI via Comlink
└── tests/
    ├── unit/
    │   ├── layout-ir.test.ts                # Type validation tests
    │   ├── header-detector.test.ts          # Header heuristic unit tests
    │   ├── column-classifier.test.ts        # Column data typing & alignment tests
    │   ├── column-width-allocator.test.ts   # Width math, orientation flip, font scale tests
    │   ├── section-detector.test.ts         # Section segmentation tests
    │   ├── layout-engine.test.ts            # Layout engine orchestrator tests
    │   └── layout-worker.test.ts            # Layout worker Comlink RPC tests
    └── integration/
        └── layout-flow.test.ts              # End-to-end: XLSX/CSV -> Parser -> Layout IR
```

---

## Tasks

### Task 1: Layout IR Type Definitions

**Files:**
- Create: `src/types/layout-ir.ts`
- Test: `tests/unit/layout-ir.test.ts`

**Interfaces:**
- Consumes: `CellStyle`, `CellIR`, `CellRow`, `Cell` from `src/types/cell-ir.ts`
- Produces: `ColumnDescriptor`, `TableCell`, `TableRow`, `TableSection`, `TextSectionContent`, `KpiItem`, `KpiGridContent`, `DocumentSection`, `GlobalStyles`, `LayoutIR`, `LayoutWorkerAPI`

- [x] **Step 1: Write the failing test**

```typescript
// tests/unit/layout-ir.test.ts
import { describe, it, expect } from 'vitest';
import type {
  ColumnDescriptor,
  TableCell,
  TableRow,
  TableSection,
  DocumentSection,
  GlobalStyles,
  LayoutIR,
  LayoutWorkerAPI,
} from '../../src/types/layout-ir';

describe('Layout IR Type Definitions', () => {
  it('should instantiate a valid ColumnDescriptor structure', () => {
    const col: ColumnDescriptor = {
      index: 0,
      header: 'Revenue',
      dataType: 'number',
      alignment: 'right',
      minWidth: 40,
      maxWidth: 120,
      suggestedWidth: 80,
      numberFormat: 'currency',
      stats: {
        nullCount: 0,
        uniqueValues: 10,
        maxLength: 8,
      },
    };

    expect(col.header).toBe('Revenue');
    expect(col.dataType).toBe('number');
    expect(col.alignment).toBe('right');
    expect(col.numberFormat).toBe('currency');
  });

  it('should construct a complete LayoutIR object', () => {
    const tableCell: TableCell = {
      value: 125000,
      formattedValue: '$125,000.00',
      alignment: 'right',
      style: { bold: true },
    };

    const tableRow: TableRow = {
      cells: [tableCell],
    };

    const tableSection: TableSection = {
      columns: [
        {
          index: 0,
          header: 'Amount',
          dataType: 'number',
          alignment: 'right',
          minWidth: 50,
          maxWidth: 150,
          suggestedWidth: 100,
          numberFormat: 'currency',
          stats: { nullCount: 0, uniqueValues: 1, maxLength: 11 },
        },
      ],
      rows: [tableRow],
      headerStyle: {
        bold: true,
        bgColor: '#1E293B',
        textColor: '#FFFFFF',
      },
      alternatingRows: true,
    };

    const docSection: DocumentSection = {
      type: 'table',
      title: 'Q3 Financials',
      content: tableSection,
    };

    const globalStyles: GlobalStyles = {
      pageSize: 'a4',
      orientation: 'portrait',
      margins: { top: 36, right: 36, bottom: 36, left: 36 },
      fontFamily: 'Inter',
      baseFontSize: 9,
      theme: 'modern-clean',
    };

    const layoutIR: LayoutIR = {
      documentType: 'report',
      title: 'Quarterly Summary',
      sections: [docSection],
      globalStyles,
    };

    expect(layoutIR.documentType).toBe('report');
    expect(layoutIR.sections).toHaveLength(1);
    expect(layoutIR.sections[0]?.type).toBe('table');
    expect(layoutIR.globalStyles.pageSize).toBe('a4');
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/layout-ir.test.ts`
Expected: FAIL with module `../../src/types/layout-ir` not found.

- [x] **Step 3: Write minimal implementation**

```typescript
// src/types/layout-ir.ts
import type { CellStyle, CellIR } from './cell-ir';

export type ColumnDataType = 'text' | 'number' | 'date' | 'boolean' | 'mixed';
export type NumberFormatType = 'integer' | 'decimal' | 'currency' | 'percentage';
export type AlignmentType = 'left' | 'center' | 'right';
export type PageSizeType = 'letter' | 'a4' | 'legal' | 'a3' | 'a5';
export type OrientationType = 'portrait' | 'landscape';
export type SectionType = 'table' | 'text' | 'kpi-grid';
export type DocumentType = 'table' | 'report' | 'list';

export interface ColumnStats {
  nullCount: number;
  uniqueValues: number;
  maxLength: number;
}

export interface ColumnDescriptor {
  index: number;
  header: string;
  dataType: ColumnDataType;
  alignment: AlignmentType;
  minWidth: number;          // Typographic points (pt)
  maxWidth: number;          // Typographic points (pt)
  suggestedWidth: number;    // Computed proportional width (pt)
  numberFormat?: NumberFormatType;
  dateFormat?: string;
  stats: ColumnStats;
}

export interface TableCell {
  value: string | number | boolean | null;
  formattedValue: string;
  alignment: AlignmentType;
  style?: CellStyle;
}

export interface TableRow {
  cells: TableCell[];
}

export interface HeaderStyle {
  bold: boolean;
  bgColor: string;
  textColor: string;
}

export interface TableSection {
  columns: ColumnDescriptor[];
  rows: TableRow[];
  headerStyle: HeaderStyle;
  alternatingRows: boolean;
}

export interface TextSectionContent {
  paragraphs: string[];
}

export interface KpiItem {
  label: string;
  value: string;
  change?: string;
}

export interface KpiGridContent {
  items: KpiItem[];
  columns: number;
}

export type SectionContent = TableSection | TextSectionContent | KpiGridContent;

export interface DocumentSection {
  type: SectionType;
  title?: string;
  content: SectionContent;
}

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface GlobalStyles {
  pageSize: PageSizeType;
  orientation: OrientationType;
  margins: PageMargins;
  fontFamily: string;
  baseFontSize: number;
  theme: string;
}

export interface LayoutIR {
  documentType: DocumentType;
  title?: string;
  sections: DocumentSection[];
  globalStyles: GlobalStyles;
}

export interface LayoutOptions {
  pageSize?: PageSizeType;
  orientation?: OrientationType | 'auto';
  theme?: string;
  fontFamily?: string;
  baseFontSize?: number;
}

export interface LayoutWorkerAPI {
  analyzeLayout(
    cellIR: CellIR,
    options?: LayoutOptions,
    onProgress?: (progress: number) => void
  ): Promise<LayoutIR>;
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/layout-ir.test.ts`
Expected: PASS (2 tests passed)

- [x] **Step 5: Commit**

```bash
git add src/types/layout-ir.ts tests/unit/layout-ir.test.ts
git commit -m "feat(types): define Layout IR interfaces and worker API schemas"
```

---

### Task 2: Header Scoring Heuristic Engine

**Files:**
- Create: `src/lib/layout/header-detector.ts`
- Test: `tests/unit/header-detector.test.ts`

**Interfaces:**
- Consumes: `CellRow`, `Cell` from `src/types/cell-ir.ts`
- Produces: `computeHeaderScore(row: CellRow, rowIndex: number): number`, `detectHeaderRow(rows: CellRow[], maxSearchRows?: number): { headerIndex: number; score: number } | null`

- [x] **Step 1: Write the failing test**

```typescript
// tests/unit/header-detector.test.ts
import { describe, it, expect } from 'vitest';
import type { CellRow } from '../../src/types/cell-ir';
import { computeHeaderScore, detectHeaderRow } from '../../src/lib/layout/header-detector';

describe('Header Detector Heuristics', () => {
  it('should score bold top row >= 0.90 (S = 0.60*1.0 + 0.30 + 0.05*1.0 + 0.0 + 0.02*1.0 = 0.97)', () => {
    const row: CellRow = {
      rowIndex: 0,
      cells: [
        { value: 'ID', type: 'string', style: { bold: true }, position: { row: 0, col: 0 } },
        { value: 'Name', type: 'string', style: { bold: true }, position: { row: 0, col: 1 } },
        { value: 'Price', type: 'string', style: { bold: true }, position: { row: 0, col: 2 } },
      ],
    };

    const score = computeHeaderScore(row, 0);
    expect(score).toBeCloseTo(0.97, 2);
    expect(score).toBeGreaterThanOrEqual(0.85);
  });

  it('should score non-bold string top row around 0.37 and fail header threshold if not bold or shaded', () => {
    const row: CellRow = {
      rowIndex: 0,
      cells: [
        { value: 'Alpha', type: 'string', position: { row: 0, col: 0 } },
        { value: 'Beta', type: 'string', position: { row: 0, col: 1 } },
      ],
    };

    // B=0, T=0.30, F=1.0, C=0, U=1.0 => 0.0 + 0.30 + 0.05 + 0.0 + 0.02 = 0.37
    const score = computeHeaderScore(row, 0);
    expect(score).toBeCloseTo(0.37, 2);
    expect(score).toBeLessThan(0.85);
  });

  it('should score shaded/colored row at row 1 with bold text correctly', () => {
    const row: CellRow = {
      rowIndex: 1,
      cells: [
        { value: 'Col A', type: 'string', style: { bold: true, bgColor: '#CCCCCC' }, position: { row: 1, col: 0 } },
        { value: 'Col B', type: 'string', style: { bold: true, bgColor: '#CCCCCC' }, position: { row: 1, col: 1 } },
      ],
    };

    // B=1.0 (0.60), T=0.15, F=1.0 (0.05), C=1.0 (0.03), U=1.0 (0.02) => S = 0.60 + 0.15 + 0.05 + 0.03 + 0.02 = 0.85
    const score = computeHeaderScore(row, 1);
    expect(score).toBeCloseTo(0.85, 2);
    expect(score).toBeGreaterThanOrEqual(0.85);
  });

  it('should return 0.0 for empty row or row with no filled cells', () => {
    const emptyRow: CellRow = { rowIndex: 0, cells: [] };
    expect(computeHeaderScore(emptyRow, 0)).toBe(0.0);

    const blankCellsRow: CellRow = {
      rowIndex: 0,
      cells: [
        { value: null, type: 'empty', position: { row: 0, col: 0 } },
        { value: '', type: 'empty', position: { row: 0, col: 1 } },
      ],
    };
    // B=0, T=0.30, F=0, C=0, U=0 => 0.30
    expect(computeHeaderScore(blankCellsRow, 0)).toBe(0.30);
  });

  it('should detect the correct header row index among candidate rows', () => {
    const titleRow: CellRow = {
      rowIndex: 0,
      cells: [
        { value: 'Sales Report 2026', type: 'string', style: { bold: true, fontSize: 16 }, position: { row: 0, col: 0 } },
        { value: null, type: 'empty', position: { row: 0, col: 1 } },
        { value: null, type: 'empty', position: { row: 0, col: 2 } },
      ],
    };
    // Row 0 has 1 bold string cell out of 3 total cells: B = 1/3 = 0.333, T = 0.30, F = 0.333, C = 0, U = 0.333 => S = 0.60(0.333) + 0.30 + 0.05(0.333) + 0.02(0.333) = 0.20 + 0.30 + 0.016 + 0.006 = 0.522 (< 0.85)

    const headerRow: CellRow = {
      rowIndex: 1,
      cells: [
        { value: 'Product', type: 'string', style: { bold: true, bgColor: '#E0E0E0' }, position: { row: 1, col: 0 } },
        { value: 'Units', type: 'string', style: { bold: true, bgColor: '#E0E0E0' }, position: { row: 1, col: 1 } },
        { value: 'Total', type: 'string', style: { bold: true, bgColor: '#E0E0E0' }, position: { row: 1, col: 2 } },
      ],
    };
    // Row 1: B=1.0, T=0.15, F=1.0, C=1.0, U=1.0 => S = 0.85

    const dataRow: CellRow = {
      rowIndex: 2,
      cells: [
        { value: 'Widget A', type: 'string', position: { row: 2, col: 0 } },
        { value: 100, type: 'number', position: { row: 2, col: 1 } },
        { value: 2500, type: 'number', position: { row: 2, col: 2 } },
      ],
    };

    const detected = detectHeaderRow([titleRow, headerRow, dataRow], 5);
    expect(detected).not.toBeNull();
    expect(detected?.headerIndex).toBe(1);
    expect(detected?.score).toBeGreaterThanOrEqual(0.85);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/header-detector.test.ts`
Expected: FAIL with module `../../src/lib/layout/header-detector` not found.

- [x] **Step 3: Write minimal implementation**

```typescript
// src/lib/layout/header-detector.ts
import type { CellRow } from '../../types/cell-ir';

export const HEADER_SCORE_THRESHOLD = 0.85;

/**
 * Computes the header heuristic score for a candidate row.
 * Formula: S = 0.60 * B + T + 0.05 * F + 0.03 * C + 0.02 * U
 *
 * Where:
 * - B: Proportion of bold cells (0.0 to 1.0)
 * - T: Top row position score (Row 0 = 0.30, Row 1 = 0.15, Others = 0.00)
 * - F: Proportion of filled (non-empty) cells (0.0 to 1.0)
 * - C: Proportion of colored/shaded background cells (0.0 to 1.0)
 * - U: Proportion of string-typed cells (0.0 to 1.0)
 */
export function computeHeaderScore(row: CellRow, rowIndex: number): number {
  if (!row.cells || row.cells.length === 0) {
    return 0.0;
  }

  const total = row.cells.length;
  let boldCount = 0;
  let filledCount = 0;
  let coloredCount = 0;
  let stringCount = 0;

  for (const cell of row.cells) {
    if (cell.style?.bold) {
      boldCount++;
    }
    const isFilled = cell.value !== null && cell.value !== undefined && cell.value !== '' && cell.type !== 'empty';
    if (isFilled) {
      filledCount++;
    }
    if (cell.style?.bgColor && cell.style.bgColor !== 'transparent' && cell.style.bgColor !== '#FFFFFF') {
      coloredCount++;
    }
    if (cell.type === 'string' && typeof cell.value === 'string' && cell.value.trim() !== '') {
      stringCount++;
    }
  }

  const B = boldCount / total;
  const T = rowIndex === 0 ? 0.30 : rowIndex === 1 ? 0.15 : 0.0;
  const F = filledCount / total;
  const C = coloredCount / total;
  const U = stringCount / total;

  return (0.60 * B) + T + (0.05 * F) + (0.03 * C) + (0.02 * U);
}

export interface HeaderDetectionResult {
  headerIndex: number;
  score: number;
}

/**
 * Inspects initial rows of a table block to identify the header row.
 * Searches up to `maxSearchRows` (default 5).
 */
export function detectHeaderRow(
  rows: CellRow[],
  maxSearchRows: number = 5
): HeaderDetectionResult | null {
  if (!rows || rows.length === 0) {
    return null;
  }

  const searchLimit = Math.min(rows.length, maxSearchRows);
  let bestIndex = -1;
  let maxScore = -1;

  for (let i = 0; i < searchLimit; i++) {
    const row = rows[i];
    if (!row) continue;
    const score = computeHeaderScore(row, i);
    if (score > maxScore) {
      maxScore = score;
      bestIndex = i;
    }
  }

  if (maxScore >= HEADER_SCORE_THRESHOLD && bestIndex !== -1) {
    return { headerIndex: bestIndex, score: maxScore };
  }

  // Fallback: if row 0 has all string values and row 1 has numeric values, treat row 0 as header
  if (rows.length >= 2) {
    const row0 = rows[0];
    const row1 = rows[1];
    if (row0 && row1 && row0.cells.length > 0 && row1.cells.length > 0) {
      const row0StringRatio = row0.cells.filter(c => c.type === 'string').length / row0.cells.length;
      const row1NumRatio = row1.cells.filter(c => c.type === 'number').length / row1.cells.length;
      if (row0StringRatio >= 0.8 && row1NumRatio >= 0.3) {
        return { headerIndex: 0, score: 0.80 };
      }
    }
  }

  return null;
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/header-detector.test.ts`
Expected: PASS (5 tests passed)

- [x] **Step 5: Commit**

```bash
git add src/lib/layout/header-detector.ts tests/unit/header-detector.test.ts
git commit -m "feat(layout): implement header scoring heuristic formula and detection engine"
```

---

### Task 3: Column Classification & Type Inference Engine

**Files:**
- Create: `src/lib/layout/column-classifier.ts`
- Test: `tests/unit/column-classifier.test.ts`

**Interfaces:**
- Consumes: `Cell`, `CellStyle` from `src/types/cell-ir.ts`, `ColumnDescriptor`, `ColumnDataType`, `NumberFormatType`, `AlignmentType` from `src/types/layout-ir.ts`
- Produces: `classifyColumn(cells: Cell[], headerText?: string, colIndex?: number): ColumnDescriptor`

- [x] **Step 1: Write the failing test**

```typescript
// tests/unit/column-classifier.test.ts
import { describe, it, expect } from 'vitest';
import type { Cell } from '../../src/types/cell-ir';
import { classifyColumn } from '../../src/lib/layout/column-classifier';

describe('Column Classifier & Type Inference', () => {
  it('should classify numeric integer column with right alignment', () => {
    const cells: Cell[] = [
      { value: 10, type: 'number', position: { row: 1, col: 0 } },
      { value: 25, type: 'number', position: { row: 2, col: 0 } },
      { value: 100, type: 'number', position: { row: 3, col: 0 } },
    ];

    const descriptor = classifyColumn(cells, 'Quantity', 0);
    expect(descriptor.dataType).toBe('number');
    expect(descriptor.alignment).toBe('right');
    expect(descriptor.numberFormat).toBe('integer');
    expect(descriptor.stats.nullCount).toBe(0);
    expect(descriptor.stats.uniqueValues).toBe(3);
  });

  it('should detect currency format from numFmt or dollar string values', () => {
    const cells: Cell[] = [
      { value: 1250.5, type: 'number', style: { numFmt: '$#,##0.00' }, position: { row: 1, col: 0 } },
      { value: 99.99, type: 'number', style: { numFmt: '$#,##0.00' }, position: { row: 2, col: 0 } },
    ];

    const descriptor = classifyColumn(cells, 'Revenue', 0);
    expect(descriptor.dataType).toBe('number');
    expect(descriptor.alignment).toBe('right');
    expect(descriptor.numberFormat).toBe('currency');
  });

  it('should detect percentage format from numFmt or % values', () => {
    const cells: Cell[] = [
      { value: 0.15, type: 'number', style: { numFmt: '0.0%' }, position: { row: 1, col: 0 } },
      { value: 0.85, type: 'number', style: { numFmt: '0.0%' }, position: { row: 2, col: 0 } },
    ];

    const descriptor = classifyColumn(cells, 'Margin', 0);
    expect(descriptor.dataType).toBe('number');
    expect(descriptor.alignment).toBe('right');
    expect(descriptor.numberFormat).toBe('percentage');
  });

  it('should classify date column with center alignment', () => {
    const cells: Cell[] = [
      { value: '2026-09-21', type: 'date', position: { row: 1, col: 0 } },
      { value: '2026-09-22', type: 'date', position: { row: 2, col: 0 } },
    ];

    const descriptor = classifyColumn(cells, 'Created Date', 0);
    expect(descriptor.dataType).toBe('date');
    expect(descriptor.alignment).toBe('center');
  });

  it('should classify boolean column with center alignment', () => {
    const cells: Cell[] = [
      { value: true, type: 'boolean', position: { row: 1, col: 0 } },
      { value: false, type: 'boolean', position: { row: 2, col: 0 } },
    ];

    const descriptor = classifyColumn(cells, 'Active', 0);
    expect(descriptor.dataType).toBe('boolean');
    expect(descriptor.alignment).toBe('center');
  });

  it('should handle mixed columns with nulls and predominantly numbers gracefully', () => {
    const cells: Cell[] = [
      { value: 100, type: 'number', position: { row: 1, col: 0 } },
      { value: null, type: 'empty', position: { row: 2, col: 0 } },
      { value: 200, type: 'number', position: { row: 3, col: 0 } },
      { value: 'N/A', type: 'string', position: { row: 4, col: 0 } },
    ];

    const descriptor = classifyColumn(cells, 'Score', 0);
    expect(descriptor.stats.nullCount).toBe(1);
    expect(descriptor.dataType).toBe('mixed');
    expect(descriptor.alignment).toBe('left');
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/column-classifier.test.ts`
Expected: FAIL with module `../../src/lib/layout/column-classifier` not found.

- [x] **Step 3: Write minimal implementation**

```typescript
// src/lib/layout/column-classifier.ts
import type { Cell } from '../../types/cell-ir';
import type {
  ColumnDescriptor,
  ColumnDataType,
  NumberFormatType,
  AlignmentType,
  ColumnStats,
} from '../../types/layout-ir';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
const US_DATE_REGEX = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;

/**
 * Classifies data type, alignment, number formats, and statistical profile of a column.
 */
export function classifyColumn(
  cells: Cell[],
  headerText: string = '',
  colIndex: number = 0
): ColumnDescriptor {
  let nullCount = 0;
  let numCount = 0;
  let dateCount = 0;
  let boolCount = 0;
  let stringCount = 0;
  let maxLength = headerText.length;
  const uniqueSet = new Set<string>();

  let hasCurrencyFmt = false;
  let hasPercentFmt = false;
  let hasDecimalVal = false;

  for (const cell of cells) {
    const val = cell.value;
    if (val === null || val === undefined || val === '' || cell.type === 'empty') {
      nullCount++;
      continue;
    }

    const strVal = String(val).trim();
    if (strVal.length > maxLength) {
      maxLength = strVal.length;
    }
    uniqueSet.add(strVal);

    // Style numFmt check
    const numFmt = cell.style?.numFmt?.toLowerCase() || '';
    if (numFmt.includes('$') || numFmt.includes('€') || numFmt.includes('£') || numFmt.includes('¥')) {
      hasCurrencyFmt = true;
    }
    if (numFmt.includes('%')) {
      hasPercentFmt = true;
    }

    // Type classification
    if (cell.type === 'number' || typeof val === 'number') {
      numCount++;
      if (typeof val === 'number' && !Number.isInteger(val)) {
        hasDecimalVal = true;
      }
    } else if (cell.type === 'date' || val instanceof Date || ISO_DATE_REGEX.test(strVal) || US_DATE_REGEX.test(strVal)) {
      dateCount++;
    } else if (cell.type === 'boolean' || typeof val === 'boolean' || strVal.toLowerCase() === 'true' || strVal.toLowerCase() === 'false') {
      boolCount++;
    } else {
      // Check if string can be parsed as currency or number
      if (/^\$?\s?-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(strVal)) {
        numCount++;
        if (strVal.includes('$')) hasCurrencyFmt = true;
        if (strVal.includes('.')) hasDecimalVal = true;
      } else if (/^-?\d+(\.\d+)?%$/.test(strVal)) {
        numCount++;
        hasPercentFmt = true;
      } else {
        stringCount++;
      }
    }
  }

  const filledCount = cells.length - nullCount;
  let dataType: ColumnDataType = 'text';
  let alignment: AlignmentType = 'left';
  let numberFormat: NumberFormatType | undefined = undefined;

  if (filledCount === 0) {
    dataType = 'text';
    alignment = 'left';
  } else if (numCount === filledCount || (numCount / filledCount >= 0.85 && stringCount === 0)) {
    dataType = 'number';
    alignment = 'right';
    if (hasCurrencyFmt) {
      numberFormat = 'currency';
    } else if (hasPercentFmt) {
      numberFormat = 'percentage';
    } else if (hasDecimalVal) {
      numberFormat = 'decimal';
    } else {
      numberFormat = 'integer';
    }
  } else if (dateCount / filledCount >= 0.8) {
    dataType = 'date';
    alignment = 'center';
  } else if (boolCount / filledCount >= 0.8) {
    dataType = 'boolean';
    alignment = 'center';
  } else if (stringCount / filledCount >= 0.8) {
    dataType = 'text';
    alignment = 'left';
  } else {
    dataType = 'mixed';
    alignment = 'left';
  }

  // Explicit cell style alignment override if consistent
  const explicitAlign = cells.find(c => c.style?.horizontalAlignment)?.style?.horizontalAlignment;
  if (explicitAlign) {
    alignment = explicitAlign;
  }

  const stats: ColumnStats = {
    nullCount,
    uniqueValues: uniqueSet.size,
    maxLength: Math.max(maxLength, 1),
  };

  // Base width estimation (points)
  const charWidthPt = dataType === 'number' ? 5.5 : 5.0;
  const minWidth = Math.max(36, headerText.length * charWidthPt + 12);
  const maxWidth = Math.max(minWidth, maxLength * charWidthPt + 16);
  const suggestedWidth = Math.min(Math.max(minWidth, (minWidth + maxWidth) / 2), 250);

  return {
    index: colIndex,
    header: headerText,
    dataType,
    alignment,
    minWidth: Math.round(minWidth),
    maxWidth: Math.round(maxWidth),
    suggestedWidth: Math.round(suggestedWidth),
    numberFormat,
    stats,
  };
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/column-classifier.test.ts`
Expected: PASS (6 tests passed)

- [x] **Step 5: Commit**

```bash
git add src/lib/layout/column-classifier.ts tests/unit/column-classifier.test.ts
git commit -m "feat(layout): implement column classification and data typing engine"
```

---

### Task 4: Column Width Allocation & Page Geometry Optimizer

**Files:**
- Create: `src/lib/layout/column-width-allocator.ts`
- Test: `tests/unit/column-width-allocator.test.ts`

**Interfaces:**
- Consumes: `ColumnDescriptor`, `GlobalStyles`, `PageSizeType`, `OrientationType` from `src/types/layout-ir.ts`
- Produces: `allocateColumnWidths(columns: ColumnDescriptor[], availableWidthPt: number): ColumnDescriptor[]`, `optimizePageGeometry(columns: ColumnDescriptor[], preferredPageSize?: PageSizeType, preferredOrientation?: OrientationType | 'auto'): { globalStyles: GlobalStyles; optimizedColumns: ColumnDescriptor[] }`

- [x] **Step 1: Write the failing test**

```typescript
// tests/unit/column-width-allocator.test.ts
import { describe, it, expect } from 'vitest';
import type { ColumnDescriptor } from '../../src/types/layout-ir';
import {
  allocateColumnWidths,
  optimizePageGeometry,
  PAGE_DIMENSIONS,
} from '../../src/lib/layout/column-width-allocator';

describe('Column Width Allocator & Page Geometry', () => {
  const sampleColumns: ColumnDescriptor[] = [
    {
      index: 0,
      header: 'ID',
      dataType: 'number',
      alignment: 'right',
      minWidth: 30,
      maxWidth: 50,
      suggestedWidth: 40,
      stats: { nullCount: 0, uniqueValues: 10, maxLength: 4 },
    },
    {
      index: 1,
      header: 'Description',
      dataType: 'text',
      alignment: 'left',
      minWidth: 80,
      maxWidth: 300,
      suggestedWidth: 150,
      stats: { nullCount: 0, uniqueValues: 10, maxLength: 50 },
    },
    {
      index: 2,
      header: 'Price',
      dataType: 'number',
      alignment: 'right',
      minWidth: 40,
      maxWidth: 80,
      suggestedWidth: 60,
      stats: { nullCount: 0, uniqueValues: 10, maxLength: 8 },
    },
  ];

  it('should proportionally distribute available printable width using square root weighting', () => {
    const availableWidth = 500; // pt
    const allocated = allocateColumnWidths(sampleColumns, availableWidth);

    const sumWidths = allocated.reduce((sum, col) => sum + col.suggestedWidth, 0);
    expect(sumWidths).toBeCloseTo(availableWidth, 0);
    // Description column should receive significantly more width than ID and Price
    expect(allocated[1]!.suggestedWidth).toBeGreaterThan(allocated[0]!.suggestedWidth);
    expect(allocated[1]!.suggestedWidth).toBeGreaterThan(allocated[2]!.suggestedWidth);
  });

  it('should auto-flip to landscape when total column min-widths exceed portrait printable area', () => {
    // 12 wide columns
    const wideColumns: ColumnDescriptor[] = Array.from({ length: 12 }, (_, i) => ({
      index: i,
      header: `Column Long Title ${i + 1}`,
      dataType: 'text',
      alignment: 'left',
      minWidth: 60,
      maxWidth: 150,
      suggestedWidth: 100,
      stats: { nullCount: 0, uniqueValues: 10, maxLength: 20 },
    }));

    const result = optimizePageGeometry(wideColumns, 'a4', 'auto');
    expect(result.globalStyles.orientation).toBe('landscape');
    expect(result.globalStyles.pageSize).toBe('a4');
  });

  it('should retain portrait when table comfortably fits portrait printable area', () => {
    const compactColumns: ColumnDescriptor[] = [
      {
        index: 0,
        header: 'Task',
        dataType: 'text',
        alignment: 'left',
        minWidth: 60,
        maxWidth: 150,
        suggestedWidth: 100,
        stats: { nullCount: 0, uniqueValues: 5, maxLength: 15 },
      },
      {
        index: 1,
        header: 'Status',
        dataType: 'text',
        alignment: 'center',
        minWidth: 40,
        maxWidth: 80,
        suggestedWidth: 60,
        stats: { nullCount: 0, uniqueValues: 3, maxLength: 8 },
      },
    ];

    const result = optimizePageGeometry(compactColumns, 'a4', 'auto');
    expect(result.globalStyles.orientation).toBe('portrait');
    expect(result.globalStyles.baseFontSize).toBe(9);
  });

  it('should scale down font size when columns exceed standard landscape width', () => {
    // 20 columns
    const superWideColumns: ColumnDescriptor[] = Array.from({ length: 20 }, (_, i) => ({
      index: i,
      header: `Col ${i + 1}`,
      dataType: 'number',
      alignment: 'right',
      minWidth: 50,
      maxWidth: 100,
      suggestedWidth: 60,
      stats: { nullCount: 0, uniqueValues: 10, maxLength: 10 },
    }));

    const result = optimizePageGeometry(superWideColumns, 'a4', 'auto');
    expect(result.globalStyles.orientation).toBe('landscape');
    expect(result.globalStyles.baseFontSize).toBeLessThanOrEqual(8.0);
    expect(result.globalStyles.baseFontSize).toBeGreaterThanOrEqual(7.5);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/column-width-allocator.test.ts`
Expected: FAIL with module `../../src/lib/layout/column-width-allocator` not found.

- [x] **Step 3: Write minimal implementation**

```typescript
// src/lib/layout/column-width-allocator.ts
import type {
  ColumnDescriptor,
  GlobalStyles,
  PageSizeType,
  OrientationType,
  PageMargins,
} from '../../types/layout-ir';

export interface PageDimensions {
  width: number;  // pt
  height: number; // pt
}

// 1 inch = 72 points, 1 mm = 2.83465 points
export const PAGE_DIMENSIONS: Record<PageSizeType, PageDimensions> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612.00, height: 792.00 },
  legal: { width: 612.00, height: 1008.00 },
  a3: { width: 841.89, height: 1190.55 },
  a5: { width: 419.53, height: 595.28 },
};

export const DEFAULT_MARGINS: PageMargins = {
  top: 36,     // 0.5 in
  right: 36,
  bottom: 36,
  left: 36,
};

/**
 * Proportionally allocates column widths across available printable width
 * using square-root character length weighting to prevent wide text columns
 * from crushing concise numeric columns.
 */
export function allocateColumnWidths(
  columns: ColumnDescriptor[],
  availableWidthPt: number
): ColumnDescriptor[] {
  if (columns.length === 0) return [];

  const weights = columns.map(col => Math.max(Math.sqrt(col.stats.maxLength || 5), 2.0));
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);

  // Allocate proportionally
  let allocated = columns.map((col, idx) => {
    const weightRatio = (weights[idx] ?? 1) / (totalWeight || 1);
    const proportionalWidth = availableWidthPt * weightRatio;
    const clamped = Math.max(col.minWidth, Math.min(proportionalWidth, col.maxWidth * 1.5));
    return {
      ...col,
      suggestedWidth: clamped,
    };
  });

  // Normalize so sum equals availableWidthPt exactly
  const currentSum = allocated.reduce((sum, c) => sum + c.suggestedWidth, 0);
  if (currentSum > 0) {
    const scaleFactor = availableWidthPt / currentSum;
    allocated = allocated.map(c => ({
      ...c,
      suggestedWidth: Math.round(c.suggestedWidth * scaleFactor * 10) / 10,
    }));
  }

  return allocated;
}

/**
 * Determines optimal page orientation, margins, base font size, and column widths.
 */
export function optimizePageGeometry(
  columns: ColumnDescriptor[],
  preferredPageSize: PageSizeType = 'a4',
  preferredOrientation: OrientationType | 'auto' = 'auto',
  theme: string = 'modern-clean',
  fontFamily: string = 'Inter'
): { globalStyles: GlobalStyles; optimizedColumns: ColumnDescriptor[] } {
  const baseDim = PAGE_DIMENSIONS[preferredPageSize] || PAGE_DIMENSIONS.a4;
  const margins = { ...DEFAULT_MARGINS };

  const portraitPrintableWidth = baseDim.width - margins.left - margins.right;
  const landscapePrintableWidth = baseDim.height - margins.left - margins.right;

  const totalMinWidth = columns.reduce((sum, col) => sum + col.minWidth, 0);
  const totalSuggestedWidth = columns.reduce((sum, col) => sum + col.suggestedWidth, 0);

  let orientation: OrientationType = 'portrait';
  if (preferredOrientation === 'landscape') {
    orientation = 'landscape';
  } else if (preferredOrientation === 'portrait') {
    orientation = 'portrait';
  } else {
    // Auto-detect orientation
    if (totalMinWidth > portraitPrintableWidth || totalSuggestedWidth > portraitPrintableWidth * 1.1) {
      orientation = 'landscape';
    } else {
      orientation = 'portrait';
    }
  }

  const printableWidth = orientation === 'landscape' ? landscapePrintableWidth : portraitPrintableWidth;

  // Font scaling if table exceeds printable area
  let baseFontSize = 9.0;
  if (totalMinWidth > printableWidth) {
    const overflowRatio = printableWidth / totalMinWidth;
    baseFontSize = Math.max(7.5, Math.round(9.0 * overflowRatio * 10) / 10);
  }

  const optimizedColumns = allocateColumnWidths(columns, printableWidth);

  const globalStyles: GlobalStyles = {
    pageSize: preferredPageSize,
    orientation,
    margins,
    fontFamily,
    baseFontSize,
    theme,
  };

  return { globalStyles, optimizedColumns };
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/column-width-allocator.test.ts`
Expected: PASS (4 tests passed)

- [x] **Step 5: Commit**

```bash
git add src/lib/layout/column-width-allocator.ts tests/unit/column-width-allocator.test.ts
git commit -m "feat(layout): implement column width allocation and geometry optimization"
```

---

### Task 5: Section Detector & Boundary Segmentation

**Files:**
- Create: `src/lib/layout/section-detector.ts`
- Test: `tests/unit/section-detector.test.ts`

**Interfaces:**
- Consumes: `CellIR`, `CellRow`, `Cell` from `src/types/cell-ir.ts`, `DocumentSection`, `TableSection`, `TextSectionContent`, `KpiGridContent`, `TableRow`, `TableCell` from `src/types/layout-ir.ts`
- Produces: `detectSections(cellIR: CellIR): { title?: string; sections: DocumentSection[] }`

- [x] **Step 1: Write the failing test**

```typescript
// tests/unit/section-detector.test.ts
import { describe, it, expect } from 'vitest';
import type { CellIR, CellRow } from '../../src/types/cell-ir';
import { detectSections } from '../../src/lib/layout/section-detector';
import type { TableSection, TextSectionContent, KpiGridContent } from '../../src/types/layout-ir';

describe('Section Detector & Boundary Segmentation', () => {
  it('should extract title from top single-cell banner row and table from following rows', () => {
    const cellIR: CellIR = {
      metadata: { fileName: 'report.xlsx', sheetName: 'Sheet1', totalRows: 4, totalCols: 3 },
      rows: [
        {
          rowIndex: 0,
          cells: [
            { value: 'Monthly Financial Statement', type: 'string', style: { bold: true, fontSize: 16 }, position: { row: 0, col: 0 } },
            { value: null, type: 'empty', position: { row: 0, col: 1 } },
            { value: null, type: 'empty', position: { row: 0, col: 2 } },
          ],
        },
        {
          rowIndex: 1,
          cells: [
            { value: 'Category', type: 'string', style: { bold: true }, position: { row: 1, col: 0 } },
            { value: 'Budget', type: 'string', style: { bold: true }, position: { row: 1, col: 1 } },
            { value: 'Actual', type: 'string', style: { bold: true }, position: { row: 1, col: 2 } },
          ],
        },
        {
          rowIndex: 2,
          cells: [
            { value: 'Marketing', type: 'string', position: { row: 2, col: 0 } },
            { value: 5000, type: 'number', position: { row: 2, col: 1 } },
            { value: 4800, type: 'number', position: { row: 2, col: 2 } },
          ],
        },
        {
          rowIndex: 3,
          cells: [
            { value: 'Engineering', type: 'string', position: { row: 3, col: 0 } },
            { value: 12000, type: 'number', position: { row: 3, col: 1 } },
            { value: 11500, type: 'number', position: { row: 3, col: 2 } },
          ],
        },
      ],
    };

    const result = detectSections(cellIR);
    expect(result.title).toBe('Monthly Financial Statement');
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0]!.type).toBe('table');

    const tableContent = result.sections[0]!.content as TableSection;
    expect(tableContent.columns).toHaveLength(3);
    expect(tableContent.columns[0]!.header).toBe('Category');
    expect(tableContent.rows).toHaveLength(2);
  });

  it('should segment a sheet with a table followed by empty rows and a trailing text note', () => {
    const cellIR: CellIR = {
      metadata: { fileName: 'study_plan.xlsx', sheetName: 'Study Plan', totalRows: 6, totalCols: 2 },
      rows: [
        {
          rowIndex: 0,
          cells: [
            { value: 'Week', type: 'string', style: { bold: true }, position: { row: 0, col: 0 } },
            { value: 'Topic', type: 'string', style: { bold: true }, position: { row: 0, col: 1 } },
          ],
        },
        {
          rowIndex: 1,
          cells: [
            { value: 'Week 1', type: 'string', position: { row: 1, col: 0 } },
            { value: 'Mechanics', type: 'string', position: { row: 1, col: 1 } },
          ],
        },
        // Blank row separating table from notes
        {
          rowIndex: 2,
          cells: [
            { value: null, type: 'empty', position: { row: 2, col: 0 } },
            { value: null, type: 'empty', position: { row: 2, col: 1 } },
          ],
        },
        {
          rowIndex: 3,
          cells: [
            { value: 'Note: All exams take place on Friday afternoon.', type: 'string', style: { italic: true }, position: { row: 3, col: 0 } },
            { value: null, type: 'empty', position: { row: 3, col: 1 } },
          ],
        },
      ],
    };

    const result = detectSections(cellIR);
    expect(result.sections.length).toBeGreaterThanOrEqual(2);
    expect(result.sections[0]!.type).toBe('table');
    expect(result.sections[1]!.type).toBe('text');

    const textContent = result.sections[1]!.content as TextSectionContent;
    expect(textContent.paragraphs[0]).toContain('Note: All exams take place on Friday afternoon.');
  });

  it('should detect KPI summary blocks consisting of key-value metrics', () => {
    const cellIR: CellIR = {
      metadata: { fileName: 'dashboard.xlsx', sheetName: 'KPIs', totalRows: 2, totalCols: 4 },
      rows: [
        {
          rowIndex: 0,
          cells: [
            { value: 'Total Revenue', type: 'string', position: { row: 0, col: 0 } },
            { value: '$1.2M', type: 'string', style: { bold: true }, position: { row: 0, col: 1 } },
            { value: 'Active Users', type: 'string', position: { row: 0, col: 2 } },
            { value: '45,000', type: 'string', style: { bold: true }, position: { row: 0, col: 3 } },
          ],
        },
      ],
    };

    const result = detectSections(cellIR);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0]!.type).toBe('kpi-grid');
    const kpiContent = result.sections[0]!.content as KpiGridContent;
    expect(kpiContent.items).toHaveLength(2);
    expect(kpiContent.items[0]!.label).toBe('Total Revenue');
    expect(kpiContent.items[0]!.value).toBe('$1.2M');
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/section-detector.test.ts`
Expected: FAIL with module `../../src/lib/layout/section-detector` not found.

- [x] **Step 3: Write minimal implementation**

```typescript
// src/lib/layout/section-detector.ts
import type { CellIR, CellRow, Cell } from '../../types/cell-ir';
import type {
  DocumentSection,
  TableSection,
  TextSectionContent,
  KpiGridContent,
  KpiItem,
  TableRow,
  TableCell,
} from '../../types/layout-ir';
import { detectHeaderRow } from './header-detector';
import { classifyColumn } from './column-classifier';

function isRowEmpty(row: CellRow): boolean {
  return !row.cells || row.cells.every(c => c.value === null || c.value === undefined || c.value === '' || c.type === 'empty');
}

function formatCellValue(cell: Cell): string {
  if (cell.value === null || cell.value === undefined) return '';
  if (typeof cell.value === 'number') {
    if (cell.style?.numFmt?.includes('$')) {
      return `$${cell.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (cell.style?.numFmt?.includes('%')) {
      return `${(cell.value * 100).toFixed(1)}%`;
    }
    return cell.value.toLocaleString();
  }
  return String(cell.value);
}

/**
 * Splits rows into contiguous non-empty row blocks.
 */
function partitionRowBlocks(rows: CellRow[]): CellRow[][] {
  const blocks: CellRow[][] = [];
  let currentBlock: CellRow[] = [];

  for (const row of rows) {
    if (isRowEmpty(row)) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
        currentBlock = [];
      }
    } else {
      currentBlock.push(row);
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  return blocks;
}

/**
 * Detects whether a block of rows represents a KPI grid (key-value cards).
 */
function tryParseKpiGrid(block: CellRow[]): KpiGridContent | null {
  if (block.length > 3) return null;

  const items: KpiItem[] = [];
  for (const row of block) {
    const filledCells = row.cells.filter(c => c.value !== null && c.value !== '');
    if (filledCells.length >= 2 && filledCells.length % 2 === 0) {
      for (let i = 0; i < filledCells.length; i += 2) {
        const labelCell = filledCells[i];
        const valCell = filledCells[i + 1];
        if (labelCell && valCell) {
          items.push({
            label: String(labelCell.value),
            value: formatCellValue(valCell),
          });
        }
      }
    }
  }

  if (items.length >= 2) {
    return { items, columns: Math.min(items.length, 4) };
  }

  return null;
}

/**
 * Detects whether a block of rows represents a free-form text note / commentary.
 */
function tryParseTextSection(block: CellRow[]): TextSectionContent | null {
  const paragraphs: string[] = [];
  let isText = true;

  for (const row of block) {
    const filled = row.cells.filter(c => c.value !== null && c.value !== '');
    if (filled.length === 1 && typeof filled[0]?.value === 'string') {
      const text = String(filled[0].value).trim();
      paragraphs.push(text);
    } else {
      isText = false;
      break;
    }
  }

  if (isText && paragraphs.length > 0) {
    return { paragraphs };
  }

  return null;
}

/**
 * Converts a matrix of rows into a structured TableSection.
 */
function buildTableSection(block: CellRow[]): TableSection {
  const headerDetection = detectHeaderRow(block);
  const headerIdx = headerDetection ? headerDetection.headerIndex : 0;
  const headerRow = block[headerIdx];

  const maxCols = block.reduce((max, r) => Math.max(max, r.cells.length), 0);
  const dataRows = block.filter((_, idx) => idx !== headerIdx);

  // Classify each column
  const columns = Array.from({ length: maxCols }, (_, colIdx) => {
    const headerText = headerRow?.cells[colIdx]?.value != null ? String(headerRow.cells[colIdx]?.value) : `Col ${colIdx + 1}`;
    const columnCells = dataRows.map(r => r.cells[colIdx] || { value: null, type: 'empty' as const, position: { row: r.rowIndex, col: colIdx } });
    return classifyColumn(columnCells, headerText, colIdx);
  });

  // Build TableRow objects
  const tableRows: TableRow[] = dataRows.map(r => {
    const cells: TableCell[] = columns.map((col, colIdx) => {
      const cell = r.cells[colIdx];
      const val = cell?.value ?? null;
      const formatted = cell ? formatCellValue(cell) : '';
      return {
        value: val,
        formattedValue: formatted,
        alignment: col.alignment,
        style: cell?.style,
      };
    });
    return { cells };
  });

  return {
    columns,
    rows: tableRows,
    headerStyle: {
      bold: true,
      bgColor: '#1E293B',
      textColor: '#FFFFFF',
    },
    alternatingRows: true,
  };
}

/**
 * Segments CellIR into DocumentTitle and DocumentSections.
 */
export function detectSections(cellIR: CellIR): { title?: string; sections: DocumentSection[] } {
  if (!cellIR.rows || cellIR.rows.length === 0) {
    return { title: cellIR.metadata?.sheetName || undefined, sections: [] };
  }

  let title: string | undefined = undefined;
  let remainingRows = [...cellIR.rows];

  // Inspect first row: is it a Document Title banner?
  const firstRow = remainingRows[0];
  if (firstRow) {
    const filled = firstRow.cells.filter(c => c.value !== null && c.value !== '');
    if (filled.length === 1 && typeof filled[0]?.value === 'string') {
      const val = String(filled[0].value).trim();
      if (val.length > 0 && val.length <= 100) {
        title = val;
        remainingRows = remainingRows.slice(1);
      }
    }
  }

  const blocks = partitionRowBlocks(remainingRows);
  const sections: DocumentSection[] = [];

  for (const block of blocks) {
    if (block.length === 0) continue;

    // Check KPI grid
    const kpi = tryParseKpiGrid(block);
    if (kpi) {
      sections.push({ type: 'kpi-grid', content: kpi });
      continue;
    }

    // Check Text section
    const text = tryParseTextSection(block);
    if (text) {
      sections.push({ type: 'text', content: text });
      continue;
    }

    // Default: Table section
    const table = buildTableSection(block);
    sections.push({ type: 'table', content: table });
  }

  return { title, sections };
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/section-detector.test.ts`
Expected: PASS (3 tests passed)

- [x] **Step 5: Commit**

```bash
git add src/lib/layout/section-detector.ts tests/unit/section-detector.test.ts
git commit -m "feat(layout): implement multi-section detector for tables, text, and KPI grids"
```

---

### Task 6: Layout Engine Orchestrator

**Files:**
- Create: `src/lib/layout/layout-engine.ts`
- Test: `tests/unit/layout-engine.test.ts`

**Interfaces:**
- Consumes: `CellIR` from `src/types/cell-ir.ts`, `LayoutIR`, `LayoutOptions` from `src/types/layout-ir.ts`
- Produces: `analyzeCellIR(cellIR: CellIR, options?: LayoutOptions): LayoutIR`

- [x] **Step 1: Write the failing test**

```typescript
// tests/unit/layout-engine.test.ts
import { describe, it, expect } from 'vitest';
import type { CellIR } from '../../src/types/cell-ir';
import { analyzeCellIR } from '../../src/lib/layout/layout-engine';
import type { TableSection } from '../../src/types/layout-ir';

describe('Layout Engine Orchestrator', () => {
  it('should transform complete CellIR into production-ready LayoutIR', () => {
    const cellIR: CellIR = {
      metadata: { fileName: 'sales.xlsx', sheetName: 'Q3 Sales', totalRows: 3, totalCols: 3 },
      rows: [
        {
          rowIndex: 0,
          cells: [
            { value: 'Item', type: 'string', style: { bold: true }, position: { row: 0, col: 0 } },
            { value: 'Units', type: 'string', style: { bold: true }, position: { row: 0, col: 1 } },
            { value: 'Revenue', type: 'string', style: { bold: true }, position: { row: 0, col: 2 } },
          ],
        },
        {
          rowIndex: 1,
          cells: [
            { value: 'Product X', type: 'string', position: { row: 1, col: 0 } },
            { value: 50, type: 'number', position: { row: 1, col: 1 } },
            { value: 5000, type: 'number', style: { numFmt: '$#,##0.00' }, position: { row: 1, col: 2 } },
          ],
        },
        {
          rowIndex: 2,
          cells: [
            { value: 'Product Y', type: 'string', position: { row: 2, col: 0 } },
            { value: 80, type: 'number', position: { row: 2, col: 1 } },
            { value: 9600, type: 'number', style: { numFmt: '$#,##0.00' }, position: { row: 2, col: 2 } },
          ],
        },
      ],
    };

    const layout = analyzeCellIR(cellIR, { pageSize: 'a4', theme: 'modern-clean' });

    expect(layout.documentType).toBe('table');
    expect(layout.sections).toHaveLength(1);
    expect(layout.globalStyles.pageSize).toBe('a4');
    expect(layout.globalStyles.orientation).toBe('portrait');

    const table = layout.sections[0]!.content as TableSection;
    expect(table.columns).toHaveLength(3);
    expect(table.columns[2]!.dataType).toBe('number');
    expect(table.columns[2]!.alignment).toBe('right');
    expect(table.columns[2]!.suggestedWidth).toBeGreaterThanOrEqual(table.columns[2]!.minWidth);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/layout-engine.test.ts`
Expected: FAIL with module `../../src/lib/layout/layout-engine` not found.

- [x] **Step 3: Write minimal implementation**

```typescript
// src/lib/layout/layout-engine.ts
import type { CellIR } from '../../types/cell-ir';
import type {
  LayoutIR,
  LayoutOptions,
  DocumentType,
  TableSection,
} from '../../types/layout-ir';
import { detectSections } from './section-detector';
import { optimizePageGeometry } from './column-width-allocator';

/**
 * Main layout analysis function that transforms CellIR into LayoutIR.
 */
export function analyzeCellIR(cellIR: CellIR, options: LayoutOptions = {}): LayoutIR {
  const { title, sections } = detectSections(cellIR);

  // Collect all columns across table sections to determine global page geometry
  const allTableColumns = sections
    .filter(s => s.type === 'table')
    .flatMap(s => (s.content as TableSection).columns);

  const { globalStyles, optimizedColumns } = optimizePageGeometry(
    allTableColumns.length > 0 ? allTableColumns : [],
    options.pageSize || 'a4',
    options.orientation || 'auto',
    options.theme || 'modern-clean',
    options.fontFamily || 'Inter'
  );

  // Update table sections with optimized column widths
  let colOffset = 0;
  for (const section of sections) {
    if (section.type === 'table') {
      const tableContent = section.content as TableSection;
      const count = tableContent.columns.length;
      tableContent.columns = optimizedColumns.slice(colOffset, colOffset + count);
      colOffset += count;
    }
  }

  // Determine overall documentType
  let documentType: DocumentType = 'table';
  if (sections.some(s => s.type === 'kpi-grid') || sections.length > 1) {
    documentType = 'report';
  } else if (sections.every(s => s.type === 'text')) {
    documentType = 'list';
  }

  return {
    documentType,
    title: title || cellIR.metadata?.sheetName || undefined,
    sections,
    globalStyles,
  };
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/layout-engine.test.ts`
Expected: PASS (1 test passed)

- [x] **Step 5: Commit**

```bash
git add src/lib/layout/layout-engine.ts tests/unit/layout-engine.test.ts
git commit -m "feat(layout): implement layout engine orchestrator"
```

---

### Task 7: Layout Web Worker & Comlink RPC Integration

**Files:**
- Create: `src/workers/layout.worker.ts`
- Modify: `src/lib/workers.ts`
- Test: `tests/unit/layout-worker.test.ts`

**Interfaces:**
- Consumes: `CellIR` from `src/types/cell-ir.ts`, `LayoutIR`, `LayoutOptions`, `LayoutWorkerAPI` from `src/types/layout-ir.ts`, `analyzeCellIR` from `src/lib/layout/layout-engine.ts`
- Produces: `layoutWorker` export in `src/lib/workers.ts`

- [x] **Step 1: Write the failing test**

```typescript
// tests/unit/layout-worker.test.ts
import { describe, it, expect } from 'vitest';
import type { CellIR } from '../../src/types/cell-ir';
import { LayoutWorker } from '../../src/workers/layout.worker';
import { layoutWorker } from '../../src/lib/workers';

describe('Layout Worker & RPC API', () => {
  const sampleCellIR: CellIR = {
    metadata: { fileName: 'test.csv', sheetName: 'Sheet1', totalRows: 2, totalCols: 2 },
    rows: [
      {
        rowIndex: 0,
        cells: [
          { value: 'Item', type: 'string', style: { bold: true }, position: { row: 0, col: 0 } },
          { value: 'Qty', type: 'string', style: { bold: true }, position: { row: 0, col: 1 } },
        ],
      },
      {
        rowIndex: 1,
        cells: [
          { value: 'Book', type: 'string', position: { row: 1, col: 0 } },
          { value: 12, type: 'number', position: { row: 1, col: 1 } },
        ],
      },
    ],
  };

  it('should analyze layout directly via LayoutWorker class instance', async () => {
    const worker = new LayoutWorker();
    const progressUpdates: number[] = [];

    const layout = await worker.analyzeLayout(
      sampleCellIR,
      { pageSize: 'letter' },
      p => progressUpdates.push(p)
    );

    expect(layout.documentType).toBe('table');
    expect(layout.globalStyles.pageSize).toBe('letter');
    expect(progressUpdates.length).toBeGreaterThan(0);
  });

  it('should analyze layout via workers.ts layoutWorker helper', async () => {
    const layout = await layoutWorker.analyzeLayout(sampleCellIR);
    expect(layout.documentType).toBe('table');
    expect(layout.sections).toHaveLength(1);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/layout-worker.test.ts`
Expected: FAIL with module `../../src/workers/layout.worker` not found.

- [x] **Step 3: Write minimal implementation**

```typescript
// src/workers/layout.worker.ts
import * as Comlink from 'comlink';
import type { CellIR } from '../types/cell-ir';
import type { LayoutIR, LayoutOptions, LayoutWorkerAPI } from '../types/layout-ir';
import { analyzeCellIR } from '../lib/layout/layout-engine';

export class LayoutWorker implements LayoutWorkerAPI {
  async analyzeLayout(
    cellIR: CellIR,
    options: LayoutOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<LayoutIR> {
    onProgress?.(0.1);

    // Yield to event loop to allow UI updates
    await new Promise(resolve => setTimeout(resolve, 0));
    onProgress?.(0.5);

    const layout = analyzeCellIR(cellIR, options);

    onProgress?.(1.0);
    return layout;
  }
}

// Expose Comlink endpoint if running inside Web Worker context
if (typeof self !== 'undefined' && 'postMessage' in self && typeof (self as any).importScripts === 'function') {
  Comlink.expose(new LayoutWorker());
}
```

```typescript
// src/lib/workers.ts
import * as Comlink from 'comlink';
import type { ParserWorkerAPI } from '../types/cell-ir';
import type { LayoutWorkerAPI, LayoutOptions, LayoutIR } from '../types/layout-ir';
import type { CellIR } from '../types/cell-ir';

let parserWorkerInstance: Comlink.Remote<ParserWorkerAPI> | ParserWorkerAPI | null = null;
let layoutWorkerInstance: Comlink.Remote<LayoutWorkerAPI> | LayoutWorkerAPI | null = null;

export function getParserWorker(): Comlink.Remote<ParserWorkerAPI> | ParserWorkerAPI {
  if (!parserWorkerInstance) {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        const worker = new Worker(
          new URL('../workers/parser.worker.ts', import.meta.url),
          { type: 'module' }
        );
        parserWorkerInstance = Comlink.wrap<ParserWorkerAPI>(worker);
      } catch (err) {
        console.warn('Parser Worker instantiation failed, falling back to direct instance:', err);
      }
    }

    if (!parserWorkerInstance) {
      const { ParserWorker } = require('../workers/parser.worker');
      parserWorkerInstance = new ParserWorker();
    }
  }

  return parserWorkerInstance!;
}

export function getLayoutWorker(): Comlink.Remote<LayoutWorkerAPI> | LayoutWorkerAPI {
  if (!layoutWorkerInstance) {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        const worker = new Worker(
          new URL('../workers/layout.worker.ts', import.meta.url),
          { type: 'module' }
        );
        layoutWorkerInstance = Comlink.wrap<LayoutWorkerAPI>(worker);
      } catch (err) {
        console.warn('Layout Worker instantiation failed, falling back to direct instance:', err);
      }
    }

    if (!layoutWorkerInstance) {
      const { LayoutWorker } = require('../workers/layout.worker');
      layoutWorkerInstance = new LayoutWorker();
    }
  }

  return layoutWorkerInstance!;
}

export const parserWorker = {
  parseFile: async (buffer: ArrayBuffer, fileName: string, sheetIndex?: number) => {
    const worker = getParserWorker();
    return await worker.parseFile(buffer, fileName, sheetIndex);
  },
};

export const layoutWorker = {
  analyzeLayout: async (
    cellIR: CellIR,
    options?: LayoutOptions,
    onProgress?: (progress: number) => void
  ): Promise<LayoutIR> => {
    const worker = getLayoutWorker();
    return await worker.analyzeLayout(cellIR, options, onProgress ? Comlink.proxy(onProgress) : undefined);
  },
};
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/layout-worker.test.ts`
Expected: PASS (2 tests passed)

- [x] **Step 5: Commit**

```bash
git add src/workers/layout.worker.ts src/lib/workers.ts tests/unit/layout-worker.test.ts
git commit -m "feat(workers): implement Layout Web Worker with Comlink RPC bridge"
```

---

### Task 8: End-to-End Layout Integration Test Suite

**Files:**
- Create: `tests/integration/layout-flow.test.ts`

**Interfaces:**
- Consumes: `parserWorker` and `layoutWorker` from `src/lib/workers.ts`
- Tests end-to-end pipeline: XLSX/CSV Buffer -> Parser Worker -> CellIR -> Layout Worker -> LayoutIR

- [ ] **Step 1: Write the integration tests**

```typescript
// tests/integration/layout-flow.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parserWorker, layoutWorker } from '../../src/lib/workers';
import type { TableSection } from '../../src/types/layout-ir';

describe('Layout Flow Integration Tests', () => {
  it('should parse simple-table.xlsx and construct valid TableSection with headers and column types', async () => {
    const filePath = path.resolve(__dirname, '../fixtures/simple-table.xlsx');
    const buffer = fs.readFileSync(filePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    // 1. Parse into Cell IR
    const cellIR = await parserWorker.parseFile(arrayBuffer, 'simple-table.xlsx');
    expect(cellIR.rows.length).toBeGreaterThanOrEqual(3);

    // 2. Analyze into Layout IR
    const layoutIR = await layoutWorker.analyzeLayout(cellIR, { pageSize: 'a4' });
    expect(layoutIR.documentType).toBe('table');
    expect(layoutIR.sections).toHaveLength(1);

    const table = layoutIR.sections[0]!.content as TableSection;
    expect(table.columns.length).toBe(3);
    expect(table.columns[0]!.header).toBe('ID');
    expect(table.columns[1]!.header).toBe('Name');
    expect(table.columns[2]!.header).toBe('Age');
    expect(table.columns[0]!.dataType).toBe('number');
    expect(table.columns[1]!.dataType).toBe('text');
  });

  it('should parse styles.xlsx and retain formatting in LayoutIR', async () => {
    const filePath = path.resolve(__dirname, '../fixtures/styles.xlsx');
    const buffer = fs.readFileSync(filePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const cellIR = await parserWorker.parseFile(arrayBuffer, 'styles.xlsx');
    const layoutIR = await layoutWorker.analyzeLayout(cellIR);

    expect(layoutIR.sections.length).toBeGreaterThanOrEqual(1);
    const table = layoutIR.sections[0]!.content as TableSection;
    expect(table.headerStyle.bold).toBe(true);
  });

  it('should parse simple.csv and determine correct column widths and alignment', async () => {
    const filePath = path.resolve(__dirname, '../fixtures/simple.csv');
    const buffer = fs.readFileSync(filePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const cellIR = await parserWorker.parseFile(arrayBuffer, 'simple.csv');
    const layoutIR = await layoutWorker.analyzeLayout(cellIR, { orientation: 'portrait' });

    expect(layoutIR.globalStyles.orientation).toBe('portrait');
    const table = layoutIR.sections[0]!.content as TableSection;
    expect(table.columns.length).toBe(3);
    expect(table.columns[0]!.alignment).toBe('right');
    expect(table.columns[1]!.alignment).toBe('left');
  });
});
```

- [x] **Step 2: Run test to verify it passes**

Run: `npx vitest run tests/integration/layout-flow.test.ts`
Expected: PASS (3 tests passed)

- [x] **Step 3: Run the full test suite to ensure zero regressions**

Run: `npm test -- --run`
Expected: All unit and integration test files pass.

- [x] **Step 4: Commit**

```bash
git add tests/integration/layout-flow.test.ts
git commit -m "test(integration): add end-to-end parser to layout engine flow integration suite"
```
