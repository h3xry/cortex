# Tasks: Spec Viewer

**Plan:** [plan.md](./plan.md)
**Created:** 2026-03-23
**Total Tasks:** 10

---

## Phase 1: Setup

- [ ] T001 Install dependencies — `npm install react-markdown remark-gfm mermaid -w client`

**Checkpoint:** Dependencies installed

---

## Phase 2: User Story 1 — Browse and Read Specs (P1) MVP

**Goal:** User opens Specs tab, sees feature list, clicks to read rendered markdown
**Independent Test:** Select project → Specs tab → see features → click → read spec.md

- [ ] T002 [P] [US1] Create `useSpecs` hook in `client/src/hooks/useSpecs.ts` — fetch feature dirs from `/api/projects/:id/files?path=.claude/specs`, fetch files within feature, fetch file content, track selected feature + file
- [ ] T003 [P] [US1] Create SpecBrowser component in `client/src/components/SpecBrowser.tsx` — left sidebar: feature list (click to expand file list), file list (.md files), highlight selected
- [ ] T004 [US1] Create MarkdownViewer component in `client/src/components/MarkdownViewer.tsx` — render markdown with react-markdown + remark-gfm, style code blocks with prism-react-renderer, dark theme styling
- [ ] T005 [US1] Add Specs tab to ProjectPanel in `client/src/components/ProjectPanel.tsx` — wire SpecBrowser + MarkdownViewer in split view
- [ ] T006 [US1] Add CSS for SpecBrowser, MarkdownViewer in `client/src/index.css` — spec nav sidebar, markdown content styles (headings, tables, code, lists), dark theme

**Checkpoint:** Can browse and read specs with formatted markdown

---

## Phase 3: User Story 2 — Mermaid Diagrams (P1)

**Goal:** Mermaid code blocks render as visual diagrams
**Independent Test:** Open spec with mermaid block → see rendered diagram

- [ ] T007 [US2] Add MermaidBlock component in `client/src/components/MarkdownViewer.tsx` — detect `mermaid` language in code blocks, call `mermaid.render()`, display SVG, handle errors gracefully
- [ ] T008 [US2] Configure mermaid theme in `client/src/components/MarkdownViewer.tsx` — dark theme matching Catppuccin, initialize mermaid once

**Checkpoint:** Mermaid diagrams render inline

---

## Phase 4: Polish

- [ ] T009 Handle edge cases — "No specs found" message, subdirectories (contracts/, checklists/), large files
- [ ] T010 Test manually — open specs from this project, verify markdown + mermaid render

---

## Dependencies

```
Phase 1 (Setup)
  └── Phase 2 (US1: Browse + Read) ← MVP
        └── Phase 3 (US2: Mermaid)
              └── Phase 4 (Polish)
```
