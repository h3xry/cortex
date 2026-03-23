# Feature: Session Manager

**ID:** 007-session-manager
**Created:** 2026-03-23
**Status:** Draft

## Problem Statement

ปัจจุบัน session tabs แสดงเป็นแถบเล็กๆ ที่แสดงแค่ session ID ทำให้ผู้ใช้:
- ไม่รู้ว่ามี session อะไรบ้างทั้งระบบ (ข้าม project)
- ไม่เห็น status, เวลาสร้าง, หรือ folder ของแต่ละ session
- ไม่สามารถ kill session ที่ค้างอยู่ได้จาก UI
- ไม่สามารถ monitor หลาย session พร้อมกัน (ต้อง switch ไปมา)

ต้องการ Session Manager ที่จัดการ session ได้ครบถ้วน

## User Scenarios & Testing

### User Story 1 - ดู Session ทั้งหมด (Priority: P1)
ผู้ใช้เปิด Session Manager แล้วเห็น session ทั้งหมดของทุก project พร้อมรายละเอียด (status, project, เวลาสร้าง, ระยะเวลาที่ทำงาน)

**Why this priority**: ต้องเห็นก่อนถึงจะจัดการได้
**Independent Test**: เปิด Session Manager → เห็น list ของทุก session พร้อม status/project/เวลา

**Acceptance Scenarios**:
1. **Given** มี session 3 ตัวจาก 2 project, **When** เปิด Session Manager, **Then** เห็นทั้ง 3 session พร้อม status (running/ended), ชื่อ project, และเวลาสร้าง
2. **Given** มี session ที่ running อยู่, **When** เปิด Session Manager, **Then** เห็นระยะเวลาที่ running อยู่แบบ live update (เช่น "5m 32s")
3. **Given** ไม่มี session เลย, **When** เปิด Session Manager, **Then** แสดงข้อความ "No active sessions"

### User Story 2 - Kill Session (Priority: P1)
ผู้ใช้สามารถสั่งปิด session ที่ running อยู่ได้จาก Session Manager หรือจาก session tab

**Why this priority**: จำเป็นสำหรับจัดการ session ที่ค้างหรือไม่ต้องการแล้ว
**Independent Test**: มี running session → กดปุ่ม kill → session เปลี่ยนเป็น ended

**Acceptance Scenarios**:
1. **Given** session กำลัง running, **When** ผู้ใช้กดปุ่ม kill, **Then** ระบบแสดง confirmation → ยืนยัน → session เปลี่ยนเป็น ended
2. **Given** session ที่เป็น ended แล้ว, **When** ดู Session Manager, **Then** ไม่แสดงปุ่ม kill (แสดงปุ่ม remove แทน)
3. **Given** session ถูก kill แล้ว, **When** terminal ของ session นั้นเปิดอยู่, **Then** terminal แสดง "Session ended" และ disable input

### User Story 3 - Monitor หลาย Session (Priority: P1)
ผู้ใช้สามารถเปิดดู terminal ของหลาย session พร้อมกันโดยสลับไปมาได้เร็ว และเห็น preview ว่าแต่ละ session กำลังทำอะไรอยู่

**Why this priority**: ช่วยให้ monitor งานหลายตัวพร้อมกันได้
**Independent Test**: มี 2 running sessions → เห็น last output preview ของทั้ง 2 ใน Session Manager → กดเพื่อ switch ดู terminal

**Acceptance Scenarios**:
1. **Given** มี running session 2 ตัว, **When** เปิด Session Manager, **Then** เห็น last line ของ output แต่ละ session เป็น preview
2. **Given** เปิด Session Manager อยู่, **When** กดที่ session ใดๆ, **Then** switch ไปที่ terminal ของ session นั้นทันที
3. **Given** session กำลัง output ข้อมูล, **When** ดู Session Manager, **Then** preview ของ session นั้น update แบบ live

### User Story 4 - ลบ Ended Session (Priority: P2)
ผู้ใช้สามารถลบ session ที่จบแล้วออกจาก list เพื่อความเรียบร้อย

**Why this priority**: ไม่ใช่ core flow แต่ช่วยจัดการ
**Independent Test**: มี ended session → กด remove → หายจาก list

**Acceptance Scenarios**:
1. **Given** session ที่ ended แล้ว, **When** กดปุ่ม remove, **Then** session หายจาก list ทันที
2. **Given** session ที่ running อยู่, **When** ดู Session Manager, **Then** ไม่แสดงปุ่ม remove (ต้อง kill ก่อน)

### Edge Cases
- ถ้า session ถูก kill จากภายนอก (เช่น `tmux kill-session` ใน terminal จริง) จะ update status ใน UI ได้ไหม?
- ถ้ามี session เต็ม 10 ตัว จะแสดงอะไร?
- ถ้า preview มี ANSI escape codes จะแสดงยังไง?

## Functional Requirements
- **FR-001**: ระบบต้องแสดง list ของ session ทั้งหมด (ข้าม project) พร้อม status, project name, เวลาสร้าง
- **FR-002**: ระบบต้องแสดงระยะเวลาที่ session running อยู่แบบ live
- **FR-003**: ระบบต้องมีปุ่ม kill สำหรับ running session พร้อม confirmation
- **FR-004**: ระบบต้องมีปุ่ม remove สำหรับ ended session
- **FR-005**: ระบบต้องแสดง preview ของ output ล่าสุดของแต่ละ session
- **FR-006**: ระบบต้องให้กดที่ session แล้ว switch ไปดู terminal ของ session นั้นได้
- **FR-007**: Session Manager แสดงเป็นปุ่มแยกที่ sidebar (เหนือ project list) เข้าถึงได้ทุกเมื่อโดยไม่ต้องเลือก project ก่อน

## Key Entities
- **Session**: id, status (running/ended), project name, folder path, เวลาสร้าง, เวลาจบ, last output preview
- **Session Manager View**: list ของ sessions ทั้งหมด, sorted by status (running first) แล้ว created time

## Success Criteria
- **SC-001**: ผู้ใช้สามารถเห็นทุก session พร้อม status ได้ภายใน 1 กด
- **SC-002**: ผู้ใช้สามารถ kill session ได้ภายใน 2 ขั้นตอน (กด kill → confirm)
- **SC-003**: Preview ของ session update ภายใน 3 วินาทีหลังมี output ใหม่
- **SC-004**: Switch จาก Session Manager ไป terminal ของ session ใดๆ ได้ภายใน 1 กด

## Out of Scope
- Split view / picture-in-picture (เห็น 2 terminal พร้อมกัน)
- Session grouping / tagging
- Session search / filter
- Session log export
- Persistent session storage (session หายเมื่อ restart server)

## Assumptions
- Session Manager แสดง session ของทุก project ไม่ใช่แค่ project ที่เลือก
- Preview แสดง last line ของ output โดย strip ANSI codes
- Running sessions แสดงก่อน ended sessions
- Session Manager เข้าถึงได้จากทุก project (ไม่ต้องเลือก project ก่อน)
- Live duration update ทุก 1 วินาที
