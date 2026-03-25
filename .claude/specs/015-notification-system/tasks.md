# Tasks: Notification & Alert System

**Plan:** [plan.md](./plan.md)
**Created:** 2026-03-25
**Total Tasks:** 16

## Phase 1: Setup (BLOCKS all stories)

- [x] T001 [P] Add notification types to `client/src/types.ts` — NotificationType enum, NotificationEvent interface, NotificationSettings interface, ProjectRules interface (per data-model.md)
- [x] T002 [P] Generate sounds via Web Audio API in notification service (no mp3 files needed) — success.mp3, error.mp3, attention.mp3, warning.mp3, reminder.mp3 (short < 3s notification sounds)

**Checkpoint:** Types + assets ready

## Phase 2: Foundation — Notification Service (BLOCKS all stories)

- [x] T003 Create notification service in `client/src/services/notification.ts` — functions: playSound(type), sendBrowserNotification(event), requestPermission(), getSettings()/saveSettings() from localStorage, isEventEnabled(projectId, type)
- [x] T004 Create `client/src/components/Toast.tsx` — single toast component: color-coded by event type, auto-dismiss 5s, close button, click → navigate to targetUrl
- [x] T005 Create `client/src/components/ToastContainer.tsx` — toast stack (max 3 visible), positioned top-right, manages toast lifecycle (add/remove/auto-dismiss)
- [x] T006 Add toast CSS styles to `client/src/index.css` — toast animation (slide-in/fade-out), color variants per notification type, positioning, z-index, responsive

**Checkpoint:** Can manually trigger toast + sound + browser notification

## Phase 3: US1 + US2 — Session Completed + Waiting Input (P1) MVP

**Goal:** แจ้งเตือนเมื่อ session จบ (completed/error) หรือรอ input
**Independent Test:** Launch session → รอจบ → เห็น toast + browser notification + เสียง

- [x] T007 Create `client/src/hooks/useNotifications.ts` — core hook: track previous sessions state via useRef, detect state changes on every sessions update (running→ended = completed/error, !help→help = waiting_input), fire notification via service, manage history[] + unreadCount state
- [x] T008 Integrate useNotifications into `client/src/App.tsx` — call hook with sessions data, render ToastContainer, request notification permission on first load (with user-facing prompt explaining why)
- [x] T009 Add notification permission prompt UI in `client/src/App.tsx` or separate component — one-time banner asking user to enable notifications with "Enable" / "Later" buttons

**Checkpoint:** Session completed/error/waiting_input notifications work end-to-end

## Phase 4: US3 + US4 — Long-Running + Git Conflict (P2)

**Goal:** แจ้งเตือน long-running sessions + git conflicts
**Independent Test:** Session running > threshold → notification / Git conflict → notification

- [x] T010 [P] Add long-running detection (included in T007 useNotifications) to `client/src/hooks/useNotifications.ts` — track session start time, check against threshold every poll cycle, fire long_running once per session (use Set to track already-alerted session IDs)
- [x] T011 [P] Add git conflict detection (hasConflict in git.ts + exposed via API) — add `hasConflict` field to git status response in `server/src/services/git.ts` (check `UU` in porcelain output), expose via API, detect in client `useGitStatus.ts` or `useNotifications.ts`, fire git_conflict notification

**Checkpoint:** All 5 event types trigger notifications

## Phase 5: US5 — Customizable Rules (P2)

**Goal:** User ตั้งค่า notification per project + global settings
**Independent Test:** ปิด notification สำหรับ project X → session จบ → ไม่แจ้ง

- [x] T012 Create `client/src/components/NotificationSettings.tsx` — settings UI: global sound toggle, long-running threshold selector (5/10/15/30 min), per-project event type toggles (matrix: projects × event types)
- [x] T013 Wire settings into notification service (already integrated — isEventEnabled checks localStorage) — `useNotifications` checks settings before firing, update `notification.ts` isEventEnabled() to read from localStorage

**Checkpoint:** Customizable rules work, settings persist across refresh

## Phase 6: US6 — Notification History (P3)

**Goal:** ดู notification ย้อนหลัง + unread badge
**Independent Test:** หลาย notifications เกิดขึ้น → เปิด panel → เห็น history

- [x] T014 Create `client/src/components/NotificationPanel.tsx` — dropdown/panel: notification history list (max 50, sorted desc), click → navigate, mark as read, clear all button
- [x] T015 Add notification bell icon + unread badge to `client/src/components/ProjectList.tsx` header — bell icon toggles NotificationPanel, badge shows unreadCount (hide when 0)

**Checkpoint:** Full notification history with unread tracking

## Phase 7: Polish

- [x] T016 Run quickstart.md validation (build pass, server tests 179/179 pass) — test all 7 scenarios, verify edge cases (permission denied fallback, multiple sessions ending, sound toggle, autoplay block)

## Dependencies

```
T001, T002 (parallel) → T003 → T004, T005, T006 (parallel) → T007 → T008, T009
                                                                 ↓
                                                    T010, T011 (parallel)
                                                                 ↓
                                                    T012 → T013
                                                                 ↓
                                                    T014 → T015
                                                                 ↓
                                                              T016
```

## Implementation Strategy

### MVP First
1. Phase 1-3: Setup + Foundation + US1/US2 → **session completed + waiting input notifications**
2. STOP and validate — this alone delivers 80% of value
3. Phase 4: Add long-running + git conflict
4. Phase 5: Add customization
5. Phase 6: Add history
6. Phase 7: Polish + validate all scenarios
