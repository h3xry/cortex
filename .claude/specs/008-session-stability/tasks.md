# Tasks: Session Stability

**Plan:** [plan.md](./plan.md)
**Created:** 2026-03-23
**Total Tasks:** 12

## Phase 1: Foundation (BLOCKS all stories)

- [x] T001 Add `tailRestartCount` and `tailLastRestartAt` fields to `SessionEntry` interface in `server/src/services/session-manager.ts`
- [x] T002 Add error handler to `tailFile()` — attach `.on("error")` to child process and `.on("error")` to stdout in `server/src/services/tmux.ts`

**Checkpoint:** No unhandled exceptions from tail process

## Phase 2: User Story 1 — Resilient Output Stream (P1) MVP

**Goal:** Tail process recovers automatically, listeners isolated, session status accurate
**Independent Test:** Kill tail process → output resumes within 5s

- [x] T003 Wrap each `listener(text)` call in try-catch in `startOutputStream()`, remove broken listener on error — `server/src/services/session-manager.ts`
- [x] T004 Implement restart logic in tail `exit` handler: check `tmux.hasSession()`, if alive restart with backoff (1s→2s→4s), if dead call `updateStatus(ended)` — `server/src/services/session-manager.ts`
- [x] T005 Implement circuit breaker: track restart count/timing, stop after 3 failures within 30s, reset counter after 30s of stability — `server/src/services/session-manager.ts`
- [x] T006 Add diagnostic logging for tail errors, restarts, and circuit breaker trips — `server/src/services/session-manager.ts`
- [x] T007 Write tests for restart backoff logic (mock tail process exit, verify restart count and timing) — `server/tests/session-stability.test.ts`

**Checkpoint:** US1 independently functional — tail crash auto-recovers, one bad listener can't break others

## Phase 3: User Story 2 — Reliable Stream Startup (P2)

**Goal:** Output stream waits for pipe-pane before starting tail
**Independent Test:** Create sessions rapidly → all show output within 2s

- [x] T008 Add `waitForPipePane()` helper: poll log file mtime/size with 100ms interval, 2s timeout, resolve when file has data or timeout — `server/src/services/session-manager.ts`
- [x] T009 Call `waitForPipePane()` between `startPipePane()` and `startOutputStream()` in `createSession()` — `server/src/services/session-manager.ts`

**Checkpoint:** US2 independently functional — no more race condition on startup

## Phase 4: User Story 3 — Connection Health Monitoring (P3)

**Goal:** Detect and clean up dead WebSocket connections
**Independent Test:** Simulate dead connection → server cleans up within 60s

- [x] T010 Add ping/pong heartbeat: `setInterval(() => ws.ping(), 30_000)`, track pong with `ws.on("pong")`, terminate after 2 missed pongs — `server/src/ws/terminal.ts`
- [x] T011 Clean up ping interval in existing `cleanup()` function — `server/src/ws/terminal.ts`

**Checkpoint:** US3 independently functional — dead connections detected and cleaned up

## Phase 5: Validation

- [x] T012 Run quickstart.md manual validation scenarios (5 tests) and verify all pass

## Dependencies

```
T001, T002 (Foundation) → T003-T007 (US1) → T008-T009 (US2) → T010-T011 (US3) → T012
                          ↑ can start after foundation
```

- Foundation blocks all stories
- US1 → US2 → US3 are sequential (US2 modifies `createSession()` which US1 also touches)
- T003, T004, T005, T006 are sequential (each builds on previous in same function)
- T010, T011 are sequential (T011 depends on T010's interval ref)

## Implementation Strategy

### MVP First (Recommended)
1. Foundation (T001-T002)
2. US1 (T003-T007) → validate tail recovery works
3. **STOP and validate MVP** — this fixes the primary "session drops" symptom
4. US2 (T008-T009) → validate startup reliability
5. US3 (T010-T011) → validate heartbeat
6. Full validation (T012)
