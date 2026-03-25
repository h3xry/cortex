# Data Model: Notification System

## NotificationEvent

| Field | Type | Description |
|-------|------|-------------|
| id | string | UUID short (8 chars) |
| type | NotificationType | Event type enum |
| projectId | string | Project ที่เกิด event |
| projectName | string | ชื่อ project สำหรับแสดงผล |
| sessionId | string \| null | Session ที่เกิด event (null for git_conflict) |
| title | string | หัวข้อ notification (e.g. "Session completed") |
| message | string | รายละเอียด (e.g. "paphop-api session finished successfully") |
| targetUrl | string | URL ที่ navigate ไปเมื่อกด (e.g. project panel + tab) |
| timestamp | string | ISO8601 |
| read | boolean | อ่านแล้วหรือยัง |

### NotificationType (enum)
```
session_completed | session_error | waiting_input | long_running | git_conflict
```

### Sound Mapping
| Type | Sound File | Color |
|------|-----------|-------|
| session_completed | success.mp3 | #a6e3a1 (green) |
| session_error | error.mp3 | #f38ba8 (red) |
| waiting_input | attention.mp3 | #89b4fa (blue) |
| long_running | reminder.mp3 | #6c7086 (gray) |
| git_conflict | warning.mp3 | #f9e2af (yellow) |

---

## NotificationSettings

**Storage:** localStorage key `cortex-notification-settings`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| soundEnabled | boolean | true | Global sound toggle |
| longRunningThreshold | number | 600000 | Threshold in ms (10 min) |
| projectRules | Record<string, ProjectRules> | {} | Per-project overrides |

### ProjectRules

| Field | Type | Default |
|-------|------|---------|
| session_completed | boolean | true |
| session_error | boolean | true |
| waiting_input | boolean | true |
| long_running | boolean | true |
| git_conflict | boolean | true |

ถ้า projectId ไม่อยู่ใน `projectRules` → ใช้ default (ทุก event เปิด)

---

## NotificationHistory (in-memory)

- Array ของ `NotificationEvent[]`
- Max 50 items
- เรียงตาม timestamp desc (ล่าสุดก่อน)
- เมื่อเกิน 50 → ลบตัวเก่าที่สุด
- หายเมื่อ refresh (ไม่ persist)

## State Transitions ที่ trigger notification

```
Session Status:
  running → ended + activity.done    = session_completed
  running → ended + activity.error   = session_error

Activity Status:
  !help → help                       = waiting_input

Timer:
  running duration > threshold       = long_running (once per session)

Git:
  no UU → has UU in git status       = git_conflict (once per conflict set)
```
