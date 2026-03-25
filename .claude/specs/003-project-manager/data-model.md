# Data Model: 003-project-manager

**Created:** 2026-03-23

---

## Entities

### Project

| Field | Type | Description |
|-------|------|-------------|
| id | string (uuid short) | Unique identifier |
| name | string | Directory name (last segment of path) |
| path | string | Absolute path to project directory |
| isGitRepo | boolean | Whether directory contains .git |
| addedAt | ISO datetime | When project was added |

**Validation:**
- path must be absolute
- path must exist and be a directory
- path must not be a duplicate (same path already added)

**Storage:** `~/.cortex/projects.json` — array of Project objects

### FileEntry

| Field | Type | Description |
|-------|------|-------------|
| name | string | File/directory name |
| path | string | Path relative to project root |
| type | "file" \| "directory" | Entry type |
| size | number \| null | File size in bytes (null for directories) |

### GitChange

| Field | Type | Description |
|-------|------|-------------|
| filePath | string | Path relative to project root |
| status | "modified" \| "added" \| "deleted" \| "renamed" | Change type |
| additions | number | Lines added |
| deletions | number | Lines deleted |

### GitDiff (for single file)

| Field | Type | Description |
|-------|------|-------------|
| filePath | string | Path relative to project root |
| hunks | Hunk[] | Array of diff hunks |

### Hunk

| Field | Type | Description |
|-------|------|-------------|
| oldStart | number | Start line in old file |
| newStart | number | Start line in new file |
| lines | DiffLine[] | Lines in this hunk |

### DiffLine

| Field | Type | Description |
|-------|------|-------------|
| type | "add" \| "delete" \| "context" | Line type |
| content | string | Line content |
| oldLineNumber | number \| null | Line number in old file |
| newLineNumber | number \| null | Line number in new file |
