# Implementation Plan: Project Manager

**Spec:** [spec.md](./spec.md)
**Created:** 2026-03-23
**Status:** Draft

## Summary

แทน folder browser ด้วยระบบ project management:
1. **Project list** — add/remove projects by path, persist ใน JSON file
2. **File browser** — browse files ภายใน project, view content + syntax highlighting
3. **Git integration** — git status (changed files list) + git diff (inline diff view)

## Technical Context

| Aspect | Decision |
|--------|----------|
| Language/Version | TypeScript (existing monorepo) |
| New Dependencies | `prism-react-renderer` (syntax highlighting) |
| Project Storage | JSON file (`~/.cc-monitor/projects.json`) |
| Git Commands | `git status --porcelain`, `git diff HEAD`, `git branch --show-current` via execFile |
| File Access | `fs.readdir`, `fs.readFile` with path validation |
| Security | Reuse `isPathWithinRoot` — root = project path |
| Testing | Vitest (existing) |

## Constitution Check

- [x] Quality Over Speed — plan includes security boundary
- [x] User First — replaces inconvenient folder browser
- [x] Simplicity — JSON file storage, no database, reuse path-guard
- [x] Spec-Driven — following workflow
- [x] Codebase Consistency — same patterns

## Project Structure

### New/Modified Files
```
server/src/
├── routes/
│   ├── projects.ts       # NEW: CRUD /api/projects
│   ├── project-files.ts  # NEW: /api/projects/:id/files
│   ├── project-git.ts    # NEW: /api/projects/:id/git
│   └── sessions.ts       # Modified: accept projectId
├── services/
│   ├── project-store.ts  # NEW: JSON file persistence
│   └── git.ts            # NEW: git status/diff commands
└── types.ts              # Modified: add Project, FileEntry, GitChange types

client/src/
├── components/
│   ├── ProjectList.tsx     # NEW: replaces FolderBrowser
│   ├── AddProject.tsx      # NEW: input to add project
│   ├── ProjectFiles.tsx    # NEW: file tree browser
│   ├── FileViewer.tsx      # NEW: file content + syntax highlighting
│   ├── GitChanges.tsx      # NEW: list of changed files
│   ├── DiffViewer.tsx      # NEW: inline diff view
│   └── ProjectPanel.tsx    # NEW: tabs (Terminal / Files / Changes)
├── hooks/
│   ├── useProjects.ts      # NEW: fetch/add/remove projects
│   ├── useProjectFiles.ts  # NEW: browse files, read content
│   └── useGitStatus.ts     # NEW: git status + diff
└── App.tsx                 # Modified: replace FolderBrowser with ProjectList + ProjectPanel
```

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                     Browser                           │
│ ┌─────────────┐  ┌────────────────────────────────┐  │
│ │  Project     │  │  Project Panel                 │  │
│ │  List        │  │  ┌─────────┬───────┬────────┐ │  │
│ │  + Add       │  │  │Terminal │ Files │Changes │ │  │
│ │  - Remove    │  │  ├─────────┴───────┴────────┤ │  │
│ │              │  │  │  [active tab content]     │ │  │
│ └──────┬───────┘  └────────────┬─────────────────┘  │
│        │REST                   │REST + WS            │
└────────┼───────────────────────┼─────────────────────┘
         │                       │
┌────────┼───────────────────────┼─────────────────────┐
│        ▼                       ▼                      │
│  /api/projects          /api/projects/:id/*           │
│  (CRUD)                 /files, /git/status, /git/diff│
│        │                       │                      │
│        ▼                       ▼                      │
│  project-store.ts        fs + execFile(git)           │
│  (~/.cc-monitor/         (path-guarded)               │
│   projects.json)                                      │
└───────────────────────────────────────────────────────┘
```

## Key Technical Decisions

1. **JSON file for persistence** — simple, no migration, human-editable
2. **prism-react-renderer** — lightweight syntax highlighting, client-side only
3. **git execFile** — no git library needed, just shell out to git CLI
4. **Lazy file tree** — load directory contents on expand, not upfront
5. **Tabbed project panel** — Terminal / Files / Changes tabs in main area
6. **Path validation per-project** — each project's root is its security boundary

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| Git diff parser | Need structured diff data for rendering | Raw text diff — harder to render with line numbers and colors |
