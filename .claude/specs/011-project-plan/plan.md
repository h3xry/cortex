# Implementation Plan: Project Plan

**Spec:** [spec.md](./spec.md)
**Created:** 2026-03-24
**Status:** Draft

## Summary

เพิ่มระบบ Project Plan แบบ Markdown Kanban ที่เก็บเป็น `.md` file per project server อ่าน/เขียน `.md` files, parse เป็น structured data, expose REST API. Client แสดง Kanban board + milestones + sprints + dashboard ใน sidebar menu item ที่เปิดปิดได้

## Technical Context

| Aspect | Decision |
|--------|----------|
| Language/Version | TypeScript (Node.js + React) |
| Primary Dependencies | express, react (no new deps) |
| Storage | `.md` files at `~/.cc-monitor/plans/<projectId>/plan.md` |
| Testing | vitest + supertest |
| Target Platform | Web (responsive) |
| Project Type | Full-stack web app |
| Performance Goals | Standard (< 200ms API response) |
| Constraints | No new npm dependencies, `.md` must be human + AI readable |

## Constitution Check

- [x] Spec aligns with project principles (user value, simplicity)
- [x] No constitution violations (input validation at boundaries, no secrets)
- [x] Scope is appropriate (incremental 4 modules)

## What Exists (relevant)

| File | Relevance |
|------|-----------|
| `server/src/services/project-store.ts` | Pattern: file-based store with lazy load |
| `server/src/routes/projects.ts` | Pattern: CRUD routes with error handling |
| `client/src/App.tsx` | Sidebar toggle (Projects/Sessions) — add "Plan" menu |
| `client/src/components/ProjectPanel.tsx` | Tab system — plan will be sidebar view, not tab |
| `client/src/hooks/useSpecs.ts` | Pattern: fetch hook for project-scoped data |
| `client/src/components/SpecBrowser.tsx` | Pattern: list + viewer component |

## Architecture

### Key Design: Markdown Parser/Serializer

ส่วนที่ซับซ้อนที่สุดคือ **markdown parser** ที่แปลง `.md` file ↔ structured data:

```
plan.md (markdown) ←→ parser/serializer ←→ Plan object (JSON) ←→ REST API ←→ React UI
```

Parser ต้อง:
1. อ่าน section headings (`## Backlog`, `## In Progress`, etc.) → map เป็น status
2. อ่าน checkbox items (`- [ ] **[Feature] Title** - [Tags]`) → map เป็น Task
3. อ่าน nested checkboxes → map เป็น sub-tasks
4. อ่าน inline metadata (`[High]`, `Back 1.5 manday`) → map เป็น tags/effort
5. เขียนกลับเป็น `.md` ที่ maintain format เดิม

### Server — New Files

```
server/src/services/plan-store.ts       ← read/write .md files, parse ↔ Plan object
server/src/services/plan-parser.ts      ← markdown ↔ structured data parser/serializer
server/src/routes/plans.ts              ← REST API for plan CRUD
```

### Client — New Files

```
client/src/hooks/usePlan.ts             ← fetch/mutate plan data
client/src/components/PlanBoard.tsx     ← main Kanban board view
client/src/components/PlanColumn.tsx    ← single Kanban column (Backlog/Sprint/etc.)
client/src/components/PlanTaskCard.tsx  ← task card with tags, effort, sub-tasks
client/src/components/PlanTaskForm.tsx  ← add/edit task modal
client/src/components/PlanMilestones.tsx ← milestone list with progress bars
client/src/components/PlanSprints.tsx   ← sprint list with progress + velocity
client/src/components/PlanDashboard.tsx ← overview dashboard
```

### Client — Modified Files

```
client/src/App.tsx                      ← add "Plan" to sidebar toggle
client/src/types.ts                     ← add Plan/Task/Milestone/Sprint types
```

## API Design

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/projects/:id/plan` | Get full plan (tasks + milestones + sprints) |
| PUT | `/api/projects/:id/plan` | Save full plan (overwrite .md file) |
| POST | `/api/projects/:id/plan/tasks` | Add task |
| PATCH | `/api/projects/:id/plan/tasks/:taskId` | Update task (status, fields) |
| DELETE | `/api/projects/:id/plan/tasks/:taskId` | Delete task |
| POST | `/api/projects/:id/plan/milestones` | Add milestone |
| PATCH | `/api/projects/:id/plan/milestones/:id` | Update milestone |
| DELETE | `/api/projects/:id/plan/milestones/:id` | Delete milestone |
| POST | `/api/projects/:id/plan/sprints` | Add sprint |
| PATCH | `/api/projects/:id/plan/sprints/:id` | Update sprint |
| DELETE | `/api/projects/:id/plan/sprints/:id` | Delete sprint |

## Markdown Format (canonical)

```markdown
# Tasks

## Backlog
- [ ] **[Feature] ระบบจัดส่ง** - [High] [Sell-sync-api]
  - [ ] เลือก Provider — Back 1.5 manday
  - [ ] ตั้งค่าค่าส่ง — Back 1 manday

## Sprint
- [ ] **[Feature] ระบบไลฟ์สด** - [High] [Sell-sync-api]
  - [x] สร้างไลฟ์
  - [ ] Dashboard ขณะไลฟ์สด

## In Progress
- [ ] **[Feature] ระบบจัดการสินค้า** - [Sell-sync-api]
  - [x] สร้างสินค้าในระบบ
  - [ ] ตัดยอดเมื่อมีการสั่งซื้อ

## Review
- [x] **[Feature] ตั้งค่าร้านค้า** - [Sell-sync-api]
  - [x] เชื่อมต่อร้านค้า

## Done
- [x] **~~Worker - Fetch TikTok Live Comments~~**

---

# Milestones

## MVP Launch - 2026-04-15
- ระบบไลฟ์สด
- ระบบจัดการสินค้า

## Beta Release - 2026-05-01
- ระบบจัดส่ง
- ระบบคำสั่งซื้อ

---

# Sprints

## Sprint 1 - 2026-03-24 to 2026-04-07
- ระบบไลฟ์สด
- ระบบจัดการสินค้า

## Sprint 2 - 2026-04-07 to 2026-04-21
- ระบบจัดส่ง
- ระบบคำสั่งซื้อ
```

## UI Layout

```
┌─────────────────────────────────────────────────┐
│ Sidebar                                         │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Projects] [Sessions] [Plan]                │ │ ← sidebar toggle
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ (Plan view when Plan is active)                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Sub-tabs: [Board] [Milestones] [Sprints]    │ │
│ │           [Dashboard]                       │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Main content area:                              │
│ ┌─────────────────────────────────────────────┐ │
│ │ Board view:                                 │ │
│ │ Backlog | Sprint | In Progress | Review | D │ │
│ │  task1  │ task4  │   task6     │ task8  │   │ │
│ │  task2  │ task5  │   task7     │        │   │ │
│ │  task3  │        │             │        │   │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

Mobile: Kanban columns เป็น vertical list (ไม่ใช่ horizontal scroll) — แต่ละ section เป็น collapsible

## Project Structure

### Documentation
```
.claude/specs/011-project-plan/
├── spec.md
├── plan.md          ← this file
├── research.md
├── data-model.md
├── contracts/
│   └── api.md
├── quickstart.md
└── tasks.md         ← next step
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| Markdown parser/serializer | Core requirement — .md format must be human+AI readable | JSON storage would be simpler but not readable by humans/AI |
| 4 sub-views (Board/Milestones/Sprints/Dashboard) | Each module serves different purpose per spec | Single list view would lose structure |
