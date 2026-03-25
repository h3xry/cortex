# Implementation Plan: Private Project (v2 — API-level enforcement)

**Spec:** [spec.md](./spec.md)
**Created:** 2026-03-23
**Updated:** 2026-03-24
**Status:** Draft

## Summary

v1 ใช้ client-side filtering — server ส่ง private projects มาทั้งหมดแล้วให้ client ซ่อนเอง
v2 เปลี่ยนเป็น **server-side enforcement** — server filter/reject private project data ตั้งแต่ API level โดยใช้ **token-based unlock** (random UUID เก็บใน server memory Set, client ส่งใน `X-Unlock-Token` header)

## Technical Context

| Aspect | Decision |
|--------|----------|
| Language/Version | TypeScript (Node.js + React) |
| Primary Dependencies | express, crypto (built-in), ws, react |
| Storage | JSON file (`~/.cortex/projects.json` + `settings.json`) + in-memory Set for tokens |
| Testing | vitest + supertest |
| Target Platform | Web (responsive) |
| Project Type | Full-stack web app |
| Performance Goals | Standard (< 200ms API response) |
| Constraints | No new npm dependencies |

## Constitution Check

- [x] Spec aligns with project principles (user privacy, simplicity)
- [x] No constitution violations (input validation at boundaries, no hardcoded secrets)
- [x] Scope is appropriate (minimal changes to existing code)

## What Exists (v1 — already implemented)

| File | What it does |
|------|-------------|
| `server/src/services/crypto.ts` | scrypt hash/verify — **no change** |
| `server/src/services/settings-store.ts` | Global password hash in settings.json — **no change** |
| `server/src/routes/private.ts` | `/api/private/setup`, `/unlock`, `/status` — **modify unlock** |
| `server/src/routes/projects.ts` | `GET`, `POST`, `PATCH /:id/private`, `DELETE` — **modify GET** |
| `server/src/services/project-store.ts` | `isPrivate` field, `setPrivate()` — **no change** |
| `client/src/hooks/useProjects.ts` | Client-side filtering — **modify to use token** |
| `client/src/components/UnlockModal.tsx` | Password input modal — **minor change** |
| `client/src/components/SetPrivateModal.tsx` | Set project private modal — **no change** |

## What Changes (v2)

### Server — New Files
```
server/src/services/unlock-store.ts    ← in-memory token Set + isUnlocked helper
```

### Server — Modified Files
```
server/src/routes/private.ts           ← unlock returns token
server/src/routes/projects.ts          ← GET filters private projects by token
server/src/routes/sessions.ts          ← GET filters, POST rejects private sessions by token
server/src/ws/terminal.ts              ← WS upgrade checks token for private sessions
```

### Client — Modified Files
```
client/src/hooks/useProjects.ts        ← store token, send in header, remove client filtering
client/src/App.tsx                     ← pass token to session/WS calls (if needed)
```

## Key Design Decisions

1. **New service `unlock-store.ts`** — Single responsibility: manage token Set. Export `addToken()`, `isValidToken()`, `removeToken()`. ง่ายต่อ test.
2. **Helper function `isUnlockedRequest(req)`** — ดึง token จาก `X-Unlock-Token` header, validate กับ Set. ใช้ร่วมกันทุก route.
3. **Session-to-project matching** — Session มี `folderPath`, ต้อง cross-check กับ private projects' paths. ใช้ `projectStore.listProjects()` เพื่อ lookup.
4. **WebSocket token via query param** — WS handshake ไม่รองรับ custom header ง่ายๆ ใน browser, ส่ง token ผ่าน `?token=xxx` แทน.
5. **Client stores token in module-level variable** — ไม่ใช่ React state (เพราะ state อยู่ข้าม re-render แต่หายเมื่อ refresh — ตรง requirement).

## Architecture Flow

```
Client                          Server
  │                               │
  │  POST /api/private/unlock     │
  │  { password }                 │
  │ ─────────────────────────────>│ verify password
  │                               │ generate UUID token
  │  { ok: true, token: "xxx" }  │ add to token Set
  │ <─────────────────────────────│
  │                               │
  │  GET /api/projects            │
  │  X-Unlock-Token: xxx          │
  │ ─────────────────────────────>│ validate token
  │                               │ token valid → return ALL projects
  │  { projects: [...all...] }    │ token invalid/missing → filter out isPrivate=true
  │ <─────────────────────────────│
  │                               │
  │  GET /api/sessions            │
  │  X-Unlock-Token: xxx          │
  │ ─────────────────────────────>│ validate token
  │                               │ filter sessions by private project paths
  │ <─────────────────────────────│
  │                               │
  │  WS /stream/sessions/:id      │
  │  ?token=xxx                   │
  │ ─────────────────────────────>│ check if session belongs to private project
  │                               │ validate token from query param
  │                               │ reject if private + no valid token
  │ <═══════════════════════════=>│
```

## Project Structure

### Documentation
```
.claude/specs/006-private-project/
├── spec.md          # What/Why (v2 updated)
├── plan.md          ← this file (v2 updated)
├── research.md      # Decision log (v2 updated)
├── data-model.md    # Entities (v2 updated)
├── contracts/
│   └── api.md       # API contracts (v2 updated)
├── quickstart.md    # Validation scenarios (v2 updated)
└── tasks.md         ← next step
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| Token-based (vs boolean) | Page refresh must re-lock even if server still running | Boolean flag would keep unlocked across refresh — ไม่ตรง requirement |
| Cross-check folderPath | POST /api/sessions accepts folderPath directly, not just projectId | Block only projectId leaves bypass hole |
