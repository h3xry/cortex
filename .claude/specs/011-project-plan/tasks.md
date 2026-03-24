# Tasks: Project Plan

**Plan:** [plan.md](./plan.md)
**Created:** 2026-03-24
**Total Tasks:** 30

## Phase 1: Foundation (BLOCKS all stories)

- [x] T001 [P] Add Plan types (Task, SubTask, Milestone, Sprint, Plan, TaskStatus) to `client/src/types.ts`
- [x] T002 [P] Add Plan types to `server/src/types.ts`
- [x] T003 Create markdown parser `server/src/services/plan-parser.ts` — export `parsePlanMd(content: string): Plan` that parses `# Tasks` sections (Backlog/Sprint/In Progress/Review/Done) into Task[], `# Milestones` into Milestone[], `# Sprints` into Sprint[]. Parse checkbox `- [ ]`/`- [x]`, bold `**title**`, tags `[Tag]`, effort `— Back X manday`, nested sub-tasks
- [x] T004 Create markdown serializer in `server/src/services/plan-parser.ts` — export `serializePlan(plan: Plan): string` that converts Plan object back to `.md` format maintaining canonical structure
- [x] T005 Create plan store `server/src/services/plan-store.ts` — read/write `~/.cc-monitor/plans/<projectId>/plan.md`, export `getPlan(projectId)`, `savePlan(projectId, plan)`, auto-generate TASK-/MS-/SP- IDs
- [x] T006 Write tests for plan-parser in `server/tests/plan-parser.test.ts` — parse sample markdown → verify Task/Milestone/Sprint objects, serialize back → verify markdown roundtrip

**Checkpoint:** Parser + store ready, tested

## Phase 2: User Story 1 — Task Board (P1) MVP

**Goal:** CRUD tasks ใน Kanban board, persist เป็น .md
**Independent Test:** สร้าง task → เห็นใน board → ย้าย column → เห็นอัปเดต → เปิด .md ดูได้

### Server
- [x] T007 [US1] Create plan routes `server/src/routes/plans.ts` — `GET /api/projects/:id/plan` (read+parse .md), `POST /tasks` (add task), `PATCH /tasks/:taskId` (update), `DELETE /tasks/:taskId` (delete). Include `GET /raw` and `PUT /raw` for raw .md access
- [x] T008 [US1] Register plan routes in `server/src/index.ts` — `app.use("/api/projects/:id/plan", planRouter)`
- [x] T009 [US1] Write tests for plan routes in `server/tests/plan-routes.test.ts` — GET returns parsed plan, POST creates task, PATCH moves task status, DELETE removes task, GET /raw returns .md content

### Client
- [x] T010 [US1] Create `client/src/hooks/usePlan.ts` — fetch plan data, CRUD operations (addTask, updateTask, deleteTask), send requests with auth headers
- [x] T011 [US1] Add "Plan" to sidebar toggle in `client/src/App.tsx` — third button alongside Projects/Sessions, set `mainView` to "plan"
- [x] T012 [US1] Create `client/src/components/PlanBoard.tsx` — main view with sub-tabs (Board/Milestones/Sprints/Dashboard), render active sub-tab content
- [x] T013 [US1] Create `client/src/components/PlanColumn.tsx` — single Kanban column (receives status + tasks), renders task cards, "Add Task" button at bottom
- [x] T014 [US1] Create `client/src/components/PlanTaskCard.tsx` — task card showing title, tags (colored badges), effort, sub-task progress (2/5), done checkbox. Click to edit, status move buttons
- [x] T015 [US1] Create `client/src/components/PlanTaskForm.tsx` — modal for add/edit task: title input, tags input (comma-separated), status dropdown, effort input, sub-tasks list with add/remove/check
- [x] T016 [US1] Add CSS styles for plan board, columns, task cards, task form in `client/src/index.css` — Kanban layout (horizontal scroll desktop, vertical collapsible mobile), card styles, tag badges, status colors

**Checkpoint:** Task Board functional — CRUD + Kanban + persist to .md

## Phase 3: User Story 2 — Milestones & Timeline (P1)

**Goal:** CRUD milestones with deadline, link tasks, show progress + urgent/overdue
**Independent Test:** สร้าง milestone → ผูก tasks → เห็น progress bar → deadline warning

### Server
- [x] T017 [US2] Add milestone CRUD endpoints to `server/src/routes/plans.ts` — `POST /milestones`, `PATCH /milestones/:id`, `DELETE /milestones/:id`. Compute progress/isOverdue/isUrgent in GET response
- [x] T018 [US2] Write tests for milestone endpoints in `server/tests/plan-routes.test.ts` — create milestone, link tasks, verify progress computation, verify overdue/urgent flags

### Client
- [x] T019 [US2] Add milestone operations to `client/src/hooks/usePlan.ts` — addMilestone, updateMilestone, deleteMilestone
- [x] T020 [US2] Create `client/src/components/PlanMilestones.tsx` — milestone list sorted by deadline, each showing: title, deadline, progress bar (done/total), urgent badge (<=3 days), overdue badge (past deadline). Add/edit/delete buttons. Link/unlink tasks via dropdown
- [x] T021 [US2] Add milestone CSS to `client/src/index.css` — progress bar, urgent/overdue badges, milestone card layout

**Checkpoint:** Milestones with progress, deadline warnings functional

## Phase 4: User Story 3 — Sprint/Phase Tracking (P2)

**Goal:** CRUD sprints, assign tasks, show velocity for completed sprints
**Independent Test:** สร้าง sprint → assign tasks → เห็น progress → sprint จบ → เห็น velocity

### Server
- [x] T022 [US3] Add sprint CRUD endpoints to `server/src/routes/plans.ts` — `POST /sprints`, `PATCH /sprints/:id`, `DELETE /sprints/:id`. Compute isActive/velocity/remainingDays in GET response
- [x] T023 [US3] Write tests for sprint endpoints in `server/tests/plan-routes.test.ts` — create sprint, link tasks, verify isActive computation, verify velocity for completed sprint

### Client
- [x] T024 [US3] Add sprint operations to `client/src/hooks/usePlan.ts` — addSprint, updateSprint, deleteSprint
- [x] T025 [US3] Create `client/src/components/PlanSprints.tsx` — active sprint at top with progress + remaining days, completed sprints with velocity, add/edit/delete. Link/unlink tasks
- [x] T026 [US3] Add sprint CSS to `client/src/index.css` — sprint card, active badge, velocity display

**Checkpoint:** Sprints with progress + velocity functional

## Phase 5: User Story 4 — Dashboard Overview (P2)

**Goal:** สรุปภาพรวม project plan ในหน้าเดียว
**Independent Test:** มี tasks + milestones + sprints → เห็น dashboard สรุปทั้งหมด

- [x] T027 [US4] Create `client/src/components/PlanDashboard.tsx` — summary cards: tasks by status (Backlog/Sprint/InProgress/Review/Done counts), tasks by priority (P1/P2/P3 from tags), overdue milestones (top, prominent), upcoming deadlines list, current sprint progress + velocity trend. Empty state with CTA "Create your first task"
- [x] T028 [US4] Add dashboard CSS to `client/src/index.css` — summary cards grid, stat numbers, overdue section styling

**Checkpoint:** Dashboard functional

## Phase 6: Tests & Validation

- [x] T029 Run full server test suite `npx vitest run` — all tests pass
- [x] T030 Run quickstart.md scenarios 1-8 end-to-end — verify all acceptance criteria

## Dependencies

```
T001, T002 (Types) ──┐
T003, T004 (Parser) ──┼── T005 (Store) → T006 (Parser tests)
                      │
                      └── T007-T009 (Server routes) → T010 (Hook)
                                                        │
                          T011 (Sidebar) ────────────────┤
                                                        │
                          T012-T016 (Board UI) ──────── T017-T021 (Milestones)
                                                        │
                                                  T022-T026 (Sprints)
                                                        │
                                                  T027-T028 (Dashboard)
                                                        │
                                                  T029-T030 (Validation)
```

## Implementation Strategy

### MVP First
1. **Phase 1** (T001-T006): Foundation — parser + store + tests
2. **Phase 2** (T007-T016): Task Board — STOP and validate Kanban works
3. **Phase 3** (T017-T021): Milestones — progress + deadline warnings
4. **Phase 4** (T022-T026): Sprints — velocity tracking
5. **Phase 5** (T027-T028): Dashboard — overview
6. **Phase 6** (T029-T030): Full validation
