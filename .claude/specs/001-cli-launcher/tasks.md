# Tasks: CLI Launcher

**Plan:** [plan.md](./plan.md)
**Created:** 2026-03-23
**Total Tasks:** 29

---

## Phase 1: Setup

- [x] T001 [P] Initialize npm workspace in root `package.json` with `server/` and `client/` workspaces
- [x] T002 [P] Create `server/package.json` with dependencies: express, ws, uuid, cors; devDependencies: typescript, vitest, @types/express, @types/ws, tsx
- [x] T003 [P] Create `client/package.json` with dependencies: react, react-dom, @xterm/xterm, @xterm/addon-fit; devDependencies: typescript, vite, @vitejs/plugin-react, vitest, @testing-library/react, jsdom, @types/react, @types/react-dom
- [x] T004 Create shared TypeScript configs: root `tsconfig.json`, `server/tsconfig.json`, `client/tsconfig.json`
- [x] T005 Create `client/vite.config.ts` with React plugin and API proxy to `http://localhost:3001`
- [x] T006 Create `client/index.html` with root div mount point

**Checkpoint:** `npm install` succeeds ✅

---

## Phase 2: Foundation (BLOCKS all stories)

- [x] T007 [P] Create shared types in `server/src/types.ts` — Session, FolderEntry, SessionStatus enum per data-model.md
- [x] T008 [P] Create shared types in `client/src/types.ts` — matching server types + WebSocket message types
- [x] T009 Implement tmux service in `server/src/services/tmux.ts` — createSession, killSession, listSessions, capturePaneOutput (wrapping tmux CLI commands via execFile for security)
- [x] T010 Write tests for tmux service in `server/tests/tmux.test.ts` — mock child_process.execFile, test command construction
- [x] T011 Implement session manager in `server/src/services/session-manager.ts` — create/get/list/delete sessions, in-memory Map, output buffer (100KB), max 10 sessions validation
- [x] T012 Write tests for session manager in `server/tests/sessions.test.ts` — CRUD operations, max sessions limit, status transitions
- [x] T013 Create Express server entry point in `server/src/index.ts` — Express app + HTTP server + WebSocket upgrade setup, CORS, JSON body parser

**Checkpoint:** Server tests pass (19/19) ✅

---

## Phase 3: User Story 2 — Browse and Select Folder (P1)

**Goal:** User can browse file system and select a folder
**Independent Test:** Open web → see folders → navigate → select a folder

- [x] T014 Implement folder route in `server/src/routes/folders.ts` — GET /api/folders per contracts/api.md, fs.readdir with dirent, filter hidden/unreadable, default to home dir
- [x] T015 Write tests for folder route in `server/tests/folders.test.ts` — valid path, invalid path, nonexistent path, default path
- [x] T016 [P] Create `useFolders` hook in `client/src/hooks/useFolders.ts` — fetch folders, navigate, track selected path
- [x] T017 [P] Create FolderBrowser component in `client/src/components/FolderBrowser.tsx` — folder list, click to navigate, parent nav, show selected path
- [x] T018 Create App shell in `client/src/App.tsx` and `client/src/main.tsx` — layout with sidebar (FolderBrowser) + main area, wire up FolderBrowser

**Checkpoint:** Folder browser implemented ✅

---

## Phase 4: User Story 1 — Launch CLI in Selected Folder (P1) MVP

**Goal:** User selects folder and launches Claude Code CLI, sees terminal output real-time
**Independent Test:** Select folder → Launch → see CLI output streaming in xterm.js

- [x] T019 Implement session routes in `server/src/routes/sessions.ts` — POST /api/sessions (create tmux session + claude CLI), GET /api/sessions, DELETE /api/sessions/:id per contracts/api.md
- [x] T020 Implement WebSocket terminal handler in `server/src/ws/terminal.ts` — upgrade connection on /ws/sessions/:id, stream tmux pipe-pane output, send buffered output on connect, handle session end
- [x] T021 [P] Create `useSessions` hook in `client/src/hooks/useSessions.ts` — fetch sessions, create session, delete session
- [x] T022 [P] Create `useTerminal` hook in `client/src/hooks/useTerminal.ts` — WebSocket connection, attach to xterm.js Terminal instance, handle reconnect
- [x] T023 [P] Create LaunchButton component in `client/src/components/LaunchButton.tsx` — launch button with selected folder path, loading state, error display
- [x] T024 Create TerminalView component in `client/src/components/TerminalView.tsx` — xterm.js Terminal, addon-fit for auto-resize, connect via useTerminal hook
- [x] T025 Wire launch flow in `client/src/App.tsx` — LaunchButton triggers session creation, on success show TerminalView with session ID

**Checkpoint:** Full MVP flow implemented ✅

---

## Phase 5: User Story 3 — View Active Sessions (P2)

**Goal:** User sees all sessions and switches between them
**Independent Test:** Launch 2+ sessions → see list → click to switch → each shows own output

- [x] T026 [P] Create SessionList component in `client/src/components/SessionList.tsx` — list active sessions with status badge (running/ended), folder path, created time, click to select
- [x] T027 Update `client/src/App.tsx` — add SessionList to sidebar, wire session selection to TerminalView, support switching between sessions

**Checkpoint:** Session list with switching ✅

---

## Phase 6: Polish & Cross-Cutting

- [x] T028 Add CSS styling (Catppuccin Mocha theme) and error messages across all components
- [x] T029 Run server tests — all 19 pass

---

## Dependencies

```
Phase 1 (Setup) ✅
  └── Phase 2 (Foundation) ✅
        ├── Phase 3 (US2: Folder Browser) ✅
        │     └── Phase 4 (US1: Launch CLI) ✅ ← MVP
        │           └── Phase 5 (US3: Session List) ✅
        └──────────────────────────────────────────┘
                          └── Phase 6 (Polish) ✅
```

## Implementation Strategy

### MVP First (Recommended)
1. Phase 1 + 2: Setup & Foundation ✅
2. Phase 3: Folder Browser (can see folders) ✅
3. Phase 4: Launch CLI (full MVP flow) ✅
4. Phase 5: Session management ✅
5. Phase 6: Polish ✅
