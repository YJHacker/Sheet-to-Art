# Sheet-to-Art: UI/UX & Creative Software Design Research Report

**Document Version:** 1.0  
**Date:** September 28, 2026  
**Project:** Sheet-to-Art (Spreadsheet → Intelligent Document → Beautiful PDF Engine)  
**Author:** Antigravity / Claude Code  
**Status:** Completed & Documented  

---

## 1. Executive Summary & Research Scope

This research report establishes an original, cohesive, and modern design direction for **Sheet-to-Art**. It investigates design patterns across leading creative software interfaces, document editors, and premium SaaS applications, with dedicated analysis for desktop, tablet, and mobile form factors.

### Important Brand & Aesthetic Boundary
- **Logo Identity:** The user has selected **Concept 3: The Golden Folio (Swiss Edition)** with the finalized wordmark **"Sheet to Art"**.
- **UI Independence:** The selection of the Golden Folio logo applies to the brand identity assets. The web application interface does **not** adopt a traditional static serif editorial layout. Instead, it embodies a **modern, ergonomic, creative SaaS software identity** (inspired by tools like Linear, Figma, Pitch, Raycast, and Typst Web) while harmoniously integrating the Golden Folio mark.

---

## 2. Environment & Pinterest Access Investigation

### Investigation Findings
- **Pinterest MCP Server:** Not configured in the current runtime environment.
- **Claude in Chrome / Browser Extension:** Unavailable in this headless Linux CLI container environment.
- **Authentication Safeguard:** No user credentials or passwords were requested or stored.
- **Methodology Applied:** To achieve rigorous research without direct Pinterest API access, we conducted multi-angle research leveraging:
  1. Deep domain queries across the installed `ui-ux-pro-max` design intelligence database (spanning 79 design styles, 192 product palettes, 74 typography pairings, and 119 UX guidelines).
  2. Pattern audits of benchmark creative software applications (Linear, Figma, Pitch, Raycast, Overleaf, Typst Web, Notion, Craft Docs).
  3. Responsive and mobile/tablet ergonomics benchmarks (WCAG 2.2 AA, 44×44px touch targets, mobile drawer patterns).

---

## 3. Creative Software & SaaS Pattern Reference Library

### Reference 1: Linear (Linear.app)
- **Category:** Premium SaaS & Workflow Ergonomics
- **Pattern Demonstrated:** High-density, keyboard-driven navigation, glassmorphism surface layering (`backdrop-blur-md` with 1px hairline borders), subtle active pill indicators, and zero redundant controls.
- **Why It Is Useful:** Eliminates visual clutter, maximizes content readability, and provides instant visual feedback for user interactions.
- **Adaptation for Sheet-to-Art:** 
  - Apply clean hairline borders (`border-zinc-200 / dark:border-zinc-800`) and translucent frosted glass headers/toolbars.
  - Implement segmented pill controls for Preview Mode toggling ("PDF Vector View" vs "Document HTML View").
- **Devices Applicable:** Desktop, Tablet, Mobile.

### Reference 2: Figma / FigJam (Figma.com)
- **Category:** Creative Workspace & Canvas Viewport
- **Pattern Demonstrated:** Floating canvas viewport toolbar, dynamic zoom controls (Fit Width, Fit Page, 50%–200%), minimal perimeter chrome, and pan/scroll canvas boundaries.
- **Why It Is Useful:** Keeps the rendered document as the primary hero focal point while keeping view controls accessible without obscuring the canvas.
- **Adaptation for Sheet-to-Art:**
  - Floating bottom/top floating pill toolbar inside the preview viewport with zoom percentage, zoom-in/zoom-out buttons, fit-width/fit-page quick triggers, and page navigation controls.
  - Generous canvas padding with authentic drop shadows (`shadow-2xl`) around paginated PDF pages to simulate real physical sheets.
- **Devices Applicable:** Desktop, Tablet.

### Reference 3: Typst Web / Overleaf
- **Category:** Typesetting & Document Compilers
- **Pattern Demonstrated:** Split-pane reactive layout with asynchronous background compilation feedback, document structure outline drawer, and live sheet/page jump links.
- **Why It Is Useful:** Allows users to understand complex multi-page document structures and jump directly to specific tables or sections.
- **Adaptation for Sheet-to-Art:**
  - Collapsible Document Outline accordion in the sidebar displaying auto-detected sections (KPI Grids, Data Tables, Explanatory Notes) with section item counts and quick-scroll anchors.
  - Subtle non-blocking status indicator during WASM background compilation.
- **Devices Applicable:** Desktop, Tablet.

### Reference 4: Pitch / Craft Docs (Craft.do)
- **Category:** Modern Document & Presentation Editors
- **Pattern Demonstrated:** Visual theme cards with live color palette swatches, clean card-based layout controls, and distraction-free export modals.
- **Why It Is Useful:** Makes aesthetic choices immediately graspable before applying them, reducing trial-and-error clicks.
- **Adaptation for Sheet-to-Art:**
  - 5-Theme visual selector with rich multi-color palette dots, active border rings, and theme descriptions.
  - Clean export modal with filename customization, estimated file size badge, and direct download/print triggers.
- **Devices Applicable:** Desktop, Tablet, Mobile.

### Reference 5: Raycast (Raycast.com)
- **Category:** Modern Productivity & Tactile Feedback
- **Pattern Demonstrated:** Monospace technical badges for dimensions, file formats, and timestamps; crisp status pills with micro-dot status indicators.
- **Why It Is Useful:** Delivers precise technical telemetry (e.g., cell count, sheet dimensions, WASM compilation time) without visual noise.
- **Adaptation for Sheet-to-Art:**
  - Header and sidebar metadata badges with `JetBrains Mono` / `ui-monospace` styling for file size, sheet dimensions (e.g. `16 cols × 42 rows`), and 100% client-side privacy verification.
- **Devices Applicable:** Desktop, Tablet, Mobile.

---

## 4. Typography & Color System Direction

### 4.1 UI Application Typography
- **Primary Interface Font:** `Plus Jakarta Sans` / `Inter`, `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - High legibility, neutral modern grotesque character, excellent rendering at 12px–16px UI control scales.
- **Technical & Metric Accents:** `JetBrains Mono`, `ui-monospace, SFMono-Regular, monospace`
  - Used for file dimensions, cell coordinates, page counts, and data-density indicators.
- **Rendered Document Typography:**
  - Distinct from the application UI. The rendered document faithfully renders the chosen document theme (`modern-clean`, `executive-serif`, `compact-ledger`, `emerald-report`, `monochrome-pure`).

### 4.2 Application Color Palette (Glassmorphism & Crisp Neutrals)

| Token | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| **`--color-surface-canvas`** | `#F8FAFC` (Light) / `#09090B` (Dark) | Canvas backdrop behind document pages |
| **`--color-surface-card`** | `#FFFFFF` / `rgba(255, 255, 255, 0.85)` | Sidebar cards, panels, floating toolbars |
| **`--color-surface-glass`** | `rgba(255, 255, 255, 0.75)` / `blur(12px)` | Frosted header and floating controls |
| **`--color-text-primary`** | `#0F172A` (Slate 900) / `#F8FAFC` | Primary headings, active tab labels |
| **`--color-text-secondary`** | `#475569` (Slate 600) / `#94A3B8` | Subtitles, control labels, section titles |
| **`--color-text-muted`** | `#64748B` (Slate 500) / `#64748B` | Helper text, metadata badges |
| **`--color-border-subtle`** | `#E2E8F0` / `#27272A` | Panel borders, divider lines |
| **`--color-border-hover`** | `#CBD5E1` / `#3F3F46` | Interactive hover borders |
| **`--color-brand-primary`** | `#2563EB` (Blue 600) | Primary actions, focus rings, active tabs |
| **`--color-brand-accent`** | `#DC2626` (Red 600 / Vermillion) | Golden Folio brand focal node accent |
| **`--color-success`** | `#059669` (Emerald 600) | Privacy 100% offline badge, valid checks |

---

## 5. Responsive & Device-Specific UX Architecture

### 5.1 Desktop Workspace (≥ 1024px)
- **Layout:** Split-pane interactive layout.
  - Left Pane (340px–380px fixed width): Collapsible Control Sidebar containing Sheet Selector, Theme Carousel, Page Setup, Layout Mode, and Document Outline.
  - Right Pane (flex 1): Canvas Viewport with floating Zoom/Page toolbar and paginated PDF preview.
  - Top Bar: Brand logo, active workbook tab bar, preview toggle, export button.

### 5.2 Tablet Workspace (768px – 1023px)
- **Layout:** Compact split-pane or side-drawer.
  - Collapsible sidebar that can be toggled via an inspector button.
  - Full-width canvas preview with touch pan/zoom support.
  - Touch target sizes minimum 44×44px.

### 5.3 Mobile Workspace (< 768px)
- **Layout:** Single-column mobile-first workspace.
  - Top compact header with logo mark, sheet dropdown, and quick Export action.
  - Horizontal scrollable Theme Selector strip directly beneath header.
  - Central preview viewport with tap-to-zoom and pinch gestures.
  - Bottom navigation sheet / drawer for advanced Page Setup and Layout options.

---

## 6. Synthesized Design Refinements for Sheet-to-Art

Based on this research, the following refinements are planned for the Sheet-to-Art website UI:

1. **Brand Integration:** Display the official Golden Folio logo cleanly in the top-left Header and Upload Dropzone without forcing serif styling onto the UI controls.
2. **Elimination of Redundant Controls:** Streamline duplicate sheet selectors between Header and Sidebar; ensure a unified, intuitive multi-sheet tab bar in the Header with a compact sheet selector in the Sidebar.
3. **Enhanced Visual Hierarchy:** Add clear section grouping in the Sidebar with polished iconography, helper tooltips, and collapsible accordion sections.
4. **Interactive Document Preview Controls:** Enhance the floating Toolbar with clear zoom buttons (+, -, 100%, Fit Width), two-page/one-page layout toggles, and seamless switching between PDF Vector View and HTML Document View.
5. **Polished Micro-Interactions & Transitions:** Smooth 150ms–200ms ease-out transitions on hover, active button press states, subtle loading shimmers during compilation, and accessible focus rings (`ring-2 ring-blue-500/20`).
6. **Mobile Drawer & Touch Target Hardening:** Ensure all buttons, selects, and switches meet the 44px touch target standard on mobile viewports.
