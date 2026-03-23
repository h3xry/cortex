# Implementation Plan: Session Stability

**Spec:** [spec.md](./spec.md)
**Created:** 2026-03-23
**Status:** Draft

## Summary

Fix 6 bugs causing tmux sessions to drop by adding error handling, auto-restart with backoff, listener isolation, race condition fix, and WebSocket heartbeat. All changes are server-side — 2 files modified, 0 new files.

## Technical Context

| Aspect | Decision |
|--------|----------|
| Language/Version | TypeScript (Node.js) |
| Primary Dependencies | ws (WebSocket), node:child_process |
| Storage | N/A (in-memory state) |
| Testing | vitest (existing) |
| Target Platform | WebSocket server |
| Project Type | web-service |
| Performance Goals | Recovery < 5s, heartbeat 30s interval |
| Constraints | No client-side changes, pipe-pane approach stays |

## Constitution Check

- [x] Spec aligns with project principles (§2.1: "Error handling required, no silent failures")
- [x] No constitution violations
- [x] Scope appropriate — bug fix, minimal changes

## Project Structure

### Files to Modify

```
server/src/
├── services/
│   ├── session-manager.ts   # Main changes: error handling, restart logic, listener isolation
│   └── tmux.ts              # Add error handler to tailFile
└── ws/
    └── terminal.ts          # Add WebSocket ping/pong heartbeat
```

### No New Files

All changes fit within existing modules. No new abstractions needed.

## Approach by Bug

### Bug #1 & #2: No error handlers on tail process (CRITICAL)
**File:** `tmux.ts:tailFile()` + `session-manager.ts:startOutputStream()`
**Fix:** Add `.on("error")` handler to tail child process in both locations. Log error, prevent unhandled exception.

### Bug #3: Listener errors propagate uncaught (HIGH)
**File:** `session-manager.ts:startOutputStream()` lines 122-124
**Fix:** Wrap each `listener(text)` call in try-catch. On error, remove the broken listener from the set and log warning.

### Bug #4: Race condition — tail starts before pipe-pane ready (HIGH)
**File:** `session-manager.ts:startOutputStream()`
**Fix:** After `startPipePane()`, poll the log file (check mtime or size > 0) with 100ms interval, up to 2s timeout, before calling `tailFile()`. If timeout, start tail anyway (file exists, just empty — tail -f will pick up writes).

### Bug #5: Tail exit handler does nothing (HIGH)
**File:** `session-manager.ts:startOutputStream()` lines 129-131
**Fix:** On tail exit, check if session is still alive (`tmux.hasSession()`). If alive → restart tail with backoff. If dead → mark session ended. Track restart count/timing for circuit breaker (max 3 in 30s).

### Bug #6: No WebSocket ping/pong (MEDIUM)
**File:** `terminal.ts:handleConnection()`
**Fix:** Add `setInterval(() => ws.ping(), 30_000)`. Track pong responses — if 2 consecutive pings get no pong, terminate connection. Clean up interval on close.

## Restart Backoff Logic

```
attempt 1: wait 1s, restart
attempt 2: wait 2s, restart
attempt 3: wait 4s, restart
attempt 4+: stop, log "tail recovery failed for session X"
```

Reset counter if 30s pass without a failure (transient issue resolved).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| Restart backoff state (2 new fields) | FR-003 requires limiting restarts | Simple counter without timing — can't distinguish "3 failures in 1 minute" from "3 failures over 1 hour" |

## Validation

- [x] Follows constitution principles
- [x] Simpler alternatives considered (documented above)
- [x] Dependencies identified (none new)
- [x] All research topics resolved
- [x] File structure defined
- [x] Data model documented
