# Feature: Multi-Session Split View

**ID:** 017-split-view
**Created:** 2026-03-26
**Status:** Draft

## Problem Statement

ผู้ใช้ทำงานหลาย sessions พร้อมกัน (เช่น frontend + backend, หรือ 2 projects) แต่ตอนนี้ดูได้ทีละ 1 session — ต้อง switch ไปมาระหว่าง project/session ทำให้:
- เสียเวลา switch context
- เปรียบเทียบ output ระหว่าง sessions ไม่ได้
- ดู terminal พร้อม notes ไม่ได้ — ต้องสลับ tab
- ทำงาน multi-project workflow ลำบาก

ต้องการ split screen ที่:
- แสดง 2 panels พร้อมกัน
- เลือก content ของแต่ละ panel อิสระ (terminal, notes, หรือ tab อื่น)
- ดู session ข้าม project ได้
- ปรับขนาด panel ได้ด้วย drag
- สลับ horizontal/vertical split ได้

## User Scenarios & Testing

### User Story 1 - Split Terminal + Notes (Priority: P1)
ผู้ใช้เปิด terminal ของ session ที่กำลัง running พร้อมกับ notes ของ project เดียวกัน เพื่อดู context ขณะ session ทำงาน

**Why this priority**: Use case ที่พบบ่อยที่สุด — ดู terminal + จด notes พร้อมกัน
**Independent Test**: กด split → panel ซ้ายเห็น terminal → panel ขวาเห็น notes

**Acceptance Scenarios**:
1. **Given** ผู้ใช้อยู่หน้า project, **When** กดปุ่ม "Split", **Then** หน้าจอแบ่งเป็น 2 panels เท่ากัน
2. **Given** split view เปิดอยู่, **When** ดู panel ซ้าย, **Then** เห็น content เดิมที่ดูอยู่ (เช่น terminal)
3. **Given** split view เปิดอยู่, **When** เลือก content สำหรับ panel ขวา, **Then** สามารถเลือกได้: Terminal, Files, Changes, Specs, Notes ของ project เดียวกัน
4. **Given** split view เปิดอยู่, **When** กดปุ่ม "Close Split", **Then** กลับเป็น single panel (panel ซ้ายคงอยู่)

### User Story 2 - Cross-Project Sessions (Priority: P1)
ผู้ใช้ดู session ของ project A ใน panel ซ้าย และ session ของ project B ใน panel ขวา พร้อมกัน

**Why this priority**: เท่ากับ US1 — multi-project workflow เป็น core use case
**Independent Test**: split → panel ซ้าย = project A terminal → panel ขวา = project B terminal

**Acceptance Scenarios**:
1. **Given** split view เปิดอยู่, **When** เลือก content สำหรับ panel ขวา, **Then** สามารถเลือก project อื่นได้ (ไม่จำกัดแค่ project เดียวกัน)
2. **Given** panel ซ้าย = project A, panel ขวา = project B, **When** ทั้งสอง sessions running, **Then** เห็น output ทั้งสอง stream พร้อมกัน real-time
3. **Given** ดู 2 projects พร้อมกัน, **When** พิมพ์ input, **Then** input ส่งไปที่ panel ที่ focus อยู่เท่านั้น (ไม่ส่งทั้งสอง)

### User Story 3 - Drag to Resize (Priority: P1)
ผู้ใช้ปรับขนาดของแต่ละ panel ด้วยการ drag divider

**Why this priority**: จำเป็นสำหรับ UX — panel ขนาดเท่ากันไม่เหมาะกับทุกกรณี
**Independent Test**: drag divider ไปซ้าย → panel ซ้ายเล็กลง panel ขวาใหญ่ขึ้น

**Acceptance Scenarios**:
1. **Given** split view เปิดอยู่, **When** drag divider bar, **Then** panel ปรับขนาดตาม drag position
2. **Given** กำลัง drag, **When** ปล่อย mouse, **Then** ขนาดคงที่จนกว่าจะ drag ใหม่
3. **Given** drag panel ให้เล็กมาก, **When** ขนาด < 20%, **Then** snap เป็น minimum 20% (ไม่ให้หายไป)
4. **Given** terminal อยู่ใน panel ที่ resize, **When** resize เสร็จ, **Then** terminal ปรับ columns/rows ตามขนาดใหม่

### User Story 4 - Toggle Split Direction (Priority: P2)
ผู้ใช้สลับระหว่าง horizontal split (ซ้าย-ขวา) กับ vertical split (บน-ล่าง)

**Why this priority**: เสริม UX — horizontal เป็น default, vertical เหมาะกับบาง use case
**Independent Test**: กด toggle direction → เปลี่ยนจาก side-by-side เป็น top-bottom

**Acceptance Scenarios**:
1. **Given** split view เปิดอยู่แบบ horizontal, **When** กดปุ่ม toggle direction, **Then** เปลี่ยนเป็น vertical (บน-ล่าง)
2. **Given** vertical split, **When** กดปุ่ม toggle, **Then** กลับเป็น horizontal
3. **Given** เปลี่ยน direction, **When** ดู content ใน panels, **Then** content ยังคงเดิม (ไม่ reset)
4. **Given** vertical split บน mobile, **When** ดูบนหน้าจอแคบ, **Then** แต่ละ panel ยัง usable (minimum height)

### User Story 5 - Panel Content Selector (Priority: P2)
ผู้ใช้เลือก content ของแต่ละ panel ได้อิสระผ่าน dropdown/selector

**Why this priority**: ทำให้ split view ยืดหยุ่น — ไม่จำกัดแค่ terminal
**Independent Test**: กด selector บน panel ขวา → เลือก "Changes" → เห็น Changes tab ใน panel นั้น

**Acceptance Scenarios**:
1. **Given** split view เปิดอยู่, **When** กด content selector บน panel, **Then** เห็น dropdown: project selector + tab selector (Terminal/Files/Changes/Specs/Notes)
2. **Given** เลือก project + tab, **When** confirm, **Then** panel แสดง content ที่เลือก
3. **Given** panel ขวาแสดง Notes, **When** สร้าง/แก้ note, **Then** ทำงานได้ปกติเหมือน full view
4. **Given** เปลี่ยน content ของ panel, **When** content เปลี่ยน, **Then** panel อื่นไม่ได้รับผลกระทบ

### Edge Cases
- Session จบใน panel → แสดง "Session ended" ไม่ crash, panel ยังใช้ได้
- Project ถูกลบขณะแสดงใน panel → แสดง "Project not found", กลับเป็น empty panel
- หน้าจอแคบเกินไปสำหรับ split (< 768px) → ไม่แสดงปุ่ม split หรือ auto-close split
- ทั้งสอง panels เปิด terminal ของ session เดียวกัน → อนุญาตได้ แต่ input ส่งจาก panel ที่ focus
- Resize window ขณะ split → panels ปรับขนาดตาม ratio เดิม
- Split แล้ว refresh page → split state หาย กลับเป็น single panel (ไม่ persist)
- Private project ใน panel → ต้อง unlock ก่อนถึงจะเห็น content

## Functional Requirements

### Split Layout
- **FR-001**: ระบบต้องแบ่งหน้าจอเป็น 2 panels เมื่อกดปุ่ม Split
- **FR-002**: Default split เป็น horizontal (ซ้าย-ขวา) อัตราส่วน 50/50
- **FR-003**: ปุ่ม Close Split กลับเป็น single panel (เก็บ content ของ panel ซ้าย)
- **FR-004**: Split button อยู่ใน project panel header

### Panel Content
- **FR-005**: แต่ละ panel เลือก content ได้อิสระ: project + tab (Terminal/Files/Changes/Specs/Notes)
- **FR-006**: Panel ซ้ายแสดง content ปัจจุบันเมื่อเปิด split
- **FR-007**: Panel ขวาเริ่มด้วย content selector ให้เลือก
- **FR-008**: Content ของแต่ละ panel ทำงานอิสระ (interact, scroll, input แยกกัน)

### Cross-Project
- **FR-009**: Panel ขวาสามารถเลือก project อื่นได้ (ไม่จำกัดแค่ project เดียวกัน)
- **FR-010**: Terminal input ส่งไปที่ panel ที่มี focus เท่านั้น

### Resize
- **FR-011**: Drag divider bar เพื่อปรับขนาด panels
- **FR-012**: Minimum panel size = 20% ของ container
- **FR-013**: Terminal ใน panel ที่ resize ต้อง re-fit columns/rows
- **FR-014**: Window resize → panels ปรับตาม ratio เดิม

### Direction
- **FR-015**: Toggle ระหว่าง horizontal (ซ้าย-ขวา) กับ vertical (บน-ล่าง)
- **FR-016**: เปลี่ยน direction ไม่ reset content ของ panels
- **FR-017**: Mobile (< 768px) → ซ่อนปุ่ม split หรือ auto-close

## Key Entities

- **SplitState**: active (boolean), direction (horizontal/vertical), ratio (number 0.2-0.8)
- **PanelConfig**: projectId, tab (terminal/files/changes/specs/notes), sessionId (for terminal)

## Success Criteria

- **SC-001**: ผู้ใช้เปิด split view ได้ภายใน 1 click
- **SC-002**: ทั้งสอง panels แสดง content พร้อมกัน real-time ไม่กระตุก
- **SC-003**: Terminal ใน panel ที่ resize ปรับ size ถูกต้อง 100%
- **SC-004**: Drag divider ลื่นไหล ไม่ lag (< 16ms per frame)
- **SC-005**: Input ส่งไปที่ panel ที่ focus เท่านั้น 100% (ไม่ leak ไป panel อื่น)
- **SC-006**: ดู 2 projects พร้อมกันได้โดยไม่ต้อง switch

## Out of Scope

- 3+ panels (แค่ 2 panels เท่านั้น)
- Tab grouping / workspace management
- Persist split state ข้าม refresh
- Drag-and-drop panel reorder (สลับ panel ซ้าย-ขวา)
- Floating/detached panels
- Picture-in-picture mode
- Split ใน mobile view (< 768px)
- Sync scroll ระหว่าง panels

## Assumptions

- Split เป็น feature ของ main content area — sidebar ไม่เปลี่ยน
- Panel ซ้ายเป็น "primary" (เก็บไว้เมื่อปิด split)
- Default direction: horizontal (ซ้าย-ขวา) — เหมาะกับ wide screen
- Divider bar กว้าง 4-6px, cursor เปลี่ยนเป็น resize เมื่อ hover
- Terminal ใน split panel ใช้ WebSocket connection เดียวกับ full view
- Split state เก็บ in-memory (หายเมื่อ refresh)
- Focus panel มี visual indicator (border highlight หรือ shadow)

## Clarifications

### Session 2026-03-26
- Q: Scope แรก — แค่ terminal split หรือ ข้าม tab ด้วย? → A: **Terminal + Notes** และ tab อื่นด้วย
- Q: Split direction — horizontal, vertical, หรือทั้งสอง? → A: **Toggle ได้ทั้งสอง**
- Q: ดู session project เดียวกันหรือข้าม project? → A: **ข้าม project ได้**
