# Research: 003-project-manager

**Created:** 2026-03-23

---

## 1. Project Persistence

**Decision:** JSON file at `~/.cortex/projects.json`
**Rationale:** Simple, no database dependency, easy to edit manually. Server reads/writes on demand. File is outside the project directory so it works across projects.
**Alternatives:**
- SQLite — overkill for a list of paths
- localStorage on client — doesn't persist across different browsers/devices
- In-memory — lost on server restart (spec requires persistence)

## 2. Syntax Highlighting for File Viewer

**Decision:** Prism.js via `prism-react-renderer`
**Rationale:** Lightweight, supports 200+ languages, works client-side, no server-side processing. Well-maintained React wrapper available. Zero config — auto-detects language from file extension.
**Alternatives:**
- highlight.js — heavier, more languages but we don't need that many
- Monaco Editor (read-only) — too heavy for just viewing, brings entire VS Code editor
- Server-side highlighting — unnecessary network overhead

## 3. Git Diff Format

**Decision:** `git diff HEAD` parsed server-side, sent as structured JSON
**Rationale:** `git diff HEAD` shows both staged and unstaged changes against last commit — matches what user wants to see ("what changed since last commit"). Server parses the unified diff format into structured data (file path, status, hunks with line numbers). Client renders with green/red coloring.
**Alternatives:**
- Send raw diff text to client — harder to render nicely
- `git status` only (no diff content) — user needs to see actual changes
- `git diff --cached` — only staged, misses unstaged changes

## 4. File Tree Loading Strategy

**Decision:** Lazy load — fetch children on expand
**Rationale:** Large projects can have thousands of files. Loading everything upfront is slow. Fetch directory contents only when user expands a folder. Respects .gitignore via `git ls-files` for git repos, fallback to fs.readdir for non-git.
**Alternatives:**
- Load entire tree upfront — too slow for large projects
- Use `find` command — doesn't respect .gitignore
- Stream entire tree — complex, lazy load is simpler

## 5. Security Boundary for File Access

**Decision:** Reuse `isPathWithinRoot` from path-guard.ts, set root to project path
**Rationale:** Already have path validation logic. For each project, the "allowed root" is the project directory. All file read/browse operations validate the requested path is within the project root.
**Alternatives:**
- Chroot/sandbox — overkill for local tool
- No validation — security risk (path traversal)
