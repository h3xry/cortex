# Implementation Plan: Private Project

**Spec:** [spec.md](./spec.md)
**Created:** 2026-03-23
**Status:** Draft

## Summary

เพิ่ม field `isPrivate` ให้ Project entity เก็บใน `projects.json`, เก็บ global password hash ใน `settings.json` แยกไฟล์ โดยใช้ Node.js built-in `crypto.scrypt` สำหรับ hashing ฝั่ง client ทำ filtering ไม่แสดง private projects จนกว่าจะ unlock (React state, หายเมื่อรีเฟรช)

## Technical Context

| Aspect | Decision |
|--------|----------|
| Language/Version | TypeScript (Node.js + React) |
| Primary Dependencies | express, crypto (built-in), react |
| Storage | JSON file (`~/.cc-monitor/projects.json` + `settings.json`) |
| Testing | vitest + supertest |
| Target Platform | Web (responsive) |
| Project Type | Full-stack web app |
| Performance Goals | Standard (< 200ms API response) |
| Constraints | No new npm dependencies |

## Constitution Check

- [x] Spec aligns with project principles (user privacy, simplicity)
- [x] No constitution violations (no hardcoded secrets, input validation at boundaries)
- [x] Scope is appropriate (minimal viable, no over-engineering)

## Project Structure

### Documentation
```
.claude/specs/006-private-project/
├── spec.md
├── plan.md          ← this file
├── research.md
├── data-model.md
├── contracts/
│   └── api.md
├── quickstart.md
└── tasks.md         ← next step
```

### Source Code Changes

**Server (new files):**
```
server/src/services/settings-store.ts   ← global settings (password hash)
server/src/services/crypto.ts           ← hash/verify helpers
server/src/routes/private.ts            ← /api/private/* endpoints
```

**Server (modified files):**
```
server/src/types.ts                     ← add isPrivate to Project
server/src/services/project-store.ts    ← add setPrivate method
server/src/routes/projects.ts           ← add PATCH /:id/private
server/src/index.ts                     ← register private routes
```

**Client (new files):**
```
client/src/components/UnlockModal.tsx    ← password input modal
client/src/components/SetPrivateModal.tsx ← set project private modal
```

**Client (modified files):**
```
client/src/types.ts                     ← add isPrivate to Project
client/src/hooks/useProjects.ts         ← add unlock state, filtering
client/src/App.tsx                      ← unlock button, modals
client/src/components/ProjectList.tsx   ← filter private, show lock badge
```

## Key Design Decisions

1. **No new dependencies** — ใช้ `crypto.scrypt` + `crypto.randomBytes` ที่ Node.js มีอยู่แล้ว
2. **Client-side filtering** — Server ส่งทุก project มา (รวม isPrivate flag), client ซ่อนเอง เพราะเป็น casual privacy
3. **Separate settings file** — Password hash อยู่ใน `~/.cc-monitor/settings.json` ไม่ปนกับ project data
4. **React state for unlock** — ไม่ใช้ localStorage/sessionStorage ตาม FR-004

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| None | — | — |
