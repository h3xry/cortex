# Research: Notification System

## Event Detection Mechanisms (Existing)

**Decision:** ใช้ session activity hooks ที่มีอยู่แล้วเป็น event source หลัก
**Rationale:** ระบบมี activity state machine ครบ (idle, thinking, working, done, error, help) ผ่าน Claude Code hooks → `/api/hooks` → `processHookEvent()` → ActivityEntry maps
**Alternatives:** WebSocket-only approach (rejected — polling ที่มีอยู่ทำงานดีอยู่แล้ว)

### Activity States ที่ map กับ notification events:
| Activity State | Notification Event |
|---------------|-------------------|
| `done` | session_completed |
| `error` | session_error |
| `help` | waiting_input |
| Timer-based | long_running |
| Git status polling | git_conflict |

## Notification Delivery

**Decision:** Client-side notification service ที่ detect state changes จาก existing polling (useSessions 3s interval)
**Rationale:** ไม่ต้องเพิ่ม server-side logic — session data + activity มาถึง client อยู่แล้วทุก 3 วินาที แค่เพิ่ม diff detection
**Alternatives:**
- Server-push via WebSocket (rejected — over-engineering, polling 3s เพียงพอแล้ว)
- Server-Sent Events (rejected — เพิ่ม complexity ไม่จำเป็น)

## Sound Implementation

**Decision:** `<audio>` element + preload สำหรับ 5 sound files
**Rationale:** ง่ายที่สุด รองรับทุก browser, Web Audio API ซับซ้อนเกินไปสำหรับแค่เล่นเสียงสั้นๆ
**Alternatives:** Web Audio API (rejected — overkill), Tone.js (rejected — dependency ใหญ่เกินไป)

### Sound Files ต้องสร้าง:
- `success.mp3` — session completed
- `error.mp3` — session error
- `attention.mp3` — waiting for input
- `warning.mp3` — git conflict
- `reminder.mp3` — long-running

## Settings Storage

**Decision:** localStorage
**Rationale:** Client-only settings, ไม่ต้อง sync, ไม่ต้อง server API
**Alternatives:** Server-side settings in `~/.cortex/` (rejected — over-engineering สำหรับ notification prefs)

## Git Conflict Detection

**Decision:** ตรวจ `UU` status code จาก `git status --porcelain` ที่ poll อยู่แล้วใน useGitStatus
**Rationale:** ไม่ต้องเพิ่ม polling ใหม่ — แค่เพิ่ม conflict detection logic
**Alternatives:** File watcher on `.git/MERGE_HEAD` (rejected — ซับซ้อนเกินไป)
