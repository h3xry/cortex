# Tasks: Private Project

**Plan:** [plan.md](./plan.md)
**Created:** 2026-03-23
**Updated:** 2026-03-24
**Total Tasks:** 34 (v1: 18 done, v2: 16 new)

---

## v1 Tasks (COMPLETED)

### Phase 1: Setup (shared infrastructure)

- [x] T001 [P] Add `isPrivate: boolean` to Project type in `server/src/types.ts`
- [x] T002 [P] Add `isPrivate: boolean` to Project type in `client/src/types.ts`
- [x] T003 Create crypto helpers (hashPassword, verifyPassword) using `crypto.scrypt` in `server/src/services/crypto.ts`
- [x] T004 Create settings store (load/save `~/.cc-monitor/settings.json`, get/set passwordHash) in `server/src/services/settings-store.ts`

### Phase 2: Foundation — Server API (BLOCKS all stories)

- [x] T005 Write tests for crypto helpers in `server/tests/crypto.test.ts`
- [x] T006 Write tests for settings store in `server/tests/settings-store.test.ts`
- [x] T007 Create private routes (POST /setup, POST /unlock, GET /status) in `server/src/routes/private.ts`
- [x] T008 Write tests for private routes in `server/tests/private.test.ts`
- [x] T009 Register private routes in `server/src/index.ts`

### Phase 3: User Story 1 — ตั้ง Project เป็น Private (P1) MVP

- [x] T010 Add `setPrivate(id, isPrivate)` method to project-store and add PATCH /:id/private route in `server/src/services/project-store.ts` and `server/src/routes/projects.ts`
- [x] T011 Create SetPrivateModal component (password input, confirm) in `client/src/components/SetPrivateModal.tsx`
- [x] T012 Add setPrivate API call + private filtering logic to `client/src/hooks/useProjects.ts`
- [x] T013 Add "Set Private" option to ProjectList items and wire SetPrivateModal in `client/src/components/ProjectList.tsx` and `client/src/App.tsx`

### Phase 4: User Story 2 — ปลดล็อก Private Project (P1)

- [x] T014 Create UnlockModal component (password input, error display) in `client/src/components/UnlockModal.tsx`
- [x] T015 Add unlock state (useState), unlock/lock actions, hasPrivateProjects check to `client/src/hooks/useProjects.ts`
- [x] T016 Add lock button in sidebar + wire UnlockModal, show lock badge on private projects in `client/src/App.tsx` and `client/src/components/ProjectList.tsx`

### Phase 5: User Story 3 — ยกเลิก Private (P2)

- [x] T017 Add "Remove Private" option on unlocked private projects, verify password before removing in `client/src/components/ProjectList.tsx` and `client/src/hooks/useProjects.ts`

### Phase 6: Polish & Validation

- [x] T018 Run quickstart.md validation scenarios end-to-end, fix edge cases

---

## v2 Tasks — API-level enforcement (NEW)

> Upgrades from client-side filtering to server-side enforcement with token-based unlock.

### Phase 7: Foundation v2 (BLOCKS all v2 stories)

- [x] T019 Create unlock token service in `server/src/services/unlock-store.ts` — export `addToken(): string` (generates UUID via `crypto.randomUUID()`, adds to `Set<string>`, returns token), `isValidToken(token: string): boolean`, `removeToken(token: string): void`
- [x] T020 Add `getPrivateProjectPaths()` to `server/src/services/project-store.ts` — returns `Set<string>` of `path` values for projects where `isPrivate === true`

**Checkpoint:** Token management + private path lookup ready

### Phase 8: User Story 4 — API Enforcement (P1) MVP

**Goal:** Server filters/rejects private project data for requests without valid token
**Independent Test:** No token → GET /api/projects excludes private → GET /api/sessions excludes private sessions → POST /api/sessions rejects private projectId/folderPath

- [x] T021 [US4] Modify `POST /api/private/unlock` in `server/src/routes/private.ts` — on success, call `addToken()`, return `{ ok: true, token }` in response
- [x] T022 [US4] Add `POST /api/private/lock` endpoint in `server/src/routes/private.ts` — read `X-Unlock-Token` header, call `removeToken()`, return `{ ok: true }`
- [x] T023 [US4] Modify `GET /api/projects` in `server/src/routes/projects.ts` — read `X-Unlock-Token` header, validate via `isValidToken()`, filter out `isPrivate=true` projects if token invalid/missing
- [x] T024 [US4] Modify `GET /api/sessions` in `server/src/routes/sessions.ts` — read `X-Unlock-Token` header, get private project paths via `getPrivateProjectPaths()`, exclude sessions whose `folderPath` matches a private project path when token invalid/missing
- [x] T025 [US4] Modify `POST /api/sessions` in `server/src/routes/sessions.ts` — after resolving path (from projectId or folderPath), check if path matches a private project via `getPrivateProjectPaths()`, reject 403 `{ error: "Project is private" }` if token invalid/missing
- [x] T026 [US4] Modify WS upgrade in `server/src/ws/terminal.ts` — read `token` query param from URL, lookup session's `folderPath`, check against `getPrivateProjectPaths()`, destroy socket if private session + no valid token

**Checkpoint:** All API endpoints enforce unlock state server-side

### Phase 9: User Story 2 v2 — Client Token Integration (P1)

**Goal:** Client stores token from unlock response, sends in headers and WS connections
**Independent Test:** Unlock → see private projects → refresh → projects hidden again

- [x] T027 [US2] Modify `client/src/hooks/useProjects.ts` — store token in module-level variable (not state/localStorage), send `X-Unlock-Token` header in `fetchProjects()`, remove `allProjects` client-side filtering (server handles it), update `unlock()` to save token from response, update `lock()` to call `POST /api/private/lock` + clear token variable
- [x] T028 [US2] Add token header to session API calls — ensure `GET /api/sessions` and `POST /api/sessions` include `X-Unlock-Token` header wherever these calls are made in client
- [x] T029 [US2] Add token query param to WebSocket URL — where WS connection is built, append `?token=xxx` if token exists

**Checkpoint:** Full client-server token flow working

### Phase 10: Tests

- [x] T030 [P] Write tests for unlock-store in `server/tests/unlock-store.test.ts` — addToken returns UUID string, isValidToken true for valid/false for invalid, removeToken invalidates token
- [x] T031 [P] Update tests for projects route in `server/tests/projects-routes.test.ts` — GET with valid token returns all projects, GET without token excludes private
- [x] T032 [P] Update tests for sessions route in `server/tests/sessions-routes.test.ts` — GET filters private sessions without token, POST rejects private projectId/folderPath without token, both work with valid token
- [x] T033 Update tests for private routes in `server/tests/private-routes.test.ts` — unlock returns token field, lock invalidates token

**Checkpoint:** All v2 behavior covered by tests

### Phase 11: Validation

- [x] T034 Run quickstart.md v2 scenarios 1-7 end-to-end — verify all acceptance criteria from spec v2

## Dependencies

```
v1 (T001-T018) ✅ DONE
  │
  ├── T019, T020 (Foundation v2)
  │     │
  │     ├── T021-T026 (API enforcement, sequential)
  │     │     │
  │     │     ├── T027-T029 (Client token, sequential)
  │     │     │
  │     │     └── T030-T033 (Tests, parallel after T026)
  │     │
  │     └── T030 can start after T019
  │
  └── T027-T029 + T030-T033 → T034 (Validation)
```

## Implementation Strategy

### MVP First
1. **Phase 7** (T019-T020): Foundation — token store + path lookup
2. **Phase 8** (T021-T026): Server enforcement — testable via curl
3. **STOP and validate** server-side filtering works
4. **Phase 9** (T027-T029): Client integration — full UI flow
5. **Phase 10** (T030-T033): Tests — parallel after Phase 8
6. **Phase 11** (T034): End-to-end validation

### What's NOT changing (works from v1)
- US1 (Set Private) — `PATCH /:id/private` unchanged
- US3 (Remove Private) — same endpoint, needs unlock first (already works)
- Password setup — `POST /api/private/setup` unchanged
- UI modals — `UnlockModal.tsx`, `SetPrivateModal.tsx` logic unchanged
