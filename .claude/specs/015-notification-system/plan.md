# Implementation Plan: Notification & Alert System

**Spec:** [spec.md](./spec.md)
**Created:** 2026-03-25
**Status:** Draft

## Summary

Client-side notification service ที่ detect session state changes จาก existing polling (useSessions 3s interval) แล้วแจ้งเตือนผ่าน 3 channels: browser notification, in-app toast, sound. Settings เก็บใน localStorage. ไม่ต้องเพิ่ม server-side logic ใดๆ — ใช้ data ที่ poll อยู่แล้ว

## Technical Context

| Aspect | Decision |
|--------|----------|
| Language/Version | TypeScript (React 19 + Vite) |
| Primary Dependencies | None — ใช้ native Web APIs ทั้งหมด |
| Storage | localStorage (settings), in-memory (history) |
| Testing | Vitest + Testing Library |
| Target Platform | Web (desktop + mobile PWA) |
| Project Type | Client-side feature (no server changes) |
| Performance Goals | Notification < 5s after event |
| Constraints | Browser Notification API requires user permission |

## Constitution Check

- [x] Spec aligns with project principles (User First — แจ้งเตือนให้ไม่พลาด event)
- [x] No constitution violations
- [x] Scope is appropriate (client-only, no new dependencies)

## Project Structure

### Documentation
```
.claude/specs/015-notification-system/
├── spec.md
├── plan.md          # This file
├── research.md      # ✅ Done
├── data-model.md
└── quickstart.md
```

### Source Code (new files)
```
client/src/
├── hooks/
│   └── useNotifications.ts    # Core notification hook
├── services/
│   └── notification.ts        # Notification service (detect, send, sound)
├── components/
│   ├── Toast.tsx              # In-app toast component
│   ├── ToastContainer.tsx     # Toast stack container
│   ├── NotificationPanel.tsx  # History panel (US6)
│   └── NotificationSettings.tsx # Settings UI (US5)
├── types.ts                   # Add notification types
└── ...

client/public/
└── sounds/
    ├── success.mp3
    ├── error.mp3
    ├── attention.mp3
    ├── warning.mp3
    └── reminder.mp3
```

### Modified files
```
client/src/
├── App.tsx                    # Add ToastContainer + NotificationPanel
├── hooks/useSessions.ts       # Export prev state for diff detection
├── hooks/useGitStatus.ts      # Add conflict detection
├── components/ProjectList.tsx  # Add notification bell + badge
└── types.ts                   # Add notification types
```

## Architecture

### Event Detection Flow

```
useSessions (3s poll)
    ↓ sessions[] (current vs previous)
    ↓
useNotifications hook
    ├── diff detect: session.status changed?
    ├── diff detect: session.activity.status changed?
    ├── timer: session running > threshold?
    └── git: conflict markers detected?
         ↓
    notification.ts service
    ├── check settings (enabled for this project + event type?)
    ├── add to history (in-memory, max 50)
    ├── show browser notification (if permission granted + tab not focused)
    ├── show in-app toast (always)
    └── play sound (if enabled)
```

### State Change Detection

`useNotifications` เก็บ previous sessions state แล้วเปรียบเทียบทุก poll cycle:

| Previous State | Current State | Event |
|---------------|---------------|-------|
| `status: running` | `status: ended` + `activity: done` | `session_completed` |
| `status: running` | `status: ended` + `activity: error` | `session_error` |
| `activity: !help` | `activity: help` | `waiting_input` |
| running > threshold | still running | `long_running` (once) |

### Git Conflict Detection

เพิ่ม logic ใน `useGitStatus` หรือแยก hook:
- Poll git status ทุก 10s เมื่อมี running session
- ดู `UU` prefix ใน `git status --porcelain` output
- ถ้าพบ → fire `git_conflict` event

### Sound System

```typescript
// notification.ts
const sounds = {
  session_completed: new Audio("/sounds/success.mp3"),
  session_error: new Audio("/sounds/error.mp3"),
  waiting_input: new Audio("/sounds/attention.mp3"),
  git_conflict: new Audio("/sounds/warning.mp3"),
  long_running: new Audio("/sounds/reminder.mp3"),
};

function playSound(type: NotificationType) {
  if (!settings.soundEnabled) return;
  sounds[type].currentTime = 0;
  sounds[type].play().catch(() => {}); // ignore autoplay block
}
```

### Browser Notification

```typescript
function sendBrowserNotification(event: NotificationEvent) {
  if (document.hasFocus()) return; // ไม่แจ้งถ้าอยู่หน้า Cortex
  if (Notification.permission !== "granted") return;

  const n = new Notification(event.title, {
    body: event.message,
    icon: "/icons/icon.svg",
    tag: event.id, // prevent duplicates
  });
  n.onclick = () => navigate(event.targetUrl);
}
```

### Toast Component

Animated toast stack มุมขวาบน:
- Auto-dismiss 5 วินาที
- Click → navigate to target
- Close button
- Color-coded ตาม event type (green/red/blue/yellow/gray)
- Max 3 toasts visible พร้อมกัน

### Settings Storage (localStorage)

```typescript
interface NotificationSettings {
  soundEnabled: boolean;           // default: true
  longRunningThreshold: number;    // default: 600000 (10 min in ms)
  projectRules: Record<string, {   // projectId → rules
    session_completed: boolean;
    session_error: boolean;
    waiting_input: boolean;
    long_running: boolean;
    git_conflict: boolean;
  }>;
}
// Key: "cortex-notification-settings"
```

Default: ทุก event เปิด ทุก project

### Notification History (in-memory)

```typescript
// useNotifications state
const [history, setHistory] = useState<NotificationEvent[]>([]);
const [unreadCount, setUnreadCount] = useState(0);
// Max 50 items, LIFO
```

### UI Integration Points

1. **App.tsx** — wrap with `<ToastContainer>` + render `<NotificationPanel>`
2. **ProjectList.tsx (header)** — notification bell icon + unread badge
3. **Settings** — accessible from bell dropdown or project settings

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| None | — | — |

## Validation

- [x] Follows constitution (Simplicity — client-only, no new deps)
- [x] Simpler alternatives considered (server push rejected — polling sufficient)
- [x] Dependencies identified (None new — all native Web APIs)
- [x] All NEEDS CLARIFICATION resolved
- [x] File structure defined
- [x] Data model documented (NotificationEvent, NotificationSettings)
