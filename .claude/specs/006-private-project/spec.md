# Feature: Private Project

**ID:** 006-private-project
**Created:** 2026-03-23
**Status:** Draft

## Problem Statement

เมื่อเปิดแอปบนมือถือหรือ browser ที่อาจมีคนอื่นเห็นหน้าจอ project ทั้งหมดจะแสดงใน sidebar ทันที ผู้ใช้ต้องการซ่อน project บางตัวที่เป็นความลับ ไม่ให้แสดงใน project list จนกว่าจะยืนยันตัวตนด้วยรหัสผ่าน

## User Scenarios & Testing

### User Story 1 - ตั้ง Project เป็น Private (Priority: P1)
ผู้ใช้มี project ที่อยู่ใน list แล้ว ต้องการตั้งให้เป็น private โดยกำหนดรหัสผ่าน หลังจากตั้งแล้ว project นั้นจะหายจาก list ทันที

**Why this priority**: ถ้าตั้ง private ไม่ได้ feature อื่นทั้งหมดไม่มีความหมาย
**Independent Test**: ตั้ง project เป็น private → รีเฟรชหน้า → project หายจาก list

**Acceptance Scenarios**:
1. **Given** project อยู่ใน list, **When** ผู้ใช้กด option เพื่อตั้งเป็น private และใส่รหัสผ่าน, **Then** project หายจาก list ทันที
2. **Given** project ถูกตั้งเป็น private, **When** ผู้ใช้รีเฟรชหน้า, **Then** project ยังคงไม่แสดงใน list
3. **Given** ผู้ใช้กำลังตั้งรหัสผ่าน, **When** รหัสผ่านสั้นกว่า 4 ตัว, **Then** แสดงข้อผิดพลาดว่ารหัสต้องมีอย่างน้อย 4 ตัวอักษร

### User Story 2 - ปลดล็อก Private Project (Priority: P1)
ผู้ใช้ต้องการเข้าถึง project ที่ถูกซ่อน โดยใส่รหัสผ่านเพื่อแสดง project เหล่านั้นชั่วคราว

**Why this priority**: เป็นคู่กับ US1 — ซ่อนได้ต้องเปิดได้
**Independent Test**: มี private project → ใส่รหัสถูก → เห็น project → รีเฟรช → หายอีกครั้ง

**Acceptance Scenarios**:
1. **Given** มี private project อยู่, **When** ผู้ใช้กดปุ่มปลดล็อกและใส่รหัสถูกต้อง, **Then** private project แสดงใน list
2. **Given** private project ถูกปลดล็อกแล้ว, **When** ผู้ใช้รีเฟรชหน้าหรือปิดเปิด browser, **Then** project ถูกซ่อนอีกครั้ง (session-based)
3. **Given** มี private project อยู่, **When** ผู้ใช้ใส่รหัสผิด, **Then** แสดงข้อผิดพลาด และ project ยังคงซ่อนอยู่

### User Story 3 - ยกเลิก Private (Priority: P2)
ผู้ใช้ต้องการเปลี่ยน private project กลับเป็น public โดยต้องยืนยันรหัสผ่านก่อน

**Why this priority**: ไม่ใช่ core flow แต่จำเป็นสำหรับการจัดการ
**Independent Test**: ปลดล็อก private project → กดยกเลิก private → ใส่รหัสยืนยัน → project กลายเป็น public ถาวร

**Acceptance Scenarios**:
1. **Given** private project ถูกปลดล็อกแล้ว, **When** ผู้ใช้เลือกยกเลิก private และใส่รหัสยืนยัน, **Then** project กลับเป็น public ถาวร
2. **Given** private project ถูกปลดล็อกแล้ว, **When** ผู้ใช้เลือกยกเลิก private แต่ใส่รหัสผิด, **Then** project ยังคงเป็น private

### Edge Cases
- ถ้ามี private project แต่ลืมรหัสผ่าน จะเกิดอะไรขึ้น?
- ถ้า project ทั้งหมดเป็น private จะแสดง UI อย่างไร?
- ถ้ามี private project หลายตัว → ใช้รหัสเดียว (global) ปลดล็อกทั้งหมด

## Functional Requirements
- **FR-001**: ระบบต้องสามารถตั้ง project เป็น private ด้วยรหัสผ่านได้
- **FR-002**: ระบบต้องซ่อน private project จาก list โดยสมบูรณ์ (ไม่แสดงชื่อ ไม่แสดง icon)
- **FR-003**: ระบบต้องมีกลไกปลดล็อกด้วยรหัสผ่านเพื่อแสดง private project ชั่วคราว
- **FR-004**: การปลดล็อกต้องเป็นแบบ session-based (หายเมื่อรีเฟรชหรือปิด browser)
- **FR-005**: ระบบต้องเก็บข้อมูล private project ไว้ฝั่ง server
- **FR-006**: รหัสผ่านต้องถูก hash ก่อนเก็บ (ไม่เก็บ plain text)
- **FR-007**: รหัสผ่านเป็นตัวเดียว (global) — ปลดล็อกครั้งเดียวเห็นทุก private project

## Key Entities
- **Project**: เพิ่ม attribute `isPrivate` (boolean) และ `passwordHash` (string, nullable)
- **Unlock Session**: สถานะชั่วคราวฝั่ง client ที่บอกว่า private projects ถูกปลดล็อกแล้ว

## Success Criteria
- **SC-001**: Private project ต้องไม่แสดงใน list เมื่อยังไม่ปลดล็อก ภายใน 100% ของกรณี
- **SC-002**: ผู้ใช้สามารถปลดล็อกและเห็น private project ได้ภายใน 3 ขั้นตอน (กดปุ่ม → ใส่รหัส → ยืนยัน)
- **SC-003**: หลังรีเฟรชหน้า private project ต้องกลับไปซ่อนภายใน 100% ของกรณี
- **SC-004**: รหัสผ่านต้องไม่ถูกเก็บหรือส่งในรูปแบบ plain text

## Out of Scope
- การเข้ารหัสข้อมูล project (encrypt project data)
- Biometric authentication (Face ID, fingerprint)
- Multi-user access control / role-based permissions
- Auto-lock หลังผ่านไประยะเวลาหนึ่ง
- Recovery mechanism สำหรับลืมรหัสผ่าน (v1)

## Assumptions
- ระดับความปลอดภัยเป็น casual privacy (ซ่อนจากคนผ่านมาเห็น) ไม่ใช่ cryptographic security
- รหัสผ่านขั้นต่ำ 4 ตัวอักษร
- ใช้ hashing มาตรฐาน (bcrypt/argon2) ฝั่ง server
- UI ปลดล็อกเป็นปุ่มเล็กๆ ใน sidebar ไม่เด่นมาก
