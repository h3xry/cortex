# Tasks: Private Project

**Plan:** [plan.md](./plan.md)
**Created:** 2026-03-23
**Total Tasks:** 18
**Parallelizable:** 8

## Phase 1: Setup (shared infrastructure)

- [x] T001 [P] Add `isPrivate: boolean` to Project type in `server/src/types.ts`
- [x] T002 [P] Add `isPrivate: boolean` to Project type in `client/src/types.ts`
- [x] T003 Create crypto helpers (hashPassword, verifyPassword) using `crypto.scrypt` in `server/src/services/crypto.ts`
- [x] T004 Create settings store (load/save `~/.cc-monitor/settings.json`, get/set passwordHash) in `server/src/services/settings-store.ts`

**Checkpoint:** Types updated, crypto + settings store ready

## Phase 2: Foundation — Server API (BLOCKS all stories)

- [x] T005 Write tests for crypto helpers in `server/tests/crypto.test.ts`
- [x] T006 Write tests for settings store in `server/tests/settings-store.test.ts`
- [x] T007 Create private routes (POST /setup, POST /unlock, GET /status) in `server/src/routes/private.ts`
- [x] T008 Write tests for private routes in `server/tests/private.test.ts`
- [x] T009 Register private routes in `server/src/index.ts`

**Checkpoint:** Server API functional, tests passing

## Phase 3: User Story 1 — ตั้ง Project เป็น Private (P1) MVP

**Goal:** ผู้ใช้สามารถตั้ง project เป็น private ด้วยรหัสผ่าน
**Independent Test:** ตั้ง private → รีเฟรช → project หายจาก list

### Server
- [x] T010 Add `setPrivate(id, isPrivate)` method to project-store and add PATCH /:id/private route in `server/src/services/project-store.ts` and `server/src/routes/projects.ts`

### Client
- [x] T011 Create SetPrivateModal component (password input, confirm) in `client/src/components/SetPrivateModal.tsx`
- [x] T012 Add setPrivate API call + private filtering logic to `client/src/hooks/useProjects.ts`
- [x] T013 Add "Set Private" option to ProjectList items and wire SetPrivateModal in `client/src/components/ProjectList.tsx` and `client/src/App.tsx`

**Checkpoint:** US1 independently functional — ตั้ง private ได้, project ซ่อนจาก list

## Phase 4: User Story 2 — ปลดล็อก Private Project (P1)

**Goal:** ผู้ใช้ใส่รหัสเพื่อแสดง private projects ชั่วคราว
**Independent Test:** มี private project → ใส่รหัสถูก → เห็น → รีเฟรช → หาย

- [x] T014 Create UnlockModal component (password input, error display) in `client/src/components/UnlockModal.tsx`
- [x] T015 Add unlock state (useState), unlock/lock actions, hasPrivateProjects check to `client/src/hooks/useProjects.ts`
- [x] T016 Add lock button (🔒) in sidebar + wire UnlockModal, show lock badge on private projects in `client/src/App.tsx` and `client/src/components/ProjectList.tsx`

**Checkpoint:** US2 functional — ปลดล็อกแล้วเห็น private projects, รีเฟรชแล้วซ่อน

## Phase 5: User Story 3 — ยกเลิก Private (P2)

- [x] T017 Add "Remove Private" option on unlocked private projects, verify password before removing in `client/src/components/ProjectList.tsx` and `client/src/hooks/useProjects.ts`

**Checkpoint:** US3 functional — ยกเลิก private ได้

## Phase 6: Polish & Validation

- [x] T018 Run quickstart.md validation scenarios end-to-end, fix edge cases (all projects private UI, CSS styling)

## Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundation) → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (Polish)
                                              ↓
                                         Phase 4 can start after T010
```

## Implementation Strategy

### MVP First
1. Phase 1 + 2: Setup + Server API
2. Phase 3: ตั้ง Private (US1) → Test → Validate
3. **STOP and validate MVP**
4. Phase 4: Unlock (US2)
5. Phase 5: Remove Private (US3)
6. Phase 6: Polish
