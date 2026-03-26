# Implementation Plan: Cross-Project Retrospective Viewer

**Spec:** [spec.md](./spec.md)
**Created:** 2026-03-27
**Status:** Draft

## Summary

Server scan `.claude/memory/` ของทุก registered project แล้ว return retros + lessons เป็น list. Client แสดงเป็น global view ใน sidebar toggle ข้าง Projects/Sessions. ใช้ existing markdown renderer. Filter by project + date.

## Technical Context

| Aspect | Decision |
|--------|----------|
| Language/Version | TypeScript (React 19 + Express) |
| Primary Dependencies | None new |
| Storage | File scan on-demand (no index) |
| Testing | Vitest |
| Target Platform | Web |
| Project Type | Full-stack (server API + client UI) |
| Performance Goals | List load < 3s for ~70 files |
| Constraints | Private project retros require unlock token |

## Constitution Check

- [x] Spec aligns with project principles (User First — review retros easily)
- [x] No constitution violations
- [x] Scope is appropriate (read-only, reuse existing components)

## Project Structure

### Documentation
```
.claude/specs/018-retro-viewer/
├── spec.md          ✅
├── plan.md          # This file
├── research.md      ✅
├── data-model.md
└── quickstart.md
```

### New Server Files
```
server/src/
├── services/
│   └── retro-store.ts         # Scan retros + lessons from all projects
└── routes/
    └── retros.ts              # GET /api/retros, GET /api/lessons
```

### New Client Files
```
client/src/
├── components/
│   ├── RetroViewer.tsx        # Main viewer: tabs (Retros/Lessons) + list + content
│   └── RetroList.tsx          # List component with project badge + date
├── hooks/
│   └── useRetros.ts           # Fetch retros + lessons + filter state
└── types.ts                   # Add RetroEntry, LessonEntry types
```

### Modified Files
```
client/src/
├── App.tsx                    # Add "Retros" to sidebar view toggle + render RetroViewer
└── index.css                  # Retro viewer styles
server/src/
└── index.ts                   # Register retros router
```

## Architecture

### Server API

```
GET /api/retros?project=<projectId>
→ {
    retros: [{
      projectId, projectName, date, title, filename, content
    }]
  }

GET /api/lessons?project=<projectId>
→ {
    lessons: [{
      projectId, projectName, date, filename, content
    }]
  }
```

Both endpoints:
- Iterate all projects from project-store
- Filter private projects without unlock token
- Scan `.claude/memory/retrospective/` or `.claude/memory/lesson/`
- Parse filename → date + title
- Read file content
- Sort by date descending
- Optional `?project=` filter

### retro-store.ts

```
listRetros(projects, unlockToken?) → RetroEntry[]
  for each project:
    if private + no token → skip
    scan {project.path}/.claude/memory/retrospective/YYYY-MM-DD/*.md
    parse each: date from folder, title from filename, read content

listLessons(projects, unlockToken?) → LessonEntry[]
  for each project:
    if private + no token → skip
    scan {project.path}/.claude/memory/lesson/YYYY-MM-DD.md
    parse each: date from filename, read content
```

### Client Architecture

```
App.tsx
├── sidebar view toggle: [Projects] [Sessions] [Retros]  ← new
│
├── mainView === "retros" →
│   └── RetroViewer
│       ├── Filter bar: project dropdown + date range
│       ├── Tabs: [Retrospectives] [Lessons]
│       ├── RetroList (left) — list items with project badge
│       └── Content (right) — rendered markdown
```

### RetroViewer Layout

```
┌──────────────────────────────────────┐
│ [Filter: All Projects ▾]  [📅 Date] │
│ [Retrospectives] [Lessons]           │
├──────────────┬───────────────────────┤
│ retro list   │ rendered markdown     │
│ - project A  │                       │
│   Mar 27     │ # Session Reconnect   │
│ - project B  │ ## Timeline           │
│   Mar 26     │ ...                   │
│ - project A  │                       │
│   Mar 25     │                       │
└──────────────┴───────────────────────┘
```

Desktop: list sidebar (300px) + content area (flex)
Mobile: list full → click → content full (back button)

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| None | — | — |

## Validation

- [x] Follows constitution (Simplicity — scan on-demand, no index, reuse renderer)
- [x] Simpler alternatives considered (index rejected — overkill for ~70 files)
- [x] Dependencies identified (None new)
- [x] All NEEDS CLARIFICATION resolved
- [x] File structure defined
- [x] Data model documented
