# Implementation Plan: Git Review Enhancement

**Spec:** [spec.md](./spec.md)
**Created:** 2026-03-26
**Status:** Draft

## Summary

เพิ่ม git history, branch viewer, checkout, และ side-by-side diff ใน Changes tab. Server เพิ่ม 4 endpoints ใหม่ (log, commit-files, branches, checkout). Client เพิ่ม 3 components ใหม่ + refactor DiffViewer ให้ toggle unified/side-by-side.

## Technical Context

| Aspect | Decision |
|--------|----------|
| Language/Version | TypeScript (React 19 + Express) |
| Primary Dependencies | None new — ใช้ git CLI commands |
| Storage | N/A (git operations only) |
| Testing | Vitest |
| Target Platform | Web (desktop + mobile) |
| Project Type | Full-stack (server API + client UI) |
| Performance Goals | History < 2s, toggle < 100ms |
| Constraints | Read-only ยกเว้น checkout |

## Constitution Check

- [x] Spec aligns with project principles (User First)
- [x] No constitution violations
- [x] Scope is appropriate

## Project Structure

### Documentation
```
.claude/specs/016-git-review/
├── spec.md          ✅
├── plan.md          # This file
├── research.md      ✅
├── data-model.md
├── quickstart.md
└── tasks.md
```

### New Server Files
```
server/src/services/git.ts        # Add: getLog, getCommitFiles, getCommitDiff, listBranches, checkout
server/src/routes/project-git.ts  # Add: /log, /commits/:hash/files, /commits/:hash/diff, /branches, /checkout
server/src/types.ts               # Add: Commit, Branch, CommitFile types
```

### New Client Files
```
client/src/
├── components/
│   ├── CommitList.tsx            # Commit history list (scrollable, load more)
│   ├── CommitDetail.tsx          # Commit info + files changed
│   ├── BranchSelector.tsx        # Branch dropdown + checkout
│   └── SideBySideDiff.tsx        # Side-by-side diff renderer
├── hooks/
│   └── useGitHistory.ts          # Fetch log, commit files, commit diff, branches
└── types.ts                      # Add: Commit, Branch, CommitFile types
```

### Modified Files
```
client/src/components/
├── GitChanges.tsx                # Add: Working Directory / History toggle, branch selector
├── DiffViewer.tsx                # Add: unified/side-by-side toggle button
└── ProjectPanel.tsx              # Wire new hooks
client/src/hooks/
└── useGitStatus.ts               # Minor: expose branch info for selector
client/src/index.css               # New styles
```

## Architecture

### API Endpoints (New)

```
GET /api/projects/:id/git/log?limit=50&skip=0
→ { commits: Commit[] }

GET /api/projects/:id/git/commits/:hash/files
→ { files: CommitFile[] }

GET /api/projects/:id/git/commits/:hash/diff?file=<path>
→ { filePath, hunks: DiffHunk[] }

GET /api/projects/:id/git/branches
→ { branches: Branch[], current: string | null }

POST /api/projects/:id/git/checkout
Body: { branch: string }
→ { success: boolean, error?: string }
```

### Git Commands

```bash
# History
git log --format="%H|%h|%s|%an|%ae|%cn|%ce|%aI" -50 --skip=0

# Commit files
git diff-tree --no-commit-id -r --numstat <hash>

# Commit diff (specific file)
git diff <parent>...<hash> -- <file>
# First commit: git diff --root <hash> -- <file>

# Branches
git branch -a --format="%(refname:short)|%(objectname:short)|%(HEAD)"

# Checkout
git checkout <branch>
```

### Client Architecture

```
Changes Tab
├── [Working Directory | History] toggle (FR-016)
│
├── Working Directory mode (existing behavior)
│   ├── GitChanges (file list)
│   └── DiffViewer (unified or side-by-side)
│
└── History mode (new)
    ├── BranchSelector (top bar)
    ├── CommitList (left panel — scrollable)
    ├── CommitDetail (selected commit info + files)
    └── DiffViewer (reuse — unified or side-by-side)
```

### DiffViewer Refactor

ปัจจุบัน DiffViewer render unified only. Refactor เป็น:

```
DiffViewer
├── Toggle button [Unified | Side-by-Side]
├── mode === "unified" → render existing hunk-based view
└── mode === "side-by-side" → render SideBySideDiff component
```

SideBySideDiff transforms DiffHunk[] → paired rows:
- Context lines → same content both columns
- Delete + Add adjacent → old left, new right (paired)
- Delete only → old left, empty right
- Add only → empty left, new right

### Data Flow

```
User opens History tab
  → useGitHistory.fetchLog(projectId)
  → GET /api/projects/:id/git/log
  → git log --format=... -50
  → CommitList renders

User clicks commit
  → useGitHistory.fetchCommitFiles(hash)
  → GET /api/projects/:id/git/commits/:hash/files
  → git diff-tree --numstat
  → CommitDetail renders with file list

User clicks file
  → useGitHistory.fetchCommitDiff(hash, file)
  → GET /api/projects/:id/git/commits/:hash/diff?file=...
  → git diff parent...hash -- file
  → DiffViewer renders (unified or side-by-side)

User clicks branch
  → useGitHistory.fetchBranches(projectId)
  → GET /api/projects/:id/git/branches
  → BranchSelector dropdown

User selects branch
  → POST /api/projects/:id/git/checkout { branch }
  → git checkout <branch>
  → refresh history + status
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| POST checkout endpoint | Checkout เป็น write operation เดียวที่ spec อนุญาต | ไม่มี — ต้องใช้ POST |

## Validation

- [x] Follows constitution (Simplicity — reuse existing DiffViewer, no new deps)
- [x] Simpler alternatives considered (diff2html rejected, custom renderer simpler)
- [x] Dependencies identified (None new)
- [x] All NEEDS CLARIFICATION resolved
- [x] File structure defined
- [x] Data model documented
