# Research: 011-project-plan

## Markdown Parsing Strategy

**Decision:** Custom regex-based parser — ไม่ใช้ markdown AST library
**Rationale:** Format เป็น subset เล็กๆ ของ markdown (headings + checkboxes + bold + tags) — custom parser เรียบง่ายกว่าและ control ได้เต็มที่ ไม่ต้องเพิ่ม dependency
**Alternatives:**
- `remark`/`unified` (npm) — full AST parser, overkill สำหรับ checkbox parsing, เพิ่ม dependency
- `marked` (npm) — HTML-focused parser, ไม่เหมาะกับ structured data extraction
- YAML frontmatter — ดี แต่ user เลือก Markdown Kanban format แทน

## Storage: Single File vs Multiple Files

**Decision:** Single `plan.md` per project
**Rationale:** User ให้ตัวอย่างเป็น file เดียวที่มีทุก section. Single file ง่ายกว่าต่อการ read/write atomically และ AI อ่านได้ทั้ง context ในครั้งเดียว
**Alternatives:**
- 3 files (tasks.md, milestones.md, sprints.md) — แยก concern แต่ต้อง sync data ข้ามไฟล์
- 1 file per task — flexible แต่ไฟล์เยอะ, ยากต่อ overview

## UI Placement: Sidebar Menu Item

**Decision:** เพิ่ม "Plan" เป็น toggle ใน sidebar ข้างๆ Projects/Sessions
**Rationale:** User ต้องการ sidebar menu item แบบเปิดปิด. Plan เป็น view ระดับ project เหมือน Sessions — ไม่ใช่ tab ใน ProjectPanel
**Alternatives:**
- Tab ใน ProjectPanel — ซ้อนกับ terminal/files/git, สับสน
- Separate page/route — ไม่ fit กับ SPA architecture ปัจจุบัน

## Task ID Generation

**Decision:** Sequential per project: TASK-001, TASK-002, ...
**Rationale:** อ่านง่ายใน markdown, predictable, ไม่ต้อง UUID
**Alternatives:**
- UUID — ยาวเกินใน markdown, ไม่ readable
- Auto-increment integer — ง่ายแต่ไม่มี prefix, สับสนกับ line numbers

## Kanban Columns as Markdown Sections

**Decision:** `## Backlog`, `## Sprint`, `## In Progress`, `## Review`, `## Done` เป็น 5 sections คงที่
**Rationale:** ตรงกับตัวอย่างของ user. Parser รู้ section names ล่วงหน้า ทำให้ parse ง่าย
**Alternatives:**
- Dynamic sections (user สร้างเอง) — ซับซ้อนขึ้น, ไม่จำเป็นตอนนี้
- Status field ใน frontmatter per task — ไม่ตรง format ที่ user ต้องการ
