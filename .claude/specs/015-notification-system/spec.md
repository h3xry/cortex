# Feature: Notification & Alert System

**ID:** 015-notification-system
**Created:** 2026-03-25
**Status:** Draft

## Problem Statement

ผู้ใช้ต้อง monitor session ด้วยตัวเอง — ต้องเปิดดูซ้ำๆ ว่า session จบหรือยัง, มี error ไหม, หรือรอ input อยู่ ทำให้เสียเวลาและพลาด event สำคัญ โดยเฉพาะเมื่อทำงานหลาย project พร้อมกัน

ต้องการระบบ notification ที่:
- แจ้งเตือนอัตโนมัติเมื่อเกิด event สำคัญ (session จบ, รอ input, error, long-running)
- แจ้งแม้ user ไม่ได้อยู่หน้า Cortex (browser notification)
- มีเสียงแจ้งเตือนให้สังเกตได้ทันที
- ตั้ง rules ได้ว่าอยากรับ notification อะไร ต่อ project ไหน

## User Scenarios & Testing

### User Story 1 - Session จบแล้วแจ้งเตือน (Priority: P1)
ผู้ใช้ launch session แล้วไปทำงานอย่างอื่น เมื่อ session จบ (สำเร็จหรือ error) ระบบแจ้งเตือนทันที ไม่ต้องกลับมาเช็คเอง

**Why this priority**: เป็น use case พื้นฐานที่สุด — ทุกคนต้องการรู้ว่า session จบ
**Independent Test**: Launch session → รอจบ → เห็น browser notification + ได้ยินเสียง

**Acceptance Scenarios**:
1. **Given** session กำลัง running, **When** session จบสำเร็จ, **Then** แสดง browser notification "Session completed" + เล่นเสียง success
2. **Given** session กำลัง running, **When** session จบด้วย error, **Then** แสดง notification "Session error" + เล่นเสียง error (ต่างจาก success)
3. **Given** user อยู่ tab อื่น (ไม่ได้เปิด Cortex), **When** session จบ, **Then** ยังคงได้รับ browser notification
4. **Given** user เพิ่งเปิด Cortex ครั้งแรก, **When** ยังไม่ได้ grant notification permission, **Then** แสดง prompt ขอ permission พร้อมอธิบายว่าทำไมต้องการ

### User Story 2 - Session รอ Input (Priority: P1)
ผู้ใช้ทำงานอื่นอยู่ เมื่อ session ถามคำถามหรือรอ input ระบบแจ้งเตือนให้กลับมาตอบ

**Why this priority**: เท่ากับ US1 — session ค้างรอ input ทำให้เสียเวลามาก
**Independent Test**: Session ถาม question → เห็น notification "Session waiting for input" → กดแล้วกลับไปหน้า session

**Acceptance Scenarios**:
1. **Given** session กำลัง running, **When** session เข้า waiting/idle state (รอ input), **Then** แสดง notification "Waiting for input" + เสียง attention
2. **Given** user ได้รับ notification, **When** กดที่ notification, **Then** navigate ไปหน้า session ที่รอ input
3. **Given** session รอ input แล้ว user กลับมาพิมพ์, **When** session กลับมา running, **Then** ไม่แจ้งซ้ำ

### User Story 3 - Long-Running Session Alert (Priority: P2)
ผู้ใช้ต้องการรู้เมื่อ session ทำงานนานเกิน threshold ที่ตั้งไว้

**Why this priority**: ป้องกัน session ค้างหรือ loop — สำคัญแต่ไม่เร่งด่วนเท่า US1/US2
**Independent Test**: ตั้ง threshold 10 min → launch session → รอ 10 min → เห็น notification

**Acceptance Scenarios**:
1. **Given** session running มานาน, **When** เกิน threshold (default 10 min), **Then** แสดง notification "Session running for 10+ minutes" + เสียง reminder
2. **Given** long-running alert แสดงแล้ว, **When** session ยังทำงานต่อ, **Then** ไม่แจ้งซ้ำ (แจ้งครั้งเดียว)
3. **Given** user ตั้ง threshold เป็น 30 min, **When** session running ครบ 30 min, **Then** แจ้งตาม threshold ที่ตั้ง

### User Story 4 - Git Conflict Detected (Priority: P2)
ผู้ใช้ต้องการรู้เมื่อ session ทำให้เกิด git conflict

**Why this priority**: สำคัญสำหรับ workflow แต่เกิดไม่บ่อย
**Independent Test**: Session ทำงานจน git conflict → เห็น notification warning

**Acceptance Scenarios**:
1. **Given** session กำลัง running, **When** git status ของ project แสดง conflict markers, **Then** แสดง notification "Git conflict detected in [project]" + เสียง warning
2. **Given** conflict notification แสดงแล้ว, **When** user กดที่ notification, **Then** navigate ไปหน้า Changes tab ของ project นั้น

### User Story 5 - Customizable Rules (Priority: P2)
ผู้ใช้ตั้ง rules ได้ว่า project ไหนจะรับ notification อะไร

**Why this priority**: ทำให้ notification ไม่รบกวนเกินไป — จำเป็นเมื่อมีหลาย projects
**Independent Test**: ปิด notification สำหรับ project X → session จบใน project X → ไม่แจ้ง

**Acceptance Scenarios**:
1. **Given** user เปิด notification settings, **When** ดู settings, **Then** เห็นรายการ event types + toggle per project
2. **Given** user ปิด "session completed" สำหรับ project X, **When** session จบใน project X, **Then** ไม่แจ้งเตือน
3. **Given** user ปิด "session completed" สำหรับ project X, **When** session จบใน project Y, **Then** ยังแจ้งเตือนปกติ
4. **Given** user เปิด settings, **When** ตั้ง long-running threshold, **Then** สามารถเลือกเวลา (5/10/15/30 min)
5. **Given** user เปิด settings, **When** toggle เสียง on/off, **Then** notification มี/ไม่มีเสียงตามที่ตั้ง

### User Story 6 - Notification History (Priority: P3)
ผู้ใช้ดู notification ย้อนหลังได้

**Why this priority**: เสริม — ไม่จำเป็นสำหรับ core flow
**Independent Test**: มี notifications หลายตัว → เปิด history → เห็นรายการย้อนหลัง

**Acceptance Scenarios**:
1. **Given** มี notifications เกิดขึ้นหลายตัว, **When** เปิด notification panel, **Then** เห็นรายการย้อนหลังเรียงตามเวลา (ล่าสุดก่อน)
2. **Given** มี unread notifications, **When** ดู sidebar/header, **Then** เห็น badge แสดงจำนวน unread
3. **Given** user กดที่ notification ใน history, **When** กด, **Then** navigate ไปหน้าที่เกี่ยวข้อง

### Edge Cases
- Browser ไม่รองรับ Notification API → fallback เป็น in-app toast เท่านั้น (ไม่มี browser notification)
- User deny notification permission → แสดง in-app toast + เสียง (ถ้าเปิด)
- Session จบเร็วมาก (< 3 วินาที) → ยังคงแจ้ง (ไม่ suppress)
- หลาย sessions จบพร้อมกัน → แจ้งแต่ละ session แยกกัน (ไม่ batch)
- Tab ถูกปิด / browser ปิด → ไม่สามารถแจ้งได้ (ไม่มี service worker push ใน MVP)
- เสียงเล่นไม่ได้ (browser policy ห้าม autoplay) → แจ้ง visual อย่างเดียว
- Notification settings ยังไม่ได้ตั้ง → default ทุก event = เปิด, threshold = 10 min, เสียง = เปิด

## Functional Requirements

### Notification Events
- **FR-001**: ระบบต้องแจ้งเตือนเมื่อ session จบสำเร็จ (status → ended)
- **FR-002**: ระบบต้องแจ้งเตือนเมื่อ session จบด้วย error
- **FR-003**: ระบบต้องแจ้งเตือนเมื่อ session เข้าสถานะ waiting for input (idle/waiting)
- **FR-004**: ระบบต้องแจ้งเตือนเมื่อ session running เกิน threshold ที่ตั้งไว้
- **FR-005**: ระบบต้องแจ้งเตือนเมื่อ git conflict detected ใน project ที่มี session running

### Notification Channels
- **FR-006**: ระบบต้องแสดง browser notification (Web Notification API) เมื่อ user ไม่ได้อยู่หน้า Cortex
- **FR-007**: ระบบต้องแสดง in-app toast/banner เมื่อ user อยู่หน้า Cortex
- **FR-008**: ระบบต้องเล่นเสียงแจ้งเตือน — แต่ละ event type มีเสียงต่างกัน
- **FR-009**: กด notification (browser/in-app) ต้อง navigate ไปหน้าที่เกี่ยวข้อง

### Sound
- **FR-010**: เสียงแจ้งเตือนต้องแยกตาม event type: success, error, attention, warning, reminder
- **FR-011**: เสียงต้องสั้น (< 3 วินาที) ไม่รบกวน
- **FR-012**: user ปิด/เปิดเสียงได้ (global toggle)

### Customization
- **FR-013**: user ตั้ง rules per project ได้ — เลือก event types ที่ต้องการรับ
- **FR-014**: user ตั้ง long-running threshold ได้ (default 10 min)
- **FR-015**: user toggle เสียง on/off ได้
- **FR-016**: settings ต้อง persist ข้าม browser refresh

### History
- **FR-017**: ระบบเก็บ notification history (in-memory, ไม่ต้อง persist ข้าม restart)
- **FR-018**: แสดง unread badge count
- **FR-019**: notification history แสดงเรียงตามเวลา (ล่าสุดก่อน) สูงสุด 50 รายการ

### Permission
- **FR-020**: ระบบต้องขอ notification permission จาก browser เมื่อ user เปิด feature
- **FR-021**: ถ้า permission denied → fallback เป็น in-app toast + sound เท่านั้น

## Key Entities

- **NotificationEvent**: type (session_completed, session_error, waiting_input, long_running, git_conflict), projectId, sessionId, message, timestamp, read (boolean)
- **NotificationSettings**: global (soundEnabled, longRunningThreshold), perProject (map of projectId → enabled event types)

## Success Criteria

- **SC-001**: user ได้รับ notification ภายใน 5 วินาทีหลัง event เกิดขึ้น
- **SC-002**: 100% ของ session completed/error events ต้องมี notification (ไม่พลาด)
- **SC-003**: กด notification แล้ว navigate ไปหน้าที่ถูกต้อง 100% ของกรณี
- **SC-004**: เสียงแจ้งเตือนแยกได้ตาม event type (user บอกได้ว่าเสียงไหนหมายถึงอะไร)
- **SC-005**: ปิด notification สำหรับ project ใดก็ได้ แล้วไม่ได้รับแจ้ง 100%
- **SC-006**: notification ทำงานแม้ user อยู่ tab อื่น (browser notification)

## Out of Scope

- Push notification ผ่าน service worker เมื่อ browser ปิด (ต้องการ push server)
- Email / SMS / Slack notification
- Notification scheduling (แจ้งตามเวลาที่ตั้ง)
- Custom sound upload (ใช้ built-in sounds เท่านั้น)
- Notification grouping / batching (แจ้งแยกทุก event)
- Cross-device sync ของ notification history
- Notification สำหรับ event นอก session (เช่น project added, note created)

## Assumptions

- ใช้ Web Notification API สำหรับ browser notification (รองรับ modern browsers)
- เสียงใช้ Web Audio API หรือ `<audio>` element — ไฟล์เสียง built-in 5 ตัว (success, error, attention, warning, reminder)
- Notification settings เก็บใน localStorage (client-side)
- Notification history เก็บ in-memory (หายเมื่อ refresh)
- ตรวจจับ event ฝั่ง client จาก existing data (session status polling, session activity hooks)
- Git conflict detection ใช้ git status ที่มีอยู่แล้ว — ตรวจเมื่อ session activity เปลี่ยน
- Default settings: ทุก event เปิด, เสียง เปิด, threshold 10 min
- In-app toast แสดง 5 วินาทีแล้วหายไปเอง (หรือกดปิดได้)

## Clarifications

### Session 2026-03-25
- Q: Scope แรก — ทุก event หรือเริ่มแค่ session จบ? → A: **ทุก event** (session จบ, รอ input, long-running, git conflict)
- Q: Sound — ต้องการเสียงไหม? → A: **ต้องการ** พร้อมเสียงต่างกันตาม event type
- Q: Customizable rules — MVP หรือ full? → A: **Customizable ได้** per project + global toggle
