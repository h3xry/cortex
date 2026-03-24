# Feature: Session Status via Hooks

**ID:** 009-session-status-hooks
**Created:** 2026-03-24
**Status:** Draft

## Problem Statement

ปัจจุบันไม่มีทางรู้ว่า Claude Code ใน session ไหนกำลังทำอะไรอยู่ — กำลังคิด, ใช้ tool, รอ user input, หรือ idle ผู้ใช้ต้องเปิดดู terminal ทีละ session เพื่อเช็ค ทำให้จัดการหลาย sessions พร้อมกันไม่สะดวก

Claude Code มี hook system ที่ส่ง HTTP request เมื่อเกิด event (PreToolUse, Stop, PermissionRequest ฯลฯ) สามารถใช้เพื่อ track สถานะ real-time ของแต่ละ session ได้

## User Scenarios & Testing

### User Story 1 - See Session Activity Status (Priority: P1)

ผู้ใช้ดู session list แล้วเห็นสถานะของแต่ละ session: idle (เสร็จแล้ว), thinking (กำลังคิด), working (ใช้ tool), help (รอ user input) โดยไม่ต้องเปิดดู terminal

**Why this priority**: Core value — รู้สถานะทุก session ได้ทันทีจาก list
**Independent Test**: เปิดเว็บ → เห็น session list → Claude กำลังทำงาน → เห็น "Working" badge → Claude เสร็จ → เห็น "Idle" badge

**Acceptance Scenarios**:
1. **Given** session ที่ Claude กำลังใช้ tool, **When** ดู session list, **Then** เห็น badge "Working" สีเหลือง
2. **Given** session ที่ Claude เสร็จงาน (Stop), **When** ดู session list, **Then** เห็น badge "Idle" สีเทา
3. **Given** session ที่ Claude รอ permission, **When** ดู session list, **Then** เห็น badge "Help" สีแดง กระพริบ
4. **Given** session ที่ Claude กำลังคิด, **When** ดู session list, **Then** เห็น badge "Thinking" สีฟ้า

### User Story 2 - Auto-Setup Hooks (Priority: P1)

เมื่อ launch session ระบบ setup Claude Code hooks อัตโนมัติให้ส่ง event มาที่ server ผู้ใช้ไม่ต้อง config เอง

**Why this priority**: ถ้าต้อง config hooks เองจะใช้ยาก — ต้อง auto-setup
**Independent Test**: Launch session → hooks ถูก config อัตโนมัติ → status updates เมื่อ Claude ทำงาน

**Acceptance Scenarios**:
1. **Given** ผู้ใช้ launch session, **When** session เริ่ม, **Then** Claude Code hooks ถูก setup ให้ส่ง event มาที่ server port
2. **Given** hooks ถูก setup แล้ว, **When** Claude ใช้ tool, **Then** server ได้รับ PreToolUse event และ update status

### Edge Cases
- Claude Code crash โดยไม่ส่ง Stop event — ต้อง detect จาก tmux session status
- หลาย sessions ส่ง events พร้อมกัน — ต้อง identify ว่า event มาจาก session ไหน
- Server restart — status reset เป็น unknown จนกว่าจะได้ event ใหม่
- Hooks config conflict กับ hooks ที่ user มีอยู่แล้ว — ต้อง append ไม่ใช่ overwrite

## Functional Requirements

- **FR-001**: System MUST receive Claude Code hook events via HTTP endpoint
- **FR-002**: System MUST track activity status per session: idle, thinking, working, help, error
- **FR-003**: System MUST map hook events to status: PreToolUse→working, PostToolUse→thinking, Stop/TaskCompleted→idle, PermissionRequest→help
- **FR-004**: System MUST display activity status badge in session list and session manager cards
- **FR-005**: System MUST setup hooks configuration when launching a session (via --hooks-server-url flag or settings file)
- **FR-006**: System MUST handle missing/late events gracefully (default to "unknown" status)
- **FR-007**: System MUST identify which session an event belongs to (via session/directory matching)

## Key Entities

- **SessionActivity**: Activity state for a session — key attributes: sessionId, status (idle/thinking/working/help/error), lastEvent, lastEventAt, toolName (current tool if working)

## Success Criteria (technology-agnostic, measurable)

- **SC-001**: Status badge updates within 1 second of Claude Code activity change
- **SC-002**: All 5 states (idle, thinking, working, help, error) displayed correctly
- **SC-003**: Hooks auto-configured on session launch — zero manual setup
- **SC-004**: Status visible in session list without opening terminal

## Out of Scope

- Token usage / cost tracking
- Activity heatmap / history
- Subagent tracking (only root session)
- Custom hook event handling

## Assumptions

- Claude Code supports `--hooks-server-url` flag or we append to settings.json hooks
- Hook events include session/directory info to match with our sessions
- Events are sent as HTTP POST with JSON body from stdin
- Server port is known and accessible from Claude Code process (localhost)
