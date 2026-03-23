# Tasks: Session Input & Tool Selector

**Plan:** [plan.md](./plan.md)
**Created:** 2026-03-23
**Total Tasks:** 18

---

## Phase 1: Foundation (BLOCKS all stories)

- [x] T001 [P] Add `WsClientMessage` type to `server/src/types.ts`
- [x] T002 [P] Add `WsClientMessage`, `ToolConfig`, `ToolPreset` types to `client/src/types.ts`
- [x] T003 [P] Add `allowedTools` field to `Session` interface in both types files
- [x] T004 Create tools route in `server/src/routes/tools.ts` — GET /api/tools
- [x] T005 Register tools route in `server/src/index.ts`

**Checkpoint:** Foundation ready ✅

---

## Phase 2: User Story 1 — Send Input to Session (P1) MVP

- [x] T006 [US1] Handle client→server WebSocket messages in `server/src/ws/terminal.ts`
- [x] T007 [US1] Update tests for changed tmux args and new mocks
- [x] T008 [P] [US1] Expose `sendInput`/`sendControl` from `useTerminal` hook
- [x] T009 [P] [US1] Create TerminalInput component in `client/src/components/TerminalInput.tsx`
- [x] T010 [US1] Integrate TerminalInput into TerminalView
- [x] T011 [US1] Add CSS styles for TerminalInput

**Checkpoint:** Input works ✅

---

## Phase 3: User Story 2 — Tool Selector on Launch (P1)

- [x] T012 [P] [US2] Create `useTools` hook in `client/src/hooks/useTools.ts`
- [x] T013 [P] [US2] Create ToolSelector component in `client/src/components/ToolSelector.tsx`
- [x] T014 [US2] Update `POST /api/sessions` to accept `allowedTools`
- [x] T015 [US2] Update `createSession` to build `--allowedTools` flag
- [x] T016 [US2] Integrate ToolSelector into App
- [x] T017 [US2] Add CSS styles for ToolSelector

**Checkpoint:** Tool selector works ✅

---

## Phase 4: Polish

- [x] T018 Fix tests for updated code (tmux args, mocks, config port)

---

## Dependencies

```
Phase 1 (Foundation) ✅
  ├── Phase 2 (US1: Input) ✅ ← MVP
  └── Phase 3 (US2: Tool Selector) ✅
       └── Phase 4 (Polish) ✅
```
