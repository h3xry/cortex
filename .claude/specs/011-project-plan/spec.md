# Feature: Project Plan

**ID:** 011-project-plan
**Created:** 2026-03-24
**Status:** Draft

## Problem Statement

ปัจจุบันแอปแสดงเฉพาะ project list กับ terminal sessions — ไม่มีที่บันทึกว่าแต่ละ project ต้องทำอะไร เมื่อไร และคืบหน้าแค่ไหน ผู้ใช้ต้องพึ่ง tool ภายนอก (Notion, Linear, sticky notes) เพื่อ track tasks และ timeline

ต้องการระบบวางแผน project ที่:
- เก็บ tasks ต่อ project
- กำหนด timeline/milestone ได้
- แบ่ง phase/sprint ได้
- แสดง dashboard สรุปภาพรวม
- เก็บเป็น `.md` file เพื่อให้ AI อ่านและวิเคราะห์ได้

## User Scenarios & Testing

### User Story 1 - Task Board (Priority: P1)
ผู้ใช้ต้องการสร้างและจัดการ tasks ของแต่ละ project เพื่อ track ว่าต้องทำอะไรบ้าง

**Why this priority**: เป็นฐานของทุก module อื่น — ไม่มี tasks ก็ไม่มี timeline/sprint/dashboard
**Independent Test**: สร้าง task → เห็นใน list → เปลี่ยน status → เห็น status อัปเดต

**Acceptance Scenarios**:
1. **Given** ผู้ใช้อยู่ที่ sidebar, **When** กดเปิด Plan menu item, **Then** เห็น plan board ของ project ที่เลือกอยู่ (หรือ empty state ถ้ายังไม่มี)
2. **Given** ผู้ใช้อยู่ที่ Plan tab, **When** กด Add Task, **Then** สามารถกรอก title, description, priority (P1/P2/P3), tags ได้
3. **Given** มี task อยู่, **When** ย้าย task ไป section อื่น, **Then** task ย้ายตาม Kanban flow (Backlog/Sprint/In Progress/Review/Done)
4. **Given** มี tasks หลายตัว, **When** ดู list, **Then** สามารถ filter ตาม status และ priority ได้
5. **Given** มี task อยู่, **When** กด edit, **Then** แก้ไข title, description, priority, tags ได้
6. **Given** มี task อยู่, **When** กด delete, **Then** task ถูกลบ (confirm ก่อน)

### User Story 2 - Milestones & Timeline (Priority: P1)
ผู้ใช้ต้องการกำหนด milestone พร้อม deadline และผูก tasks เข้า milestone เพื่อ track progress ตาม timeline

**Why this priority**: เป็นคู่กับ US1 — tasks ต้องมี deadline ถึงจะมีความหมาย
**Independent Test**: สร้าง milestone → ผูก tasks → เห็น progress bar → deadline warning

**Acceptance Scenarios**:
1. **Given** ผู้ใช้อยู่ที่ Plan tab, **When** กด Add Milestone, **Then** สามารถกรอก title, description, deadline (date) ได้
2. **Given** มี milestone และ tasks อยู่, **When** ผูก task เข้า milestone, **Then** task แสดงภายใต้ milestone นั้น
3. **Given** milestone มี tasks 5 ตัว, done 3 ตัว, **When** ดู milestone, **Then** เห็น progress bar (3/5 = 60%)
4. **Given** milestone มี deadline ภายใน 3 วัน, **When** ดู milestone list, **Then** แสดง warning (urgent badge)
5. **Given** milestone หมดเวลาแล้วแต่ยังไม่ done, **When** ดู milestone list, **Then** แสดง overdue badge
6. **Given** ดู Timeline view, **When** มี milestones หลายตัว, **Then** เห็น milestones เรียงตาม deadline (list-based, ไม่ใช่ Gantt)

### User Story 3 - Sprint/Phase Tracking (Priority: P2)
ผู้ใช้ต้องการแบ่ง tasks เป็น sprint/phase พร้อม start/end date เพื่อวางแผนงานเป็นช่วงๆ

**Why this priority**: เพิ่มโครงสร้างให้การทำงาน — แต่ไม่จำเป็นสำหรับ MVP
**Independent Test**: สร้าง sprint → assign tasks → เห็น sprint progress → เห็น velocity

**Acceptance Scenarios**:
1. **Given** ผู้ใช้อยู่ที่ Plan tab, **When** กด Add Sprint, **Then** สามารถกรอก title, start date, end date ได้
2. **Given** มี sprint และ tasks, **When** assign task เข้า sprint, **Then** task แสดงภายใต้ sprint นั้น
3. **Given** sprint มี tasks, **When** ดู sprint, **Then** เห็น progress (done/total) และ remaining days
4. **Given** sprint จบแล้ว (end date ผ่าน), **When** ดู sprint list, **Then** แสดง velocity (items completed ใน sprint นั้น)
5. **Given** มี sprint ปัจจุบัน (active), **When** ดู Plan tab, **Then** sprint ปัจจุบันแสดงอยู่ด้านบนสุด

### User Story 4 - Dashboard Overview (Priority: P2)
ผู้ใช้ต้องการเห็นภาพรวมของ project plan ในหน้าเดียว เพื่อประเมินสถานะโดยรวม

**Why this priority**: สรุปข้อมูลจาก US1-3 — ต้องมีข้อมูลก่อนถึงจะมี dashboard
**Independent Test**: มี tasks + milestones + sprints → เห็น dashboard สรุปทั้งหมด

**Acceptance Scenarios**:
1. **Given** project มี tasks, **When** เปิด Dashboard view, **Then** เห็นสรุป: total tasks, by status (draft/in-progress/done/archived), by priority
2. **Given** project มี milestones, **When** ดู Dashboard, **Then** เห็น upcoming deadlines (sorted by nearest)
3. **Given** project มี sprints, **When** ดู Dashboard, **Then** เห็น current sprint progress + velocity trend
4. **Given** project มี overdue milestones, **When** ดู Dashboard, **Then** แสดง overdue items prominently (top section)
5. **Given** project ไม่มี plan data, **When** เปิด Dashboard, **Then** แสดง empty state พร้อม CTA "Create your first task"

### Edge Cases
- Task ถูก assign ทั้ง milestone และ sprint → แสดงได้ทั้ง 2 ที่
- Milestone ไม่มี tasks → แสดงเป็น empty milestone
- Sprint date ซ้อนกัน (overlap) → อนุญาตได้ (real-world sprints อาจ overlap)
- ลบ milestone ที่มี tasks → tasks ยังอยู่ แค่ unlink จาก milestone
- ลบ sprint ที่มี tasks → tasks ยังอยู่ แค่ unlink จาก sprint
- Task ที่ไม่ได้ assign milestone/sprint → แสดงใน "Unplanned" section
- Tags เป็น free-text (ไม่ต้อง predefined list)
- Date format เป็น ISO 8601 (YYYY-MM-DD) ใน storage, แสดงตาม locale ใน UI

## Functional Tasks

### Task Board
- **FR-001**: ระบบต้องสามารถ CRUD tasks ต่อ project ได้ (title, description, priority P1/P2/P3, status, tags)
- **FR-002**: Status flow เป็น Kanban sections: Backlog → Sprint → In Progress → Review → Done (ย้ายไปมาได้อิสระ ไม่ force forward-only)
- **FR-003**: ระบบต้อง filter tasks ตาม status, priority, tags ได้
- **FR-004**: แต่ละ task ต้องมี unique ID (auto-generated, sequential per project: TASK-001, TASK-002, ...)

### Milestones & Timeline
- **FR-005**: ระบบต้องสามารถ CRUD milestones ต่อ project ได้ (title, description, deadline)
- **FR-006**: ระบบต้องผูก/ถอด tasks กับ milestone ได้ (many-to-one: 1 task อยู่ได้ 1 milestone)
- **FR-007**: ระบบต้องคำนวณ progress ของ milestone (done tasks / total tasks)
- **FR-008**: ระบบต้องแสดง urgent/overdue badge ตามเงื่อนไข deadline

### Sprint/Phase
- **FR-009**: ระบบต้องสามารถ CRUD sprints ต่อ project ได้ (title, start date, end date)
- **FR-010**: ระบบต้องผูก/ถอด tasks กับ sprint ได้ (many-to-one: 1 task อยู่ได้ 1 sprint)
- **FR-011**: ระบบต้องคำนวณ velocity (items done per sprint) สำหรับ completed sprints
- **FR-012**: ระบบต้องระบุ active sprint (start date <= today <= end date)

### Dashboard
- **FR-013**: ระบบต้องแสดงสรุป tasks by status และ by priority
- **FR-014**: ระบบต้องแสดง upcoming deadlines (milestones sorted by nearest deadline)
- **FR-015**: ระบบต้องแสดง current sprint progress + historical velocity
- **FR-016**: ระบบต้องแสดง overdue items อย่างเด่นชัด

### Storage
- **FR-017**: ข้อมูลทั้งหมดต้องเก็บเป็น `.md` file (single file per project: `plan.md`)
- **FR-018**: `.md` format เป็น Markdown Kanban — checkbox list แบ่งตาม section headings (Backlog/Sprint/In Progress/Review/Done)
- **FR-019**: Storage location: `~/.cc-monitor/plans/<projectId>/plan.md`
- **FR-020**: Feature items ใช้ `- [ ] **[Feature] Title** - [Tags]` format พร้อม sub-tasks เป็น nested checkbox
- **FR-021**: Metadata inline: priority tags `[High]`, project tags `[Project-name]`, effort `Back X manday`
- **FR-022**: Done items ใช้ `- [x]` checkbox + strikethrough `~~text~~` (optional)

## Key Entities

- **Task**: หน่วยงานที่ต้องทำ — มี id, title, description, tags[] (e.g. `[Feature]`, `[Bug]`, `[High]`, `[Project-name]`), status (Backlog/Sprint/InProgress/Review/Done), sub-tasks[], milestoneId?, sprintId?, effort? (e.g. "Back 1.5 manday"), createdAt, updatedAt
- **Milestone**: จุดหมายพร้อม deadline — มี id, title, description, deadline (date), createdAt
- **Sprint**: ช่วงเวลาทำงาน — มี id, title, startDate, endDate, createdAt
- **Plan**: container ของทั้งหมด — ประกอบด้วย tasks[], milestones[], sprints[] ต่อ project

## Success Criteria

- **SC-001**: ผู้ใช้สามารถสร้าง task ใหม่ได้ภายใน 3 ขั้นตอน (กด Add → กรอก → Save)
- **SC-002**: สถานะของ tasks ต้องสะท้อนใน milestone progress ภายใน 100% ของกรณี
- **SC-003**: Dashboard ต้องแสดง overdue milestones ได้ถูกต้อง 100%
- **SC-004**: Plan data ต้อง persist ข้าม server restart 100% (เก็บใน `.md` files)
- **SC-005**: `.md` files ต้องอ่านได้ทั้งคน (readable) และ AI (structured/parseable)
- **SC-006**: Sprint velocity ต้องคำนวณถูกต้องจาก historical data
- **SC-007**: Filter tasks ตาม status/priority ต้องแสดงผลถูกต้อง 100%

## Out of Scope

- Git commit/branch linking (ตัดออกตาม user request)
- Multi-user collaboration / assignment
- Gantt chart visualization (ใช้ list-based timeline แทน)
- Notifications / email reminders
- Import/export จาก external tools (Jira, Linear, etc.)
- Recurring sprints (auto-create next sprint)
- Time estimation / story points
- Sub-tasks / task breakdown (flat list only)
- File attachments

## Clarifications

### Session 2026-03-24
- Q: `.md` file format — YAML frontmatter, tables, หรือ format อื่น? → A: **Markdown Kanban** — checkbox list แบ่งตาม section headings (Backlog/Sprint/In Progress/Review/Done), Feature items เป็น bold พร้อม tags `[High]` `[Project]`, sub-tasks เป็น nested checkbox, effort estimate inline `Back X manday`, done items ใช้ `[x]` + `~~strikethrough~~`
- Q: Plan tab อยู่ตรงไหนใน UI? → A: **Sidebar menu item แบบเปิดปิด** — เพิ่ม "Plan" เป็น menu item ใน sidebar เหมือน Project Manager / Projects / Sessions ที่มีอยู่แล้ว กดเปิด/ปิดได้
- Q: Terminology — "Task" หรือ "Feature" หรือ "Task"? → A: **Task** — เป็น generic term สำหรับทุก item ใน board. `[Feature]`, `[Bug]`, `[Worker]` เป็น tag ที่ user กำหนดเอง

## Assumptions

- ใช้งานคนเดียว (single user) — ไม่มี assign, permissions
- `.md` format เป็น Markdown Kanban (checkbox list + section headings) ตามตัวอย่างที่ user ให้มา — คนอ่านง่าย + AI parse ได้
- Priority มี 3 ระดับ: P1 (Critical), P2 (Important), P3 (Nice-to-have)
- Status flow เป็น Kanban — ย้ายระหว่าง sections ได้อิสระ (Backlog/Sprint/In Progress/Review/Done)
- Task อยู่ได้แค่ 1 milestone และ 1 sprint (ไม่ many-to-many)
- Deadline warning threshold: <= 3 days = urgent, past deadline = overdue
- Sprint ซ้อนกันได้ (overlap allowed)
- ไม่มี real-time sync — read/write `.md` files on demand
