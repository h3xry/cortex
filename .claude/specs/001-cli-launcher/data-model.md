# Data Model: 001-cli-launcher

**Created:** 2026-03-23

---

## Entities

### Session

| Field | Type | Description |
|-------|------|-------------|
| id | string (uuid) | Unique session identifier |
| tmuxSessionName | string | tmux session name (format: `cc-{short-id}`) |
| folderPath | string | Absolute path ของ working directory |
| status | enum | `starting` → `running` → `ended` |
| createdAt | ISO datetime | เวลาที่สร้าง session |
| endedAt | ISO datetime | null | เวลาที่ session จบ |

**State Transitions:**
```
starting → running    (tmux session created successfully)
starting → ended      (failed to create tmux session)
running  → ended      (CLI process exits or tmux session killed)
```

**Validation:**
- folderPath ต้องเป็น absolute path
- folderPath ต้องมีอยู่จริงในระบบ
- folderPath ต้องเป็น directory (ไม่ใช่ file)
- Maximum 10 concurrent sessions ที่ status = running

### FolderEntry

| Field | Type | Description |
|-------|------|-------------|
| name | string | ชื่อ folder |
| path | string | Absolute path |
| hasChildren | boolean | มี sub-directories หรือไม่ |

**Validation:**
- path ต้องเป็น absolute path
- ไม่แสดง hidden folders (prefix `.`) by default
- ไม่แสดง folders ที่ไม่มี read permission

## Storage

In-memory only (Map/Array) — ไม่มี database. Sessions หายเมื่อ server restart (ตาม Out of Scope).
tmux sessions ยังอยู่แม้ server restart — สามารถ re-discover ได้จาก tmux list-sessions ถ้าต้องการในอนาคต.
