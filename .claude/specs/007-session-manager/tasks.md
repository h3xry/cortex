# Tasks: Session Manager

**Plan:** [plan.md](./plan.md)
**Created:** 2026-03-23
**Total Tasks:** 14
**Parallelizable:** 4

## Phase 1: Setup (shared infrastructure)

- [x] T001 [P] Add `projectName` and `lastOutput` to Session type in `client/src/types.ts`
- [x] T002 [P] Add `stripAnsi()` helper and `getLastOutput(id)` + `removeSession(id)` to `server/src/services/session-manager.ts`

**Checkpoint:** Types and server helpers ready

## Phase 2: Foundation — Server API (BLOCKS all stories)

- [x] T003 Enhance `GET /api/sessions` to include `projectName` (match folderPath with projects) and `lastOutput` (stripped ANSI last line) in `server/src/routes/sessions.ts`
- [x] T004 Fix `DELETE /api/sessions/:id` to handle ended sessions (remove from memory) instead of erroring in `server/src/routes/sessions.ts` and `server/src/services/session-manager.ts`
- [x] T005 Write tests for enhanced GET response and DELETE dual behavior in `server/tests/sessions-routes.test.ts`

**Checkpoint:** Server API returns enriched session data, DELETE works for both running and ended

## Phase 3: User Story 1 — ดู Session ทั้งหมด (P1) MVP

**Goal:** ผู้ใช้เปิด Session Manager เห็น session ทั้งหมดพร้อมรายละเอียด
**Independent Test:** กดปุ่ม Sessions → เห็น list ของทุก session พร้อม status/project/duration

- [x] T006 Create SessionManager component (session list with status badge, project name, live duration, last output preview) in `client/src/components/SessionManager.tsx`
- [x] T007 Add sidebar toggle state and "Sessions" button (เหนือ project list) to switch between project list and session manager in `client/src/App.tsx`
- [x] T008 Add session manager CSS styles (session items, status badges, duration, preview) in `client/src/index.css`

**Checkpoint:** US1 functional — เปิด Session Manager เห็นทุก session พร้อมรายละเอียด

## Phase 4: User Story 2 — Kill Session (P1)

**Goal:** ผู้ใช้กด kill session ที่ running ได้
**Independent Test:** กด kill → confirm → session เปลี่ยนเป็น ended

- [x] T009 Add `killSession(id)` action (calls DELETE) with confirmation to SessionManager component in `client/src/components/SessionManager.tsx`
- [x] T010 Update `useSessions` hook: rename existing `deleteSession` to clarify, ensure it handles both kill and remove in `client/src/hooks/useSessions.ts`

**Checkpoint:** US2 functional — kill running session ได้

## Phase 5: User Story 3 — Monitor หลาย Session (P1)

**Goal:** กดที่ session แล้ว switch ไปดู terminal ของ session นั้น
**Independent Test:** กด session A → switch ไป project A terminal → กด Sessions → กด session B → switch ไป project B

- [x] T011 Add `onSelectSession` callback that finds matching project, selects it, switches to terminal tab, and sets active session in `client/src/App.tsx`
- [x] T012 Wire session click in SessionManager to call `onSelectSession` and close sidebar on mobile in `client/src/components/SessionManager.tsx`

**Checkpoint:** US3 functional — switch ระหว่าง sessions ข้าม project ได้

## Phase 6: User Story 4 — ลบ Ended Session (P2)

- [x] T013 Add remove button for ended sessions in SessionManager (calls DELETE) in `client/src/components/SessionManager.tsx` and `client/src/hooks/useSessions.ts`

**Checkpoint:** US4 functional — ลบ ended session ออกจาก list ได้

## Phase 7: Polish & Validation

- [x] T014 Run quickstart.md validation scenarios, fix edge cases (empty state, mobile touch targets, max sessions warning)

## Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundation) → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) → Phase 7 (Polish)
```

## Implementation Strategy

### MVP First
1. Phase 1 + 2: Setup + Server API
2. Phase 3: Session List (US1) → Validate
3. **STOP and validate MVP**
4. Phase 4: Kill (US2)
5. Phase 5: Monitor/Switch (US3)
6. Phase 6: Remove (US4)
7. Phase 7: Polish
