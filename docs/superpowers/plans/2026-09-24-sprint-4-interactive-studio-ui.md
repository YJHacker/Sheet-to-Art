# Sprint 4: Interactive Studio UI, Live Preview & 5 Themes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete interactive web Studio UI with drag-and-drop file upload, automated Web Worker pipeline orchestration, live PDF/document preview with zoom and page navigation, multi-theme selector (5 launch themes), document layout/typography controls, responsive mobile/desktop workspace, and one-click PDF export running 100% in the client browser.

**Architecture:** Client-side React 18 SPA with Zustand centralized state management, responsive Glassmorphism design system based on UI/UX Pro Max intelligence, and Web Worker RPC bridge (Parser -> Layout -> Typst). The Studio features a reactive split-pane interface (Control Sidebar, Preview Viewport with Zoom/Pan Canvas, and Top Toolbar) that debounces layout and theme updates, compiles Typst WASM to PDF in background workers, and manages object URL memory lifecycles cleanly.

**Tech Stack:**
- `React 18.3+` & `React DOM` (declarative UI & component architecture)
- `Zustand` ^4.5.0 / ^5.0.0 (lightweight reactive store)
- `Lucide React` ^0.400.0+ (SVG icons with zero emoji anti-patterns)
- `Vite 5+` & `TypeScript 5.6+` (strict type-safe bundler & worker integration)
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` (component interaction tests)
- `Vitest` ^2.1.0 (test runner with jsdom environment)

**Spec:** `docs/superpowers/specs/2026-09-21-spreadsheet-pdf-engine-design.md` & `PROJECT_STATE.md`

---

## Global Constraints

- Node.js >= 20.x (v20.20.2)
- TypeScript strict mode enabled (`strict: true`, `noUncheckedIndexedAccess: true`)
- All file paths use forward slashes (`/`)
- 100% Client-side execution with zero external data telemetry or network transmissions
- All icons must use SVG vectors (`lucide-react`); no emoji icons (UI/UX Pro Max rule)
- Color contrast must meet WCAG 2.2 AA (minimum 4.5:1 for normal text, 3:1 for large/graphical)
- Touch targets on mobile must be at least 44×44px with 8px+ spacing
- Memory management: All generated Blob Object URLs must be explicitly revoked via `URL.revokeObjectURL()` upon re-render or component unmount to prevent browser memory leaks
- PDF compile debouncing: Slider and text inputs triggering re-compilation must debounce (300ms) to avoid saturating WASM worker threads
- 5 launch themes must be supported and selectable: `modern-clean`, `executive-serif`, `compact-ledger`, `emerald-report`, `monochrome-pure`
- Page size options: `A4`, `Letter`, `Legal`, `A3`, `A5`
- Orientation options: `Auto` (algorithmic detection), `Portrait`, `Landscape`

---

## Review Focus

1. **Blob URL Leaks & Stale PDF References:** When themes or layout options change rapidly, previous Blob URLs must be revoked immediately so memory does not leak during long interactive sessions.
2. **Worker Concurrency & Debounced Pipeline:** Rapid input changes (e.g., slider adjustments, title typing) must cancel or ignore superseded worker compilation runs so the latest state always prevails without race conditions.
3. **Large File Upload & Corrupt Data Handling:** Uploading empty CSVs, corrupt XLSX files, or massive files (>50MB) must trigger clear, actionable UI error messages and restore the Studio to a clean recovery state without crashing the main thread.
4. **Mobile & Small Screen Usability:** On mobile viewports (<768px), the Studio must collapse controls into accessible drawers/tabs while maintaining a pinch/tap-friendly preview canvas with minimum 44px touch targets.
5. **DOM Preview Fallback When WASM Compiles:** During initial compilation or large document builds, the DOM preview fallback must render the LayoutIR structure immediately so the user experiences zero perceived latency.

---

## File Structure

```
/root/
├── src/
│   ├── types/
│   │   ├── cell-ir.ts                       # Cell IR type definitions (Sprint 1)
│   │   ├── layout-ir.ts                     # Layout IR type definitions (Sprint 2)
│   │   ├── typst.ts                         # Typst & PDF generation type definitions (Sprint 3)
│   │   └── studio.ts                        # Studio state, UI options & pipeline types (Sprint 4)
│   ├── store/
│   │   └── useStudioStore.ts                # Zustand central store for document & studio state
│   ├── lib/
│   │   ├── pipeline/
│   │   │   └── document-pipeline.ts         # Worker pipeline orchestrator (Parse -> Layout -> Typst)
│   │   ├── utils/
│   │   │   ├── formatters.ts                # File size, dimensions, page count formatters
│   │   │   ├── download.ts                  # Safe browser file download & print helpers
│   │   │   └── sample-data.ts               # Built-in sample datasets (Financial, Sales, Roster)
│   │   ├── workers.ts                       # Comlink worker bridge instances
│   │   ├── layout/                          # Layout heuristics engine (Sprint 2)
│   │   └── typst/                           # Typst generator, themes & compiler (Sprint 3)
│   ├── styles/
│   │   └── studio.css                       # Glassmorphism tokens, studio layouts & animations
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx                   # Accessible button (primary, secondary, ghost, icon)
│   │   │   ├── Select.tsx                   # Accessible styled select input
│   │   │   ├── Slider.tsx                   # Accessible slider with live value indicator
│   │   │   ├── Switch.tsx                   # Accessible toggle switch
│   │   │   ├── ProgressBar.tsx              # Multi-step progress indicator with stage badges
│   │   │   └── Toast.tsx                    # Feedback notification toast
│   │   ├── upload/
│   │   │   ├── Dropzone.tsx                 # Drag-and-drop zone with validation & sample loaders
│   │   │   └── FileInfoCard.tsx             # File metadata badge, sheet selector & reset button
│   │   ├── studio/
│   │   │   ├── Header.tsx                   # Studio header with branding, privacy badge & CTA
│   │   │   ├── Toolbar.tsx                  # Top floating toolbar (Zoom, PageNav, Fit Mode)
│   │   │   ├── Sidebar.tsx                  # Collapsible control sidebar (Themes, Setup, Layout)
│   │   │   ├── ThemeSelector.tsx            # 5-theme visual card selector with color swatches
│   │   │   ├── PageSetupControls.tsx        # Page size (A4, Letter...), Orientation & Margins
│   │   │   ├── LayoutModeControls.tsx       # Font scale, custom title, repeating header toggles
│   │   │   ├── DocumentOutline.tsx          # Section structure outline & jump links
│   │   │   └── ExportModal.tsx              # Download PDF modal with name & print triggers
│   │   ├── preview/
│   │   │   ├── PreviewViewport.tsx          # Pan/zoom canvas container with page shadows
│   │   │   ├── PDFViewer.tsx                # PDF iframe/embed preview with blob URL management
│   │   │   ├── DOMPreviewFallback.tsx       # Instant DOM/CSS preview rendering LayoutIR
│   │   │   └── ZoomControls.tsx             # Zoom In/Out, 100%, Fit Width, Fit Page buttons
│   │   └── layout/
│   │       └── StudioLayout.tsx             # Responsive 3-pane / 2-pane / mobile drawer layout
│   ├── App.tsx                              # Main app coordinating Upload and Studio views
│   └── main.tsx
└── tests/
    ├── unit/
    │   ├── studio-store.test.ts             # Zustand store actions & state transitions
    │   ├── document-pipeline.test.ts        # Worker pipeline orchestration & progress callbacks
    │   ├── sample-data.test.ts              # Sample datasets verification
    │   ├── ui-primitives.test.tsx           # Common UI component rendering & interaction
    │   ├── dropzone.test.tsx                # Dropzone validation, drag-and-drop & sample loading
    │   ├── theme-selector.test.tsx          # Theme card selection & active state
    │   ├── sidebar-controls.test.tsx        # Page setup & layout options modifications
    │   ├── preview-viewport.test.tsx        # Zoom math, page navigation & PDF viewer
    │   ├── export-flow.test.tsx             # PDF download filename sanitization & print triggers
    │   └── studio-layout.test.tsx           # Responsive layout & mobile drawer toggles
    └── integration/
        └── studio-ui-flow.test.tsx          # Full Studio UI journey test suite
```

---

## Tasks

### Task 1: Package Dependencies, Studio Type Definitions & Zustand Store

**Files:**
- Modify: `package.json`
- Create: `src/types/studio.ts`
- Create: `src/store/useStudioStore.ts`
- Test: `tests/unit/studio-store.test.ts`

**Interfaces:**
- Consumes: `CellIR` (`src/types/cell-ir.ts`), `LayoutIR`, `PageSizeType`, `OrientationType` (`src/types/layout-ir.ts`), `ThemeName`, `PDFRenderResult` (`src/types/typst.ts`)
- Produces: `PipelineStage`, `PipelineProgress`, `StudioOptions`, `ViewState`, `StudioState`, `useStudioStore`

- [x] **Step 1: Install dependencies (`zustand`, `lucide-react`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`)**
- [x] **Step 2: Write the failing test (`tests/unit/studio-store.test.ts`)**
- [x] **Step 3: Run test to verify it fails**
- [x] **Step 4: Implement `src/types/studio.ts` and `src/store/useStudioStore.ts`**
- [x] **Step 5: Run test to verify it passes**
- [x] **Step 6: Commit (`a8217df`)**

---

### Task 2: End-to-End Document Pipeline Orchestrator & Sample Datasets

**Files:**
- Create: `src/lib/utils/formatters.ts`
- Create: `src/lib/utils/download.ts`
- Create: `src/lib/utils/sample-data.ts`
- Create: `src/lib/pipeline/document-pipeline.ts`
- Test: `tests/unit/sample-data.test.ts`
- Test: `tests/unit/document-pipeline.test.ts`

**Interfaces:**
- Consumes: `parserWorker`, `layoutWorker`, `typstWorker` (`src/lib/workers.ts`), `StudioOptions` (`src/types/studio.ts`)
- Produces: `executeDocumentPipeline(fileBuffer, fileName, sheetIndex, options, onProgress)`, `recompilePDF(layoutIR, options)`, `getSampleSpreadsheet(sampleId)`, `formatFileSize(bytes)`, `downloadPDF(blob, filename)`

- [x] **Step 1: Write the failing tests (`tests/unit/sample-data.test.ts` and `tests/unit/document-pipeline.test.ts`)**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `src/lib/utils/formatters.ts`, `src/lib/utils/download.ts`, `src/lib/utils/sample-data.ts`, and `src/lib/pipeline/document-pipeline.ts`**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit (`65ba509`)**

---

### Task 3: Studio Design Tokens & Accessible UI Primitives

**Files:**
- Create: `src/styles/studio.css`
- Create: `src/components/common/Button.tsx`
- Create: `src/components/common/Select.tsx`
- Create: `src/components/common/Slider.tsx`
- Create: `src/components/common/Switch.tsx`
- Create: `src/components/common/ProgressBar.tsx`
- Create: `src/components/common/Toast.tsx`
- Test: `tests/unit/ui-primitives.test.tsx`

**Interfaces:**
- Produces: `Button`, `Select`, `Slider`, `Switch`, `ProgressBar`, `Toast` components with full ARIA accessibility and Glassmorphism styling tokens.

- [x] **Step 1: Write the failing test (`tests/unit/ui-primitives.test.tsx`)**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `src/styles/studio.css` and UI primitive components**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit (`1138682`)**

---

### Task 4: Upload Dropzone, File Validation & Sample Loaders

**Files:**
- Create: `src/components/upload/Dropzone.tsx`
- Create: `src/components/upload/FileInfoCard.tsx`
- Test: `tests/unit/dropzone.test.tsx`

**Interfaces:**
- Consumes: `useStudioStore`, `executeDocumentPipeline`, `getSampleSpreadsheet`
- Produces: `Dropzone`, `FileInfoCard`

- [x] **Step 1: Write the failing test (`tests/unit/dropzone.test.tsx`)**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `src/components/upload/Dropzone.tsx` and `FileInfoCard.tsx`**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit (`821f3ce`)**

---

### Task 5: Five Launch Themes Selector & Visual Swatches

**Files:**
- Create: `src/components/studio/ThemeSelector.tsx`
- Test: `tests/unit/theme-selector.test.tsx`

**Interfaces:**
- Consumes: `THEMES` (`src/lib/typst/themes.ts`), `ThemeName` (`src/types/typst.ts`), `useStudioStore`
- Produces: `ThemeSelector` component

- [x] **Step 1: Write the failing test (`tests/unit/theme-selector.test.tsx`)**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `src/components/studio/ThemeSelector.tsx`**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit (`f38f74f`)**

---

### Task 6: Page Setup, Typography & Layout Mode Controls Sidebar

**Files:**
- Create: `src/components/studio/PageSetupControls.tsx`
- Create: `src/components/studio/LayoutModeControls.tsx`
- Create: `src/components/studio/DocumentOutline.tsx`
- Create: `src/components/studio/Sidebar.tsx`
- Test: `tests/unit/sidebar-controls.test.tsx`

**Interfaces:**
- Consumes: `useStudioStore`, `LayoutIR`, `PageSizeType`, `OrientationType`
- Produces: `PageSetupControls`, `LayoutModeControls`, `DocumentOutline`, `Sidebar`

- [x] **Step 1: Write the failing test (`tests/unit/sidebar-controls.test.tsx`)**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `PageSetupControls.tsx`, `LayoutModeControls.tsx`, `DocumentOutline.tsx`, and `Sidebar.tsx`**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit (`7f8752d`)**

---

### Task 7: Live Preview Viewport, Zoom, Page Navigation & PDF Renderer

**Files:**
- Create: `src/components/preview/ZoomControls.tsx`
- Create: `src/components/preview/PageNav.tsx`
- Create: `src/components/preview/DOMPreviewFallback.tsx`
- Create: `src/components/preview/PDFViewer.tsx`
- Create: `src/components/preview/PreviewViewport.tsx`
- Test: `tests/unit/preview-viewport.test.tsx`

**Interfaces:**
- Consumes: `useStudioStore`, `PDFRenderResult`, `LayoutIR`
- Produces: `ZoomControls`, `PageNav`, `DOMPreviewFallback`, `PDFViewer`, `PreviewViewport`

- [x] **Step 1: Write the failing test (`tests/unit/preview-viewport.test.tsx`)**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement preview components (`ZoomControls`, `PageNav`, `DOMPreviewFallback`, `PDFViewer`, `PreviewViewport`)**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit (`346ca85`)**

---

### Task 8: Header, Floating Toolbar, Export Modal & PDF Download Flow

**Files:**
- Create: `src/components/studio/Header.tsx`
- Create: `src/components/studio/Toolbar.tsx`
- Create: `src/components/studio/ExportModal.tsx`
- Test: `tests/unit/export-flow.test.tsx`

**Interfaces:**
- Consumes: `useStudioStore`, `downloadPDF`, `formatFileSize`
- Produces: `Header`, `Toolbar`, `ExportModal`

- [x] **Step 1: Write the failing test (`tests/unit/export-flow.test.tsx`)**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `Header.tsx`, `Toolbar.tsx`, and `ExportModal.tsx`**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit (`66e582e`)**

---

### Task 9: Responsive Studio Workspace Layout & Mobile Drawer

**Files:**
- Create: `src/components/layout/StudioLayout.tsx`
- Modify: `src/App.tsx`
- Test: `tests/unit/studio-layout.test.tsx`

**Interfaces:**
- Consumes: All studio and preview components
- Produces: `StudioLayout`, complete interactive `App` component

- [x] **Step 1: Write the failing test (`tests/unit/studio-layout.test.tsx`)**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `src/components/layout/StudioLayout.tsx` and update `src/App.tsx`**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit (`2cf7410`)**

---

### Task 10: Full Interactive Studio UI Integration Suite & Verification

**Files:**
- Create: `tests/integration/studio-ui-flow.test.tsx`
- Modify: `PROJECT_STATE.md`

**Interfaces:**
- Validates the entire user journey: File Drop -> Worker Pipeline -> Live PDF Render -> Theme Switch (all 5 themes) -> Page Setup Changes -> Zoom & Navigation -> PDF Export.

- [x] **Step 1: Write the comprehensive integration test (`tests/integration/studio-ui-flow.test.tsx`)**
- [x] **Step 2: Run integration tests (`npm test tests/integration/studio-ui-flow.test.tsx`)**
- [x] **Step 3: Run full test suite (`npm test -- --run`), TypeScript typecheck (`npx tsc --noEmit`), and production build (`npm run build`)**
- [x] **Step 4: Update `PROJECT_STATE.md` with Sprint 4 completion notes**
- [x] **Step 5: Commit (`89246b3`)**

---

## Plan Self-Review & Verification

1. **Spec Coverage:**
   - Upload/dropzone & validation: Task 4 (Verified)
   - Parser -> Layout -> Typst pipeline: Task 2 (Verified)
   - Interactive Studio workspace: Tasks 6, 8, 9 (Verified)
   - Live PDF/document preview: Task 7 (Verified)
   - Page navigation and zoom: Task 7 (Verified)
   - Page size/orientation controls: Task 6 (Verified)
   - Layout mode controls: Task 6 (Verified)
   - Five launch themes: Task 5 (Verified)
   - Theme switching/live preview: Tasks 2, 5, 10 (Verified)
   - PDF export: Tasks 2, 8, 10 (Verified)
   - Responsive/mobile behavior: Tasks 3, 9 (Verified)
   - State management & error/loading states: Tasks 1, 2, 9 (Verified)
   - Tests and acceptance criteria: 135/135 tests passing across 32 test files.
