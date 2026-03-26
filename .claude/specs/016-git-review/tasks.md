# Tasks: Git Review Enhancement

**Plan:** [plan.md](./plan.md)
**Created:** 2026-03-26
**Total Tasks:** 18

## Phase 1: Setup — Types + Server APIs (BLOCKS all stories)

- [x] T001 [P] Add types to `server/src/types.ts` — Commit (hash, shortHash, message, authorName, authorEmail, committerName, committerEmail, date), CommitFile (filePath, status, additions, deletions), Branch (name, shortHash, isCurrent, isRemote)
- [x] T002 [P] Add types to `client/src/types.ts` — mirror server Commit, CommitFile, Branch types

**Checkpoint:** Types ready

## Phase 2: Foundation — Server Git Functions (BLOCKS all stories)

- [x] T003 Add `getLog(projectPath, limit, skip)` to `server/src/services/git.ts` — run `git log --format="%H|%h|%s|%an|%ae|%cn|%ce|%aI" -<limit> --skip=<skip>`, parse pipe-delimited output into Commit[], validate projectPath
- [x] T004 Add `getCommitFiles(projectPath, hash)` to `server/src/services/git.ts` — run `git diff-tree --no-commit-id -r --numstat <hash>`, parse output into CommitFile[], detect status from parent diff (added/modified/deleted)
- [x] T005 Add `getCommitDiff(projectPath, hash, filePath)` to `server/src/services/git.ts` — get parent hash via `git rev-parse <hash>^`, run `git diff <parent>...<hash> -- <filePath>`, use existing `parseDiffHunks()`. Handle first commit with `git diff --root <hash> -- <filePath>`
- [x] T006 Add `listBranches(projectPath)` to `server/src/services/git.ts` — run `git branch -a --format="%(refname:short)|%(objectname:short)|%(HEAD)"`, parse into Branch[], mark isRemote for `origin/` prefixed, mark isCurrent for `*`
- [x] T007 Add `checkoutBranch(projectPath, branch)` to `server/src/services/git.ts` — check dirty working tree first via `git status --porcelain`, run `git checkout <branch>`, return success/error. Validate branch name (no shell injection via execFile)

**Checkpoint:** All git functions ready

## Phase 3: Foundation — Server Routes

- [x] T008 Add routes to `server/src/routes/project-git.ts` — 5 new endpoints: GET `/log?limit=50&skip=0`, GET `/commits/:hash/files`, GET `/commits/:hash/diff?file=<path>`, GET `/branches`, POST `/checkout` (body: { branch }). All validate project exists. Checkout validates path containment for filePath params.

**Checkpoint:** API ready for client consumption

## Phase 4: US1 — Git History (P1) MVP

**Goal:** ดู commit history + เลือก commit ดู files changed + diff
**Independent Test:** เปิด History → เห็น commits → กด commit → เห็น files → กดไฟล์ → เห็น diff

- [x] T009 Create `client/src/hooks/useGitHistory.ts` — fetchLog(projectId, skip), fetchCommitFiles(projectId, hash), fetchCommitDiff(projectId, hash, filePath), fetchBranches(projectId), checkoutBranch(projectId, branch). State: commits[], selectedCommit, commitFiles[], branches[], loading flags
- [x] T010 Create `client/src/components/CommitList.tsx` — scrollable list of commits: shortHash (monospace gray), message (white, truncate), authorName (gray), relative date. Click → select commit. Load more button at bottom (or infinite scroll via intersection observer)
- [x] T011 Create `client/src/components/CommitDetail.tsx` — selected commit info header: full message, author name + email, committer (if different), date, full hash (copyable). Below: files changed list with status badge + additions/deletions. Click file → load diff
- [x] T012 [US1] Add "Working Directory | History" toggle to `client/src/components/GitChanges.tsx` — sub-tabs at top of Changes panel. Working Directory = existing behavior. History = CommitList + CommitDetail. State managed in GitChanges
- [x] T013 [US1] Wire useGitHistory into `client/src/components/ProjectPanel.tsx` — pass history hook data to GitChanges when History mode active. Fetch commit diff → display in DiffViewer

**Checkpoint:** Commit history fully functional

## Phase 5: US2 — Branch Viewer & Checkout (P1)

**Goal:** ดู branches + checkout ได้
**Independent Test:** กด branch selector → เห็น branches → เลือก → checkout → history refresh

- [x] T014 Create `client/src/components/BranchSelector.tsx` — dropdown: current branch display (clickable), dropdown list with local branches (bold) + remote branches (gray italic). Click → checkout. Loading state. Warning modal if dirty working tree (confirm/cancel)
- [x] T015 [US2] Integrate BranchSelector into `client/src/components/GitChanges.tsx` — show above commit list in History mode + above file list in Working Directory mode. Checkout → refresh both history and status

**Checkpoint:** Branch checkout works end-to-end

## Phase 6: US3 — Diff View Toggle (P1)

**Goal:** Toggle unified ↔ side-by-side diff
**Independent Test:** ดู diff → กด toggle → เห็น side-by-side → กดกลับ → unified

- [x] T016 Create `client/src/components/SideBySideDiff.tsx` — receives DiffHunk[], renders 2-column table: left = old, right = new. Pair adjacent delete+add lines as side-by-side rows. Context lines → same content both sides. Synchronized scroll. Line numbers both columns
- [x] T017 [US3] Add toggle button to `client/src/components/DiffViewer.tsx` — [Unified | Side-by-Side] toggle in header. mode state (default: unified, persist in component). Render existing view for unified, SideBySideDiff for side-by-side. Pass same DiffHunk[] to both
- [x] T018 [US3] Add CSS styles to `client/src/index.css` — commit-list, commit-detail, branch-selector, side-by-side-diff, Working Directory/History toggle styles. Responsive: side-by-side auto-fallback or horizontal scroll on mobile

**Checkpoint:** All 3 P1 stories complete

## Dependencies

```
T001, T002 (parallel)
    → T003, T004, T005, T006, T007 (sequential — same file)
        → T008
            → T009
                → T010, T011 (parallel)
                    → T012 → T013
                        → T014 → T015
                            → T016 → T017 → T018
```

## Implementation Strategy

### MVP First
1. Phase 1-4: Types + APIs + History → **commit log + diff per commit**
2. STOP and validate — this delivers core git review
3. Phase 5: Branch checkout
4. Phase 6: Diff toggle
5. US4 (Working Directory/History toggle) — built into T012 already
