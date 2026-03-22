# Feature: CLI Launcher

**ID:** 001-cli-launcher
**Created:** 2026-03-23
**Status:** Draft

## Problem Statement

ผู้ใช้ต้องการ monitor และจัดการ Claude Code CLI sessions ผ่านหน้าเว็บ แทนที่จะต้อง SSH หรือเปิด terminal โดยตรง ปัจจุบันการเปิด Claude Code CLI ต้องทำผ่าน terminal เท่านั้น ทำให้ไม่สะดวกเมื่อต้องจัดการหลาย session พร้อมกันหรือ monitor จากอุปกรณ์อื่น

## User Scenarios & Testing

### User Story 1 - Launch CLI in Selected Folder (Priority: P1)

ผู้ใช้เปิดหน้าเว็บ เลือก folder ที่ต้องการทำงาน แล้วกดปุ่มเพื่อเปิด Claude Code CLI session ใหม่ใน folder นั้น ระบบสร้าง session และแสดง terminal output แบบ real-time บนหน้าเว็บ

**Why this priority**: นี่คือ core value ของ product — เปิด CLI ผ่านเว็บได้โดยไม่ต้องเข้า terminal โดยตรง
**Independent Test**: เปิดเว็บ → เลือก folder → กด launch → เห็น CLI session ทำงานบนหน้าเว็บ

**Acceptance Scenarios**:
1. **Given** หน้าเว็บเปิดอยู่, **When** ผู้ใช้เลือก folder และกด "Launch", **Then** ระบบสร้าง CLI session ใหม่และแสดง terminal output แบบ real-time
2. **Given** session กำลังทำงาน, **When** ผู้ใช้ดูหน้าเว็บ, **Then** เห็น terminal output ที่ update แบบ real-time
3. **Given** folder ที่เลือกไม่มีอยู่จริง, **When** ผู้ใช้กด "Launch", **Then** แสดง error message ที่ชัดเจน

### User Story 2 - Browse and Select Folder (Priority: P1)

ผู้ใช้สามารถ browse file system เพื่อเลือก folder ที่ต้องการเปิด CLI session ได้สะดวก

**Why this priority**: ต้องเลือก folder ได้ก่อนจึงจะ launch ได้ — เป็น prerequisite ของ US1
**Independent Test**: เปิดเว็บ → เห็น folder browser → navigate ไปยัง folder ที่ต้องการ → เลือกได้

**Acceptance Scenarios**:
1. **Given** หน้าเว็บเปิดอยู่, **When** ผู้ใช้เปิด folder browser, **Then** เห็นรายการ folder ในระบบ
2. **Given** folder browser เปิดอยู่, **When** ผู้ใช้คลิก folder, **Then** สามารถ navigate เข้าไปดู sub-folders ได้
3. **Given** ผู้ใช้เลือก folder แล้ว, **When** ดูหน้าเว็บ, **Then** เห็น path ของ folder ที่เลือกแสดงชัดเจน

### User Story 3 - View Active Sessions (Priority: P2)

ผู้ใช้สามารถเห็นรายการ CLI sessions ที่กำลังทำงานอยู่ทั้งหมด และสลับดู output ของแต่ละ session ได้

**Why this priority**: เมื่อ launch ได้แล้ว ต้องจัดการหลาย sessions ได้
**Independent Test**: เปิด 2+ sessions → เห็นรายการ sessions → คลิกสลับดู output แต่ละ session

**Acceptance Scenarios**:
1. **Given** มี sessions ทำงานอยู่, **When** ผู้ใช้ดูหน้า dashboard, **Then** เห็นรายการ sessions ทั้งหมดพร้อมสถานะ
2. **Given** รายการ sessions แสดงอยู่, **When** ผู้ใช้คลิก session, **Then** เห็น terminal output ของ session นั้น
3. **Given** session จบการทำงาน, **When** ผู้ใช้ดูรายการ, **Then** สถานะอัปเดตเป็น "ended"

### Edge Cases
- folder ที่เลือกถูกลบหลังจากเลือกแล้วแต่ก่อนกด launch?
- tmux session ถูก kill จากภายนอก (ไม่ผ่านเว็บ)?
- connection ระหว่างเว็บกับ server หลุด — reconnect แล้วเห็น output ที่พลาดไปหรือไม่?
- เปิด sessions จำนวนมาก — มี limit หรือไม่?

## Functional Requirements

- **FR-001**: System MUST allow user to browse and select a folder from the file system
- **FR-002**: System MUST launch a CLI session in the selected folder via a background terminal session manager
- **FR-003**: System MUST stream terminal output to the web browser in real-time
- **FR-004**: System MUST display a list of all active sessions with their status (running/ended)
- **FR-005**: System MUST allow user to switch between active sessions to view their output
- **FR-006**: System MUST show clear error messages when folder is invalid or session fails to start
- **FR-007**: System MUST handle reconnection gracefully — resume streaming without losing output

## Key Entities

- **Session**: A running CLI instance — key attributes: ID, folder path, status (running/ended), created time
- **Folder**: A directory on the host file system — key attributes: path, name, has children

## Success Criteria (technology-agnostic, measurable)

- **SC-001**: User can launch a CLI session in any valid folder within 3 seconds of clicking "Launch"
- **SC-002**: Terminal output appears on screen within 500ms of being generated
- **SC-003**: User can manage and switch between at least 5 concurrent sessions
- **SC-004**: After page refresh, user can reconnect to existing sessions and see current output

## Out of Scope

- User authentication / multi-user support (single user, local use)
- Sending input/commands to the CLI session from the web (read-only monitoring for MVP)
- File editing through the web interface
- Session persistence across server restarts
- Mobile-optimized layout

## Assumptions

- ระบบทำงานบน local machine เท่านั้น (localhost) — ไม่มี auth
- ใช้ tmux เป็น session manager เบื้องหลัง (ผู้ใช้ระบุ)
- Claude Code CLI ถูกติดตั้งบนเครื่องแล้ว
- Browser รองรับ modern web standards (WebSocket/SSE)
- Maximum concurrent sessions: 10 (สมเหตุสมผลสำหรับ local machine)
