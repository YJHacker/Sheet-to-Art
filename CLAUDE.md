# Sheet-to-Art — Developer & Assistant Guidelines

## 1. How to Resume the Project in Future Sessions

When starting or resuming a session on this repository, follow this exact sequence:

1. **Read `PROJECT_STATE.md` first:** Understand the current project phase, completed sprints, test counts, and pending roadmap tasks.
2. **Inspect the Git status and recent commits:** Verify what was committed and what remains staged or uncommitted (`git status`, `git log -n 5 --oneline`).
3. **Verify the test baseline:** Run `npm test` to ensure all 170+ unit and integration tests pass before modifying any code.
4. **Check Logo / Brand Status:** Inspect `logo_sheettoart/FINAL_SELECTION.md`. Do not integrate a permanent logo until the user explicitly selects one of the three preserved concepts.

---

## 2. Critical Files to Inspect First

| File | Purpose & Significance |
| :--- | :--- |
| **`PROJECT_STATE.md`** | Single source of truth for architectural state, sprint progress, and quality gate metrics. |
| **`logo_sheettoart/`** | Preserved vector SVG assets and HTML presentations for the 3 candidate brand concepts. |
| **`src/App.tsx`** | Main application orchestrator managing file ingestion, studio transition, and persistence hooks. |
| **`src/lib/typst/typst-compiler.ts`** | Typst WASM compilation bridge and vector SVG text glyph post-processor. |
| **`src/lib/typst/typst-generator.ts`** | Typst 0.11+ source markup generator with multi-section layout logic and theme styling. |
| **`src/lib/layout/section-detector.ts`** | Semantic section segmenter preventing complex multi-table sheets from collapsing. |
| **`src/components/layout/StudioLayout.tsx`** | Studio layout workspace uniting Header, Sidebar, and Preview Viewport. |

---

## 3. Preserving the Working PDF Generation Pipeline

The client-side PDF generation pipeline is fragile and must be preserved:

- **Vector Glyph Post-Processing:** In `src/lib/typst/typst-compiler.ts`, vector SVGs must be post-processed to replace `fill: var(--glyph_fill)` with `fill: var(--glyph_fill, inherit)` and `stroke: var(--glyph_stroke, none)`. Omitting this causes text in vector previews to become completely invisible.
- **ArrayBuffer Cloning:** When switching between sheets in multi-sheet workbooks, always pass cloned buffer slices (`buffer.slice(0)`) to Web Workers to prevent `ArrayBuffer` detachment errors.
- **WASM Memory & Offline Execution:** Compilation runs 100% offline via `@myriaddreamin/typst.ts`. Do not introduce network dependencies or server-side rendering routes.
- **Typst Markup Sanitization:** Always sanitize cell text using `escapeTypstText()` to prevent syntax errors caused by special characters (`\`, `#`, `$`, `[`, `]`, `*`, `_`, `@`, `<`, `>`, `"`, `~`).

---

## 4. Verification Before Claiming Completion

Before declaring any task or feature completed, you **must** run and verify:

1. **Full Test Suite:** `npm test` (all 170+ tests across 39+ files must pass).
2. **TypeScript Strict Typecheck:** `npx tsc --noEmit` (must exit with code 0).
3. **Vite Production Build:** `npm run build` (must build cleanly with all 3 worker bundles and WASM assets).
4. **Real Workbook Acceptance:** Verify against the real GATE 2027 workbook fixture (`tests/fixtures/GATE2027_Tracker_AllBranches.xlsx`) across all 7 sheets (`START HERE`, `CS`, `DA`, `ECE`, `EE`, `ME`, `CE`).

---

## 5. Commit & Git Rules

- **No Unprompted Commits:** Do not commit or push unless explicitly requested or authorized by the user.
- **Clean Diff Inspection:** Always run `git status` and `git diff` before committing. Exclude temporary build artifacts, scratch scripts, or unverified changes.
- **Keep `PROJECT_STATE.md` Synchronized:** When completing tasks, record exact test counts, file modifications, and limitations in `PROJECT_STATE.md`.

---

## 6. MCP Tools: code-review-graph

**This project has a knowledge graph. Start with the code-review-graph
MCP tools to narrow scope, then read the source.** The graph is cheaper than scanning files and
gives you structural context (callers, dependents, test coverage) that file search cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

### Verify in the source

- Narrow scope with the graph, then read the source. Do not change code from graph output alone.
- For any non-trivial change, read the implementation and the relevant tests before concluding.
- Verify the exact source when touching behavior, database logic, migrations, retries, fallbacks, recovery, or compatibility code.
- When the graph and the source disagree, the source wins.
