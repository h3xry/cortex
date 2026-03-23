# Implementation Plan: Session Manager

**Spec:** [spec.md](./spec.md)
**Created:** 2026-03-23
**Status:** Draft

## Summary

เพิ่ม Session Manager view ใน sidebar ที่ toggle ได้กับ project list แสดง session ทั้งหมดข้าม project พร้อม status, duration, preview Server เพิ่ม `projectName` + `lastOutput` ใน GET /api/sessions response, ปรับ DELETE ให้ handle ended sessions ด้วย Client สร้าง SessionManager component + ปรับ App.tsx ให้ toggle sidebar view

## Technical Context

| Aspect | Decision |
|--------|----------|
| Language/Version | TypeScript (Node.js + React) |
| Primary Dependencies | express, react (existing) |
| Storage | In-memory (existing session map) |
| Testing | vitest + supertest |
| Target Platform | Web (responsive) |
| Project Type | Full-stack web app |
| Performance Goals | Preview update < 3s (polling interval) |
| Constraints | No new npm dependencies, ANSI strip with regex |

## Constitution Check

- [x] Spec aligns with project principles (user management, simplicity)
- [x] No constitution violations
- [x] Scope is appropriate (extends existing, no over-engineering)

## Project Structure

### Source Code Changes

**Server (modified files):**
```
server/src/services/session-manager.ts  ← add getLastOutput(), removeSession()
server/src/routes/sessions.ts           ← enhance GET response, fix DELETE for ended
```

**Client (new files):**
```
client/src/components/SessionManager.tsx ← session list with preview, kill, remove
```

**Client (modified files):**
```
client/src/types.ts                     ← add projectName, lastOutput to Session
client/src/hooks/useSessions.ts         ← add killSession, removeSession
client/src/App.tsx                      ← sidebar toggle, session click handler
client/src/index.css                    ← session manager styles
```

## Key Design Decisions

1. **Sidebar toggle** — Session Manager ใช้พื้นที่ sidebar เดิม toggle ระหว่าง project list กับ session list ไม่ต้องเพิ่ม layout ใหม่
2. **Server-side preview** — Server strip ANSI + extract last line จาก outputBuffer ส่งมาใน polling response, client ไม่ต้องเปิด WS ต่อทุก session
3. **Server-side project mapping** — Match session.folderPath กับ project.path ที่ server ส่ง projectName มาเลย
4. **DELETE dual behavior** — running → kill + remove, ended → remove only ใช้ endpoint เดิม
5. **ANSI strip with regex** — ใช้ regex ง่ายๆ ไม่เพิ่ม dependency

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| None | — | — |
