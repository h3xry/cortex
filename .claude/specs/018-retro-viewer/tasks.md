# Tasks: Cross-Project Retrospective Viewer

**Plan:** [plan.md](./plan.md)
**Created:** 2026-03-27
**Total Tasks:** 12

## Phase 1: Setup — Types (BLOCKS all)

- [x] T001 [P] Add types to `server/src/types.ts` — RetroEntry (projectId, projectName, date, title, order, filename, content), LessonEntry (projectId, projectName, date, filename, content)
- [x] T002 [P] Add types to `client/src/types.ts` — mirror server RetroEntry, LessonEntry

**Checkpoint:** Types ready

## Phase 2: Foundation — Server (BLOCKS client)

- [x] T003 Create `server/src/services/retro-store.ts` — `listRetros(projects, unlockToken?)`: iterate projects, skip private without token, scan `{path}/.claude/memory/retrospective/YYYY-MM-DD/*.md`, parse folder name → date, filename `N-HHMM-description.md` → title + order, readFile → content. Return RetroEntry[] sorted by date desc. `listLessons(projects, unlockToken?)`: same pattern for `.claude/memory/lesson/YYYY-MM-DD.md`
- [x] T004 Create `server/src/routes/retros.ts` — GET `/api/retros?project=<id>` returns `{ retros }`, GET `/api/lessons?project=<id>` returns `{ lessons }`. Both: load all projects from project-store, pass unlock token from header, call retro-store, optional project filter
- [x] T005 Register retros router in `server/src/index.ts` — mount retros router at `/api`

**Checkpoint:** API endpoints return retros + lessons

## Phase 3: US1 — Retrospective Timeline (P1) MVP

**Goal:** เห็น retro list ทุก project เรียงตามวัน + กดอ่าน rendered markdown
**Independent Test:** เปิด Retros view → เห็น list → กดอ่าน retro

- [x] T006 Create `client/src/hooks/useRetros.ts` — fetchRetros(projectFilter?), fetchLessons(projectFilter?), state: retros[], lessons[], selectedItem, loading, activeTab ("retros"/"lessons"), projectFilter
- [x] T007 Create `client/src/components/RetroList.tsx` — scrollable list: project name badge (colored), date, title. Selected item highlighted. Props: items[], selectedId, onSelect. Empty state "No retrospectives yet"
- [x] T008 Create `client/src/components/RetroViewer.tsx` — main viewer component: project filter dropdown (all projects), tabs [Retrospectives | Lessons], left = RetroList, right = rendered markdown (MDEditor.Markdown + rehypeRaw). Mobile: list → click → content (back button)
- [x] T009 [US1] Add CSS to `client/src/index.css` — retro-viewer layout (flex, list 300px + content flex), retro-list-item, project-badge colors, retro-content markdown, tabs, filter dropdown, mobile responsive

**Checkpoint:** Retro timeline + read fully functional

## Phase 4: US2 — Lessons Knowledge Base (P1)

**Goal:** ดู lessons จากทุก project + filter
**Independent Test:** กด Lessons tab → เห็น lessons list → กดอ่าน

- [x] T010 [US2] Wire lessons tab in `client/src/components/RetroViewer.tsx` — tab switch fetches lessons, RetroList reused for lesson items, content renders lesson markdown. Already built in T008 structure — just verify lessons data flows correctly

**Checkpoint:** Lessons tab works

## Phase 5: US3 — Global Access (P2)

**Goal:** เข้า Retro Viewer จาก sidebar toggle
**Independent Test:** กด "Retros" ใน sidebar → เปิด RetroViewer

- [x] T011 [US3] Add "Retros" to sidebar view toggle in `client/src/App.tsx` — add mainView "retros" option, render RetroViewer when active. Pass projects list for filter dropdown. Add hamburger button in RetroViewer for mobile sidebar toggle

**Checkpoint:** Global access works

## Phase 6: Polish

- [x] T012 Run quickstart.md validation — test all 7 scenarios: view all, read retro, filter project, lessons tab, private project, empty state, mobile

## Dependencies

```
T001, T002 (parallel)
    → T003 → T004 → T005
        → T006 → T007 → T008 → T009
            → T010
                → T011
                    → T012
```

## Implementation Strategy

### MVP First
1. Phase 1-3: Types + Server + Timeline → **retro list + read**
2. STOP and validate
3. Phase 4: Lessons tab (mostly done from Phase 3)
4. Phase 5: Sidebar access
5. Phase 6: Polish
