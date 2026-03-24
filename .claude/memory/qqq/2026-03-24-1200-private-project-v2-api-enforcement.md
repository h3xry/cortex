# Quality Gate Report

**Feature:** 006-private-project v2 — API-level enforcement
**Date:** 2026-03-24
**Files Changed:** 20 (6 server src, 5 client src, 4 test files, 5 spec files)

## Security Review
**Status:** WARN
**Issues:** BLOCKER: 2, HIGH: 4, MEDIUM: 5, LOW: 3

### BLOCKER (context-dependent)
1. **Token store has no expiry** — tokens live in memory Set forever until server restart or explicit lock. *However:* spec explicitly says "casual privacy" and user chose server-memory-based (หายเมื่อ restart). This is by design.
2. **Token in WS URL query param** — exposed in server logs and browser history. *However:* documented in research.md as standard approach since browser WebSocket API doesn't support custom headers.

### HIGH
1. No brute-force protection on `/api/private/unlock` and `/api/private/setup`
2. `DELETE /api/sessions/:id` has no auth check for private sessions
3. `DELETE /api/projects/:id` has no auth check
4. Path normalization bypass — `folderPath` not resolved before `privatePaths.has()` check in sessions.ts

### MEDIUM
5. Minimum password length 4 chars is weak
6. WS upgrade skips privacy check when session not found (leaks existence)
7. Token comparison uses `Set.has()` not `timingSafeEqual`
8. Client token readable by same-origin scripts (acceptable for local tool)
9. Path normalization bypass detail

## Code Review
**Status:** WARN
**Issues:** BLOCKER: 0, HIGH: 2, MEDIUM: 5, LOW: 4

### HIGH
1. Token store no TTL (same as security)
2. No brute-force protection (same as security)

### MEDIUM (actionable)
3. **GET /api/projects missing try/catch** — every other handler has it
4. **Double res.json() pattern in unlock** — works but fragile
5. **lock() uses inline header** instead of getAuthHeaders() helper
6. **WS URL construction duplicated** across useTerminal.ts and MiniTerminal.tsx
7. **hasPrivateProjects = hasGlobalPassword** — semantically misleading alias

## Test Review
**Status:** WARN
**Coverage:** 50.26% overall (pre-existing untested files drag average)

### Per-file coverage (changed files)
| File | Stmts | Status |
|------|-------|--------|
| unlock-store.ts | 100% | PASS |
| private.ts | 83% | PASS |
| sessions.ts | 87% | PASS |
| projects.ts | 59% | FAIL (POST/DELETE untested — pre-existing gap) |

### Missing tests
- WebSocket blocking for private sessions (FR-013/Quickstart Scenario 4)
- POST /api/projects and DELETE /api/projects (pre-existing)
- unlock with missing password body (400 path)

## Consistency Check
**Status:** HAS DEVIATIONS
**Deviations:** Critical: 0, Notable: 2, Minor: 3

### Notable
1. Missing try/catch on GET /api/projects
2. lock() manually builds auth header instead of getAuthHeaders()

### Minor
3. MiniTerminal uses `&token=` vs useTerminal's `?token=`
4. Four imports on one line from unlock-token
5. unlock-store.test.ts missing beforeEach cleanup

## Dependency Audit
**Status:** PASS
**Vulnerabilities:** Critical: 0, High: 0, Medium: 0, Low: 0
**Outdated:** 9 packages (all pre-existing major gaps)
**Unused:** 0
**License issues:** 0

---

## Gate Decision

| Reviewer | Status |
|----------|--------|
| Security | ⚠️ WARN (BLOCKERs are by-design, HIGHs are scope expansion) |
| Code | ⚠️ WARN (2 HIGH same as security, MED fixable) |
| Test | ⚠️ WARN (changed files mostly >80%, overall dragged by pre-existing) |
| Consistency | ⚠️ WARN (no critical, 2 notable) |
| Dependencies | ✅ PASS |

### Result: **WARN**

## Actionable Fixes (recommended before commit)

### Quick fixes (5 min):
1. Add try/catch to GET /api/projects handler
2. Use getAuthHeaders() in lock() instead of inline header
3. Add `path.resolve()` to folderPath before privatePaths check in sessions.ts

### Optional (not blocking, scope expansion):
- Token TTL — by design per spec ("casual privacy", restart clears)
- WS query param — standard approach, documented
- Brute-force protection — out of scope for v2
- DELETE endpoint auth — separate feature
- projects.ts test coverage — pre-existing gap
