# Tasks: Project Manager

**Plan:** [plan.md](./plan.md)
**Created:** 2026-03-23
**Total Tasks:** 30

---

## Phase 1: Foundation (BLOCKS all stories)

- [ ] T001 Add Project, FileEntry, GitChange, GitDiff types to `server/src/types.ts`
- [ ] T002 [P] Add matching types to `client/src/types.ts`
- [ ] T003 Install `prism-react-renderer` in client — `npm install prism-react-renderer -w client`
- [ ] T004 Implement project-store service in `server/src/services/project-store.ts` — load/save JSON file (`~/.cortex/projects.json`), add/remove/list/getById
- [ ] T005 Write tests for project-store in `server/tests/project-store.test.ts` — CRUD, persistence, duplicate detection, invalid path rejection
- [ ] T006 Implement git service in `server/src/services/git.ts` — isGitRepo, getBranch, getStatus (parse `git status --porcelain`), getDiff (parse `git diff HEAD` into structured hunks), all via execFile
- [ ] T007 Write tests for git service in `server/tests/git.test.ts` — mock execFile, test status parsing, diff parsing, non-git repo handling

**Checkpoint:** project-store and git service work with tests passing

---

## Phase 2: User Story 1 — Add and Manage Projects (P1) MVP

**Goal:** User adds projects by path, sees them in sidebar, launches sessions from them
**Independent Test:** Type path → Add → see in list → click → launch Claude Code

- [ ] T008 [US1] Create projects route in `server/src/routes/projects.ts` — GET /api/projects, POST /api/projects, DELETE /api/projects/:id per contracts/api.md
- [ ] T009 [US1] Write tests for projects route in `server/tests/projects.test.ts` — add, list, remove, invalid path, duplicate
- [ ] T010 [US1] Register projects route in `server/src/index.ts`
- [ ] T011 [US1] Update `POST /api/sessions` in `server/src/routes/sessions.ts` — accept `projectId`, resolve path from project-store
- [ ] T012 [P] [US1] Create `useProjects` hook in `client/src/hooks/useProjects.ts` — fetch/add/remove projects
- [ ] T013 [P] [US1] Create AddProject component in `client/src/components/AddProject.tsx` — path input + Add button + error display
- [ ] T014 [P] [US1] Create ProjectList component in `client/src/components/ProjectList.tsx` — list of projects with select + remove buttons
- [ ] T015 [US1] Create ProjectPanel component in `client/src/components/ProjectPanel.tsx` — tabbed view (Terminal / Files / Changes), renders TerminalView for Terminal tab
- [ ] T016 [US1] Update `client/src/App.tsx` — replace FolderBrowser with ProjectList + AddProject in sidebar, replace main content with ProjectPanel
- [ ] T017 [US1] Remove FolderBrowser component and useFolders hook — delete `client/src/components/FolderBrowser.tsx` and `client/src/hooks/useFolders.ts`
- [ ] T018 [US1] Update `client/src/hooks/useSessions.ts` — createSession accepts projectId instead of folderPath
- [ ] T019 [US1] Add CSS styles for ProjectList, AddProject, ProjectPanel in `client/src/index.css`

**Checkpoint:** Project list replaces folder browser, can launch sessions from projects

---

## Phase 3: User Story 3 — View Git Diff (P1)

**Goal:** User sees changed files and inline diff for the selected project
**Independent Test:** Select project with changes → Changes tab → see file list → click → see diff

- [ ] T020 [US3] Create project-git route in `server/src/routes/project-git.ts` — GET /api/projects/:id/git/status, GET /api/projects/:id/git/diff?file= per contracts/api.md
- [ ] T021 [US3] Register project-git route in `server/src/index.ts`
- [ ] T022 [P] [US3] Create `useGitStatus` hook in `client/src/hooks/useGitStatus.ts` — fetch git status + diff for selected project
- [ ] T023 [P] [US3] Create GitChanges component in `client/src/components/GitChanges.tsx` — list changed files with status badges (M/A/D), click to view diff
- [ ] T024 [P] [US3] Create DiffViewer component in `client/src/components/DiffViewer.tsx` — render hunks with green/red line coloring, line numbers
- [ ] T025 [US3] Wire Changes tab in ProjectPanel — show GitChanges + DiffViewer
- [ ] T026 [US3] Add CSS styles for GitChanges, DiffViewer in `client/src/index.css`

**Checkpoint:** Git changes visible, inline diff works

---

## Phase 4: User Story 2 — Browse Project Files (P2)

**Goal:** User browses files within project and views content with syntax highlighting
**Independent Test:** Select project → Files tab → expand folders → click file → see highlighted content

- [ ] T027 [US2] Create project-files route in `server/src/routes/project-files.ts` — GET /api/projects/:id/files?path=, GET /api/projects/:id/files/content?path= per contracts/api.md, with path validation
- [ ] T028 [P] [US2] Create `useProjectFiles` hook in `client/src/hooks/useProjectFiles.ts` — fetch directory entries, fetch file content
- [ ] T029 [P] [US2] Create ProjectFiles component in `client/src/components/ProjectFiles.tsx` — lazy-load file tree with expand/collapse
- [ ] T030 [P] [US2] Create FileViewer component in `client/src/components/FileViewer.tsx` — display file content with prism-react-renderer syntax highlighting
- [ ] T031 [US2] Wire Files tab in ProjectPanel — show ProjectFiles + FileViewer
- [ ] T032 [US2] Add CSS styles for ProjectFiles, FileViewer in `client/src/index.css`

**Checkpoint:** File browser and viewer work within project boundary

---

## Phase 5: Polish

- [ ] T033 Run quickstart.md validation scenarios (all 8 scenarios)

---

## Dependencies

```
Phase 1 (Foundation)
  └── Phase 2 (US1: Project CRUD + Launch) ← MVP
        ├── Phase 3 (US3: Git Diff) ← P1
        └── Phase 4 (US2: File Browser) ← P2
              └── Phase 5 (Polish)
```

## Implementation Strategy

### MVP First
1. Phase 1 + 2: Project list + launch sessions
2. **STOP → validate: can add project and launch session**
3. Phase 3: Git diff (high value — see what Claude changed)
4. Phase 4: File browser
5. Phase 5: Polish
