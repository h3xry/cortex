# Data Model: Cross-Project Retrospective Viewer

## RetroEntry

| Field | Type | Source |
|-------|------|--------|
| projectId | string | Project.id |
| projectName | string | Project.name |
| date | string | Folder name `YYYY-MM-DD` |
| title | string | Filename: `N-HHMM-description.md` → description (hyphens → spaces) |
| order | number | Filename: `N` prefix |
| filename | string | Full filename for reference |
| content | string | File content (markdown) |

**Source path:** `{project.path}/.claude/memory/retrospective/YYYY-MM-DD/N-HHMM-description.md`

---

## LessonEntry

| Field | Type | Source |
|-------|------|--------|
| projectId | string | Project.id |
| projectName | string | Project.name |
| date | string | Filename `YYYY-MM-DD` |
| filename | string | Full filename |
| content | string | File content (markdown) |

**Source path:** `{project.path}/.claude/memory/lesson/YYYY-MM-DD.md`

---

## API Response Types

### GET /api/retros
```typescript
{
  retros: RetroEntry[];  // sorted by date desc
}
```

### GET /api/lessons
```typescript
{
  lessons: LessonEntry[];  // sorted by date desc
}
```

### Query Params (both)
- `project` (optional) — filter by projectId
