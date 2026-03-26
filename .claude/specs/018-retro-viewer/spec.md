# Feature: Cross-Project Retrospective Viewer

**ID:** 018-retro-viewer
**Created:** 2026-03-27
**Status:** Draft

## Problem Statement

ผู้ใช้มี retrospectives + lessons กระจายอยู่ทุก project (48 retros, 22 lessons ใน 6 projects) แต่ไม่มีที่ดูรวมกัน — ต้องเปิด project ทีละตัวแล้วไปดูใน file browser ซึ่ง:
- ไม่เห็น big picture ข้าม projects
- ไม่เห็น patterns ที่เกิดซ้ำ
- ไม่เห็น AI diary themes
- action items จาก retro เก่าไม่ได้ติดตาม

ต้องการ viewer ใน Cortex ที่:
- ดู retrospectives + lessons ข้ามทุก project ในที่เดียว
- filter ตาม project, date range
- เห็น timeline ของ retros
- ดู lessons รวมเป็น knowledge base
- แสดง markdown rendered

## User Scenarios & Testing

### User Story 1 - Retrospective Timeline (Priority: P1)
ผู้ใช้เปิด Retro Viewer แล้วเห็น retrospectives ทุก project เรียงตามวันที่ — กดอ่าน retro แต่ละตัวได้

**Why this priority**: เป็น core — ไม่เห็น timeline ก็ review ไม่ได้
**Independent Test**: เปิด Retro Viewer → เห็น list retros ทุก project เรียงตามวัน → กดอ่าน

**Acceptance Scenarios**:
1. **Given** มี retros หลาย projects, **When** เปิด Retro Viewer, **Then** เห็น timeline list: date, project name, retro title
2. **Given** timeline แสดงอยู่, **When** กดเลือก retro, **Then** เห็น rendered markdown ของ retro นั้น
3. **Given** timeline แสดงอยู่, **When** filter by project, **Then** เห็นเฉพาะ retros ของ project ที่เลือก
4. **Given** timeline แสดงอยู่, **When** filter by date range, **Then** เห็นเฉพาะ retros ในช่วงวันที่

### User Story 2 - Lessons Knowledge Base (Priority: P1)
ผู้ใช้ดู lessons จากทุก project รวมกัน — เป็น knowledge base ที่สะสมมา

**Why this priority**: เท่ากับ US1 — lessons คือ output ที่มีค่าที่สุดจาก retros
**Independent Test**: เปิด Lessons tab → เห็น lessons ทุก project → กดอ่าน

**Acceptance Scenarios**:
1. **Given** มี lessons หลาย projects, **When** เปิด Lessons tab, **Then** เห็น list: date, project name, lesson content preview
2. **Given** lessons list แสดงอยู่, **When** กดเลือก lesson, **Then** เห็น full rendered markdown
3. **Given** lessons list, **When** filter by project, **Then** เห็นเฉพาะ lessons ของ project ที่เลือก

### User Story 3 - Access from Global View (Priority: P2)
ผู้ใช้เข้าถึง Retro Viewer จาก sidebar หรือ main navigation — ไม่ต้องเลือก project ก่อน

**Why this priority**: ต้องมีทางเข้า — แต่ไม่ใช่ core logic
**Independent Test**: กดปุ่ม "Retros" ใน sidebar → เปิด Retro Viewer ทันที

**Acceptance Scenarios**:
1. **Given** อยู่หน้าใดก็ได้, **When** กด "Retros" ใน sidebar view toggle, **Then** แสดง Retro Viewer (เหมือน Sessions view)
2. **Given** Retro Viewer เปิดอยู่, **When** กดกลับไป Projects/Sessions, **Then** กลับ view เดิม

### Edge Cases
- Project ไม่มี retros เลย → ไม่แสดงใน filter, ไม่มี error
- Retro file format ผิด → skip, ไม่ crash
- Private project retros → แสดงเมื่อ unlocked เท่านั้น
- ไฟล์ retro ใหญ่มาก → render ได้ปกติ (markdown renderer handle ได้)
- Date parse fail → fallback เป็น file modified date

## Functional Requirements

### Data Collection
- **FR-001**: ระบบต้อง scan `.claude/memory/retrospective/` ของทุก project ที่ register ใน Cortex
- **FR-002**: ระบบต้อง scan `.claude/memory/lesson/` ของทุก project
- **FR-003**: Parse retro filename เป็น date + description (format: `N-HHMM-description.md` ใน folder `YYYY-MM-DD/`)
- **FR-004**: Parse lesson filename เป็น date (format: `YYYY-MM-DD.md`)

### Display
- **FR-005**: แสดง retro list เรียงตามวัน (ล่าสุดก่อน) พร้อม project name badge
- **FR-006**: แสดง lesson list เรียงตามวัน พร้อม project name badge
- **FR-007**: กดเลือก item → render markdown content
- **FR-008**: Toggle ระหว่าง "Retrospectives" กับ "Lessons" tab

### Filter
- **FR-009**: Filter by project (dropdown/checkboxes)
- **FR-010**: Filter by date range (optional — start/end date)

### Navigation
- **FR-011**: เข้าถึงจาก sidebar view toggle (เพิ่ม "Retros" ข้าง Projects/Sessions)

### API
- **FR-012**: Server endpoint ดึง retros ทุก project: `GET /api/retros?project=<id>`
- **FR-013**: Server endpoint ดึง lessons ทุก project: `GET /api/lessons?project=<id>`
- **FR-014**: Response include: projectId, projectName, date, title, content (markdown)

## Key Entities

- **RetroEntry**: projectId, projectName, date, title, filename, content (markdown)
- **LessonEntry**: projectId, projectName, date, filename, content (markdown)

## Success Criteria

- **SC-001**: ผู้ใช้ดู retros ข้ามทุก project ได้ใน 1 click
- **SC-002**: Retro list load ภายใน 3 วินาที (ทุก projects)
- **SC-003**: Filter by project ทำงานทันที (< 100ms)
- **SC-004**: Markdown render ถูกต้อง 100%
- **SC-005**: ข้อมูลจาก 48 retros + 22 lessons แสดงครบไม่ตกหล่น

## Out of Scope

- Create/edit retros จาก UI (read-only)
- Cross-project insights/analytics (AI-generated summaries)
- Search ใน retro content
- Action item tracking จาก retros
- Export retros เป็น PDF
- Retro templates

## Assumptions

- Retro files เก็บใน `.claude/memory/retrospective/YYYY-MM-DD/N-HHMM-description.md`
- Lesson files เก็บใน `.claude/memory/lesson/YYYY-MM-DD.md`
- ทุก file เป็น markdown
- Private project retros ต้องผ่าน unlock token เหมือน API อื่น
- Retro Viewer เป็น global view (ไม่ผูกกับ project เดียว)
- Markdown render ใช้ existing renderer ที่มีใน Cortex
