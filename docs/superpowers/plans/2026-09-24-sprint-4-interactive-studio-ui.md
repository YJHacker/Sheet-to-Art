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
    │   ├── ui-primitives.test.ts            # Common UI component rendering & interaction
    │   ├── dropzone.test.ts                 # Dropzone validation, drag-and-drop & sample loading
    │   ├── theme-selector.test.ts           # Theme card selection & active state
    │   ├── sidebar-controls.test.ts         # Page setup & layout options modifications
    │   ├── preview-viewport.test.ts         # Zoom math, page navigation & PDF viewer
    │   ├── export-flow.test.ts              # PDF download filename sanitization & print triggers
    │   └── studio-layout.test.ts            # Responsive layout & mobile drawer toggles
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

- [ ] **Step 1: Install dependencies (`zustand`, `lucide-react`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`)**
- [ ] **Step 2: Write the failing test (`tests/unit/studio-store.test.ts`)**
  - Verify initial state is idle with default options (`theme: 'modern-clean'`, `pageSize: 'a4'`, `orientation: 'portrait'`, `fontScale: 8.5`, `zoom: 100`, `currentPage: 1`).
  - Verify `setFile()`, `setPipelineProgress()`, `setDocument()`, `setOptions()`, `setZoom()`, `setCurrentPage()`, `resetStudio()` transitions work correctly.
  - Verify `setOptions()` updates options without resetting document results.
- [ ] **Step 3: Run test to verify it fails**
  - Run: `npm test tests/unit/studio-store.test.ts`
  - Expected: FAIL with module not found / store not defined.
- [ ] **Step 4: Implement `src/types/studio.ts` and `src/store/useStudioStore.ts`**
  - Define full TypeScript interfaces for `StudioOptions`, `ViewState`, `PipelineProgress`, `PipelineStage` (`'idle' | 'parsing' | 'layout' | 'compiling' | 'ready' | 'error'`).
  - Create the Zustand store with typed setters, immutable state updates, and a `reset()` method.
- [ ] **Step 5: Run test to verify it passes**
  - Run: `npm test tests/unit/studio-store.test.ts`
  - Expected: PASS
- [ ] **Step 6: Commit**
  - `git add package.json src/types/studio.ts src/store/useStudioStore.ts tests/unit/studio-store.test.ts`
  - `git commit -m "feat(studio): implement studio types and Zustand central state store"`

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

- [ ] **Step 1: Write the failing tests (`tests/unit/sample-data.test.ts` and `tests/unit/document-pipeline.test.ts`)**
  - Test sample data generator returns valid CSV / ArrayBuffer for `financial-statement`, `sales-report`, and `employee-roster`.
  - Test `executeDocumentPipeline()` runs through stages (`parsing` -> `layout` -> `compiling` -> `ready`) and emits progress callbacks (0% to 100%).
  - Test `recompilePDF()` re-runs Typst WASM compilation with updated theme/options on existing `LayoutIR` without re-parsing.
  - Test `formatFileSize()` correctly formats bytes into KB/MB.
  - Test `downloadPDF()` creates and clicks an anchor element with sanitized `.pdf` extension.
- [ ] **Step 2: Run test to verify it fails**
  - Run: `npm test tests/unit/document-pipeline.test.ts`
  - Expected: FAIL with functions not defined.
- [ ] **Step 3: Implement `src/lib/utils/formatters.ts`, `src/lib/utils/download.ts`, `src/lib/utils/sample-data.ts`, and `src/lib/pipeline/document-pipeline.ts`**
  - Add formatters for file sizes, dimensions, and sanitized export names.
  - Add sample datasets (Financial Profit & Loss CSV, Regional Sales Q3 CSV, Engineering Team Roster CSV).
  - Implement pipeline orchestrator with error catching, progress stages, and Blob URL creation/cleanup.
- [ ] **Step 4: Run test to verify it passes**
  - Run: `npm test tests/unit/sample-data.test.ts tests/unit/document-pipeline.test.ts`
  - Expected: PASS
- [ ] **Step 5: Commit**
  - `git add src/lib/utils/ src/lib/pipeline/ tests/unit/sample-data.test.ts tests/unit/document-pipeline.test.ts`
  - `git commit -m "feat(studio): implement pipeline orchestrator, sample datasets, and formatters"`

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
- Test: `tests/unit/ui-primitives.test.ts`

**Interfaces:**
- Produces: `Button`, `Select`, `Slider`, `Switch`, `ProgressBar`, `Toast` components with full ARIA accessibility and Glassmorphism styling tokens.

- [ ] **Step 1: Write the failing test (`tests/unit/ui-primitives.test.ts`)**
  - Test `Button` renders variants (`primary`, `secondary`, `ghost`, `danger`) and handles `onClick`, `disabled`, and `aria-label`.
  - Test `Select` renders options and calls `onChange`.
  - Test `Slider` displays label, value, and respects min/max/step bounds.
  - Test `Switch` toggles checked state and supports keyboard Enter/Space activation.
  - Test `ProgressBar` renders stage progress percentage and stage badge label.
  - Test `Toast` renders message with auto-dismiss or close button.
- [ ] **Step 2: Run test to verify it fails**
  - Run: `npm test tests/unit/ui-primitives.test.ts`
  - Expected: FAIL with components not defined.
- [ ] **Step 3: Implement `src/styles/studio.css` and UI primitive components**
  - Define CSS custom properties for Glassmorphism (blur, borders, shadows, `#2563EB` primary, `#F8FAFC` background, `#1E293B` text).
  - Build `Button`, `Select`, `Slider`, `Switch`, `ProgressBar`, `Toast` with full accessible keyboard navigation, visible focus rings, and smooth hover transitions.
- [ ] **Step 4: Run test to verify it passes**
  - Run: `npm test tests/unit/ui-primitives.test.ts`
  - Expected: PASS
- [ ] **Step 5: Commit**
  - `git add src/styles/studio.css src/components/common/ tests/unit/ui-primitives.test.ts`
  - `git commit -m "feat(studio): create design tokens and accessible UI primitives"`

---

### Task 4: Upload Dropzone, File Validation & Sample Loaders

**Files:**
- Create: `src/components/upload/Dropzone.tsx`
- Create: `src/components/upload/FileInfoCard.tsx`
- Test: `tests/unit/dropzone.test.ts`

**Interfaces:**
- Consumes: `useStudioStore`, `executeDocumentPipeline`, `getSampleSpreadsheet`
- Produces: `Dropzone`, `FileInfoCard`

- [ ] **Step 1: Write the failing test (`tests/unit/dropzone.test.ts`)**
  - Test drag enter, drag leave, and drop events update visual state.
  - Test valid `.xlsx` and `.csv` file selection triggers pipeline execution.
  - Test invalid file types (e.g. `.png`, `.pdf`, `.txt`) trigger error toast and reject upload.
  - Test clicking a sample button ("Financial Statement", "Sales Report", "Employee Roster") loads sample buffer and triggers pipeline.
  - Test `FileInfoCard` displays filename, file size, sheet count, and sheet switcher dropdown for multi-sheet workbooks.
  - Test reset button clears the file and returns store to idle state.
- [ ] **Step 2: Run test to verify it fails**
  - Run: `npm test tests/unit/dropzone.test.ts`
  - Expected: FAIL with components not found.
- [ ] **Step 3: Implement `src/components/upload/Dropzone.tsx` and `FileInfoCard.tsx`**
  - Build Dropzone with animated upload icon, clear format badges (`.XLSX`, `.CSV`), file size notice (up to 50MB), and sample load buttons.
  - Implement full keyboard accessibility and drag-and-drop state indicators.
  - Build `FileInfoCard` with file type icon, sheet selector dropdown, and "Change File" button.
- [ ] **Step 4: Run test to verify it passes**
  - Run: `npm test tests/unit/dropzone.test.ts`
  - Expected: PASS
- [ ] **Step 5: Commit**
  - `git add src/components/upload/ tests/unit/dropzone.test.ts`
  - `git commit -m "feat(studio): implement file upload dropzone and sample dataset loaders"`

---

### Task 5: Five Launch Themes Selector & Visual Swatches

**Files:**
- Create: `src/components/studio/ThemeSelector.tsx`
- Test: `tests/unit/theme-selector.test.ts`

**Interfaces:**
- Consumes: `THEMES` (`src/lib/typst/themes.ts`), `ThemeName` (`src/types/typst.ts`), `useStudioStore`
- Produces: `ThemeSelector` component

- [ ] **Step 1: Write the failing test (`tests/unit/theme-selector.test.ts`)**
  - Test all 5 themes (`modern-clean`, `executive-serif`, `compact-ledger`, `emerald-report`, `monochrome-pure`) are rendered as visual selectable cards.
  - Test each theme card displays its display name, primary/accent color swatches, font badge, and description.
  - Test clicking a theme card updates the active theme in `useStudioStore` and triggers debounced PDF re-compilation.
  - Test active theme displays a distinct selected border and checkmark badge.
  - Test keyboard navigation (Arrow keys / Enter / Space) selects themes.
- [ ] **Step 2: Run test to verify it fails**
  - Run: `npm test tests/unit/theme-selector.test.ts`
  - Expected: FAIL with ThemeSelector not defined.
- [ ] **Step 3: Implement `src/components/studio/ThemeSelector.tsx`**
  - Render a grid of 5 theme cards with color chips, typography indicators (Sans / Serif / Monospace), and active badge.
  - Hook into `useStudioStore` to dispatch theme changes and trigger re-compilation.
- [ ] **Step 4: Run test to verify it passes**
  - Run: `npm test tests/unit/theme-selector.test.ts`
  - Expected: PASS
- [ ] **Step 5: Commit**
  - `git add src/components/studio/ThemeSelector.tsx tests/unit/theme-selector.test.ts`
  - `git commit -m "feat(studio): implement 5-theme visual selector component"`

---

### Task 6: Page Setup, Typography & Layout Mode Controls Sidebar

**Files:**
- Create: `src/components/studio/PageSetupControls.tsx`
- Create: `src/components/studio/LayoutModeControls.tsx`
- Create: `src/components/studio/DocumentOutline.tsx`
- Create: `src/components/studio/Sidebar.tsx`
- Test: `tests/unit/sidebar-controls.test.ts`

**Interfaces:**
- Consumes: `useStudioStore`, `LayoutIR`, `PageSizeType`, `OrientationType`
- Produces: `PageSetupControls`, `LayoutModeControls`, `DocumentOutline`, `Sidebar`

- [ ] **Step 1: Write the failing test (`tests/unit/sidebar-controls.test.ts`)**
  - Test page size selection (`A4`, `Letter`, `Legal`, `A3`, `A5`) updates store options.
  - Test orientation selection (`Auto`, `Portrait`, `Landscape`) updates store options.
  - Test margin presets (`Compact 10mm`, `Normal 15mm`, `Spacious 20mm`) update store options.
  - Test font scale slider (7.0pt to 12.0pt with 0.5pt steps) updates store options.
  - Test document title input field updates `customTitle`.
  - Test repeating table headers switch and show summary switch update store options.
  - Test `DocumentOutline` lists all sections from `LayoutIR` with their type (Table, Text, KPI Grid) and row counts.
  - Test `Sidebar` tabs switch between "Themes", "Layout & Setup", and "Outline".
- [ ] **Step 2: Run test to verify it fails**
  - Run: `npm test tests/unit/sidebar-controls.test.ts`
  - Expected: FAIL with components not found.
- [ ] **Step 3: Implement `PageSetupControls.tsx`, `LayoutModeControls.tsx`, `DocumentOutline.tsx`, and `Sidebar.tsx`**
  - Build responsive tabbed sidebar with intuitive grouping.
  - Connect all controls to `useStudioStore` and trigger debounced document re-compilation.
- [ ] **Step 4: Run test to verify it passes**
  - Run: `npm test tests/unit/sidebar-controls.test.ts`
  - Expected: PASS
- [ ] **Step 5: Commit**
  - `git add src/components/studio/ tests/unit/sidebar-controls.test.ts`
  - `git commit -m "feat(studio): implement page setup, typography, layout controls and sidebar"`

---

### Task 7: Live Preview Viewport, Zoom, Page Navigation & PDF Renderer

**Files:**
- Create: `src/components/preview/ZoomControls.tsx`
- Create: `src/components/preview/PageNav.tsx`
- Create: `src/components/preview/DOMPreviewFallback.tsx`
- Create: `src/components/preview/PDFViewer.tsx`
- Create: `src/components/preview/PreviewViewport.tsx`
- Test: `tests/unit/preview-viewport.test.ts`

**Interfaces:**
- Consumes: `useStudioStore`, `PDFRenderResult`, `LayoutIR`
- Produces: `ZoomControls`, `PageNav`, `DOMPreviewFallback`, `PDFViewer`, `PreviewViewport`

- [ ] **Step 1: Write the failing test (`tests/unit/preview-viewport.test.ts`)**
  - Test Zoom In / Out buttons clamp zoom scale between 25% and 200%.
  - Test Fit to Width and Fit to Page calculate and apply optimal zoom level.
  - Test Page Navigation previous/next buttons and page jump input update `currentPage`.
  - Test `DOMPreviewFallback` renders HTML table and KPI cards directly from `LayoutIR` when PDF is compiling or in fast preview mode.
  - Test `PDFViewer` renders PDF blob iframe/embed and calls `URL.revokeObjectURL` on URL change or unmount.
  - Test `PreviewViewport` centers the document with canvas grid background and page drop shadows.
- [ ] **Step 2: Run test to verify it fails**
  - Run: `npm test tests/unit/preview-viewport.test.ts`
  - Expected: FAIL with components not found.
- [ ] **Step 3: Implement preview components (`ZoomControls`, `PageNav`, `DOMPreviewFallback`, `PDFViewer`, `PreviewViewport`)**
  - Implement canvas pan/zoom container with CSS transforms.
  - Implement dual-mode preview (compiled PDF viewer + instant DOM fallback).
  - Implement memory-safe object URL handling with React `useEffect` cleanups.
- [ ] **Step 4: Run test to verify it passes**
  - Run: `npm test tests/unit/preview-viewport.test.ts`
  - Expected: PASS
- [ ] **Step 5: Commit**
  - `git add src/components/preview/ tests/unit/preview-viewport.test.ts`
  - `git commit -m "feat(studio): implement live preview viewport, zoom controls, and PDF viewer"`

---

### Task 8: Header, Floating Toolbar, Export Modal & PDF Download Flow

**Files:**
- Create: `src/components/studio/Header.tsx`
- Create: `src/components/studio/Toolbar.tsx`
- Create: `src/components/studio/ExportModal.tsx`
- Test: `tests/unit/export-flow.test.ts`

**Interfaces:**
- Consumes: `useStudioStore`, `downloadPDF`, `formatFileSize`
- Produces: `Header`, `Toolbar`, `ExportModal`

- [ ] **Step 1: Write the failing test (`tests/unit/export-flow.test.ts`)**
  - Test `Header` renders app branding, "100% In-Browser Private" badge, sample loader dropdown, and "Export PDF" CTA.
  - Test `Toolbar` renders compact zoom buttons, page navigation counter, view mode toggle (PDF vs DOM structure), and reset button.
  - Test `ExportModal` opens on CTA click, allows customizing PDF filename, shows file size, and executes `downloadPDF()`.
  - Test `ExportModal` includes a "Print Document" action calling `window.print()` or printing the PDF iframe.
- [ ] **Step 2: Run test to verify it fails**
  - Run: `npm test tests/unit/export-flow.test.ts`
  - Expected: FAIL with components not found.
- [ ] **Step 3: Implement `Header.tsx`, `Toolbar.tsx`, and `ExportModal.tsx`**
  - Build responsive Glassmorphism header and floating/docked toolbar.
  - Implement accessible modal dialog with focus trapping and download triggers.
- [ ] **Step 4: Run test to verify it passes**
  - Run: `npm test tests/unit/export-flow.test.ts`
  - Expected: PASS
- [ ] **Step 5: Commit**
  - `git add src/components/studio/Header.tsx src/components/studio/Toolbar.tsx src/components/studio/ExportModal.tsx tests/unit/export-flow.test.ts`
  - `git commit -m "feat(studio): implement header, floating toolbar, and PDF export modal"`

---

### Task 9: Responsive Studio Workspace Layout & Mobile Drawer

**Files:**
- Create: `src/components/layout/StudioLayout.tsx`
- Modify: `src/App.tsx`
- Test: `tests/unit/studio-layout.test.ts`

**Interfaces:**
- Consumes: All studio and preview components
- Produces: `StudioLayout`, complete interactive `App` component

- [ ] **Step 1: Write the failing test (`tests/unit/studio-layout.test.ts`)**
  - Test desktop layout renders Sidebar on left and PreviewViewport on right.
  - Test mobile layout collapses Sidebar into an accessible bottom sheet / drawer toggled by a floating button.
  - Test App switches seamlessly from Landing/Upload Dropzone state to Studio Workspace when a file is loaded.
  - Test App displays the animated `ProgressBar` during pipeline processing (`parsing` -> `layout` -> `compiling`).
  - Test App displays error toast/banner when an error occurs with a "Try Again" action.
- [ ] **Step 2: Run test to verify it fails**
  - Run: `npm test tests/unit/studio-layout.test.ts`
  - Expected: FAIL with layout or App tests failing.
- [ ] **Step 3: Implement `src/components/layout/StudioLayout.tsx` and update `src/App.tsx`**
  - Assemble full Studio workspace with responsive breakpoints (`375px`, `768px`, `1024px`, `1440px`).
  - Integrate touch-friendly mobile bottom sheet for controls (44px min touch targets).
  - Connect full pipeline orchestration in `App.tsx` with debounced reactive re-compilation.
- [ ] **Step 4: Run test to verify it passes**
  - Run: `npm test tests/unit/studio-layout.test.ts`
  - Expected: PASS
- [ ] **Step 5: Commit**
  - `git add src/components/layout/ src/App.tsx tests/unit/studio-layout.test.ts`
  - `git commit -m "feat(studio): assemble responsive studio workspace and mobile drawer layout"`

---

### Task 10: Full Interactive Studio UI Integration Suite & Verification

**Files:**
- Create: `tests/integration/studio-ui-flow.test.tsx`
- Modify: `PROJECT_STATE.md`

**Interfaces:**
- Validates the entire user journey: File Drop -> Worker Pipeline -> Live PDF Render -> Theme Switch (all 5 themes) -> Page Setup Changes -> Zoom & Navigation -> PDF Export.

- [ ] **Step 1: Write the comprehensive integration test (`tests/integration/studio-ui-flow.test.tsx`)**
  - Test 1: Uploading a CSV file progresses through pipeline and renders initial PDF preview in `modern-clean` theme.
  - Test 2: Switching theme to `emerald-report` re-compiles PDF and updates preview with emerald styling.
  - Test 3: Switching theme across all 5 themes (`modern-clean`, `executive-serif`, `compact-ledger`, `emerald-report`, `monochrome-pure`) succeeds without error.
  - Test 4: Changing page orientation to `landscape` and page size to `letter` re-compiles PDF correctly.
  - Test 5: Zooming and page navigation update view state smoothly.
  - Test 6: Clicking "Export PDF" opens modal and triggers download with correct metadata.
- [ ] **Step 2: Run integration tests**
  - Run: `npm test tests/integration/studio-ui-flow.test.tsx`
  - Expected: PASS
- [ ] **Step 3: Run full test suite, TypeScript typecheck & production build**
  - Run: `npm test -- --run`
  - Run: `npx tsc --noEmit`
  - Run: `npm run build`
  - Expected: All unit & integration tests passing (100% green), 0 type errors, production build generated.
- [ ] **Step 4: Update `PROJECT_STATE.md` with Sprint 4 completion notes**
- [ ] **Step 5: Commit**
  - `git add tests/integration/studio-ui-flow.test.tsx PROJECT_STATE.md`
  - `git commit -m "test(studio): add full studio UI flow integration test suite and complete Sprint 4"`

---

## Plan Self-Review Checklist

1. **Spec Coverage:**
   - Upload/dropzone & validation: Task 4
   - Parser -> Layout -> Typst pipeline: Task 2
   - Interactive Studio workspace: Tasks 6, 8, 9
   - Live PDF/document preview: Task 7
   - Page navigation and zoom: Task 7
   - Page size/orientation controls: Task 6
   - Layout mode controls: Task 6
   - Five launch themes: Task 5
   - Theme switching/live preview: Tasks 2, 5, 10
   - PDF export: Tasks 2, 8, 10
   - Responsive/mobile behavior: Tasks 3, 9
   - State management & error/loading states: Tasks 1, 2, 9
   - Tests and acceptance criteria: All Tasks (1–10)
   - Context/performance considerations: Global Constraints & Review Focus

2. **Placeholder Scan:** No "TBD", "TODO", "implement later", or vague steps. Every task defines explicit files, interfaces, and test/commit steps.

3. **Type Consistency:** Types defined in `src/types/studio.ts`, `src/types/typst.ts`, `src/types/layout-ir.ts`, and `src/types/cell-ir.ts` are strictly respected across all tasks.

4. **Review Focus:**
   - Blob URL memory cleanup: Task 2, Task 7
   - Worker concurrency & debounce: Task 1, Task 2, Task 9
   - Large file / invalid file error handling: Task 4, Task 9
   - Mobile responsive touch targets & drawer: Task 3, Task 9
   - Fast DOM preview fallback: Task 7
