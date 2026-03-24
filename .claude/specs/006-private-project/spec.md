# Feature: Private Project

**ID:** 006-private-project
**Created:** 2026-03-23
**Status:** Draft (v2 — API-level enforcement)

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
1. **Given** มี private project อยู่, **When** ผู้ใช้กดปุ่มปลดล็อกและใส่รหัสถูกต้อง, **Then** server เก็บ unlock state + private project แสดงใน list
2. **Given** private project ถูกปลดล็อกแล้ว, **When** server restart, **Then** project ถูกซ่อนอีกครั้ง (server memory-based)
3. **Given** private project ถูกปลดล็อกแล้ว, **When** ผู้ใช้รีเฟรชหน้า, **Then** client ต้อง re-unlock (เพราะ client state หาย แต่ server state ยังอยู่จนกว่า restart)
4. **Given** มี private project อยู่, **When** ผู้ใช้ใส่รหัสผิด, **Then** แสดงข้อผิดพลาด และ project ยังคงซ่อนอยู่

### User Story 3 - ยกเลิก Private (Priority: P2)
ผู้ใช้ต้องการเปลี่ยน private project กลับเป็น public โดยต้องยืนยันรหัสผ่านก่อน

**Why this priority**: ไม่ใช่ core flow แต่จำเป็นสำหรับการจัดการ
**Independent Test**: ปลดล็อก private project → กดยกเลิก private → ใส่รหัสยืนยัน → project กลายเป็น public ถาวร

**Acceptance Scenarios**:
1. **Given** private project ถูกปลดล็อกแล้ว, **When** ผู้ใช้เลือกยกเลิก private และใส่รหัสยืนยัน, **Then** project กลับเป็น public ถาวร
2. **Given** private project ถูกปลดล็อกแล้ว, **When** ผู้ใช้เลือกยกเลิก private แต่ใส่รหัสผิด, **Then** project ยังคงเป็น private

### User Story 4 - API ต้องไม่ส่งข้อมูล Private Project เมื่อยังไม่ Unlock (Priority: P1)
เมื่อยังไม่ได้ unlock, API ทุกตัวต้อง filter/reject private project data ออกตั้งแต่ฝั่ง server — ไม่พึ่ง client filtering

**Why this priority**: เป็น security enforcement ที่ต้องอยู่ฝั่ง server ไม่ใช่ client
**Independent Test**: ไม่ unlock → GET /api/projects ไม่มี private project → GET /api/sessions ไม่มี session ของ private project → POST /api/sessions ด้วย private projectId ถูก reject

**Acceptance Scenarios**:
1. **Given** ยังไม่ได้ unlock, **When** `GET /api/projects`, **Then** response ไม่มี project ที่ isPrivate=true
2. **Given** ยังไม่ได้ unlock + มี session ที่ belong กับ private project, **When** `GET /api/sessions`, **Then** session ของ private project ไม่แสดงใน response (session ยังทำงานอยู่ แค่ซ่อน)
3. **Given** ยังไม่ได้ unlock, **When** `POST /api/sessions` ด้วย projectId ของ private project, **Then** ถูก reject (403)
4. **Given** unlock แล้ว, **When** เรียก API เดียวกัน, **Then** เห็นข้อมูลทั้งหมดตามปกติ

### Edge Cases
- ถ้ามี private project แต่ลืมรหัสผ่าน จะเกิดอะไรขึ้น?
- ถ้า project ทั้งหมดเป็น private จะแสดง UI อย่างไร?
- ถ้ามี private project หลายตัว → ใช้รหัสเดียว (global) ปลดล็อกทั้งหมด
- Session ของ private project ยังคง run อยู่ใน tmux แม้ถูกซ่อนจาก API — ไม่ kill

## Functional Requirements
- **FR-001**: ระบบต้องสามารถตั้ง project เป็น private ด้วยรหัสผ่านได้
- **FR-002**: ระบบต้องซ่อน private project จาก list โดยสมบูรณ์ (ไม่แสดงชื่อ ไม่แสดง icon)
- **FR-003**: ระบบต้องมีกลไกปลดล็อกด้วยรหัสผ่านเพื่อแสดง private project ชั่วคราว
- **FR-004**: การปลดล็อกต้องเป็นแบบ server memory-based (หายเมื่อ server restart)
- **FR-005**: ระบบต้องเก็บข้อมูล private project ไว้ฝั่ง server
- **FR-006**: รหัสผ่านต้องถูก hash ก่อนเก็บ (ไม่เก็บ plain text)
- **FR-007**: รหัสผ่านเป็นตัวเดียว (global) — ปลดล็อกครั้งเดียวเห็นทุก private project
- **FR-008**: `GET /api/projects` ต้อง filter private project ออกเมื่อยังไม่ unlock (server-side)
- **FR-009**: `GET /api/sessions` ต้อง filter session ของ private project ออกเมื่อยังไม่ unlock (ไม่ kill session แค่ซ่อน)
- **FR-010**: `POST /api/sessions` ต้อง reject (403) ถ้า projectId หรือ folderPath ตรงกับ private project ที่ยังไม่ unlock (cross-check ทั้ง 2 path)
- **FR-011**: `POST /api/private/unlock` ต้อง return random token (UUID), server เก็บ token ใน in-memory Set. Client ส่ง token ใน `X-Unlock-Token` header ทุก request. Refresh = token หาย = ต้องใส่รหัสใหม่
- **FR-012**: API ทุกตัวที่เกี่ยวกับ project data ต้อง enforce unlock state ฝั่ง server — ห้ามพึ่ง client filtering อย่างเดียว
- **FR-013**: WebSocket upgrade สำหรับ session ของ private project ต้องตรวจ unlock token (ส่งผ่าน query param `token`). ไม่มี valid token → reject connection

## Key Entities
- **Project**: เพิ่ม attribute `isPrivate` (boolean) และ `passwordHash` (string, nullable)
- **Unlock Token**: Random UUID เก็บใน server memory Set — หายเมื่อ server restart. Client เก็บใน JS variable (ไม่ใช่ localStorage), ส่งกลับใน `X-Unlock-Token` header ทุก request. Page refresh = token หาย = ต้อง re-unlock

## Success Criteria
- **SC-001**: Private project ต้องไม่แสดงใน API response เมื่อยังไม่ปลดล็อก ภายใน 100% ของกรณี (server-enforced)
- **SC-002**: ผู้ใช้สามารถปลดล็อกและเห็น private project ได้ภายใน 3 ขั้นตอน (กดปุ่ม → ใส่รหัส → ยืนยัน)
- **SC-003**: หลัง server restart, unlock state ต้องหายไป 100%
- **SC-004**: รหัสผ่านต้องไม่ถูกเก็บหรือส่งในรูปแบบ plain text
- **SC-005**: Session ของ private project ต้องไม่ปรากฏใน `GET /api/sessions` เมื่อยังไม่ unlock
- **SC-006**: `POST /api/sessions` ด้วย private projectId ต้อง reject 100% เมื่อยังไม่ unlock

## Out of Scope
- การเข้ารหัสข้อมูล project (encrypt project data)
- Biometric authentication (Face ID, fingerprint)
- Multi-user access control / role-based permissions
- Auto-lock หลังผ่านไประยะเวลาหนึ่ง
- Recovery mechanism สำหรับลืมรหัสผ่าน (v1)

## Clarifications

### Session 2026-03-24
- Q: Unlock mechanism — Token-based หรือ Boolean flag? → A: **Token-based** — server generate random token เก็บใน Set, client เก็บใน JS memory + ส่งใน header ทุก request. Refresh = token หาย = ต้องใส่รหัสใหม่
- Q: folderPath bypass — block เฉพาะ projectId หรือทั้ง folderPath ด้วย? → A: **Block ทั้งคู่** — server cross-check folderPath กับ path ของ private projects, reject 403 ถ้าตรงกัน
- Q: WebSocket connection ของ private session — block หรือไม่? → A: **Block** — WS upgrade ตรวจ unlock token (ส่งผ่าน query param), ถ้า session belong กับ private project + ไม่มี valid token → reject

## Assumptions
- ระดับความปลอดภัยเป็น casual privacy (ซ่อนจากคนผ่านมาเห็น) ไม่ใช่ cryptographic security
- รหัสผ่านขั้นต่ำ 4 ตัวอักษร
- ใช้ hashing มาตรฐาน (bcrypt/argon2) ฝั่ง server
- UI ปลดล็อกเป็นปุ่มเล็กๆ ใน sidebar ไม่เด่นมาก
- Unlock state เก็บใน server memory (Option B) — ไม่ persist ลง disk
- Session ของ private project ยังทำงานอยู่ใน tmux แม้ถูกซ่อนจาก API (ไม่ kill)
