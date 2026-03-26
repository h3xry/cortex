# Data Model: Git Review Enhancement

## Commit

| Field | Type | Source |
|-------|------|--------|
| hash | string | `%H` — full SHA |
| shortHash | string | `%h` — 7-char SHA |
| message | string | `%s` — subject line |
| authorName | string | `%an` |
| authorEmail | string | `%ae` |
| committerName | string | `%cn` |
| committerEmail | string | `%ce` |
| date | string | `%aI` — ISO8601 |

**Source command:** `git log --format="%H|%h|%s|%an|%ae|%cn|%ce|%aI" -50 --skip=N`

---

## CommitFile

| Field | Type | Source |
|-------|------|--------|
| filePath | string | From numstat output |
| status | string | "added" / "modified" / "deleted" / "renamed" |
| additions | number | From numstat |
| deletions | number | From numstat |

**Source command:** `git diff-tree --no-commit-id -r --numstat <hash>`

---

## Branch

| Field | Type | Source |
|-------|------|--------|
| name | string | `%(refname:short)` |
| shortHash | string | `%(objectname:short)` |
| isCurrent | boolean | `%(HEAD)` === "*" |
| isRemote | boolean | name starts with "origin/" |

**Source command:** `git branch -a --format="%(refname:short)|%(objectname:short)|%(HEAD)"`

---

## API Response Types

### GET /git/log
```typescript
{
  commits: Commit[];
}
```

### GET /git/commits/:hash/files
```typescript
{
  commit: Commit;      // Full commit detail
  files: CommitFile[];
}
```

### GET /git/commits/:hash/diff
```typescript
{
  filePath: string;
  hunks: DiffHunk[];   // Reuse existing type
}
```

### GET /git/branches
```typescript
{
  branches: Branch[];
  current: string | null;
}
```

### POST /git/checkout
```typescript
// Request
{ branch: string }

// Response
{ success: boolean; error?: string }
```
