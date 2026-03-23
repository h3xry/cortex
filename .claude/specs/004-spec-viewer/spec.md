# Feature: Spec Viewer

**ID:** 004-spec-viewer
**Created:** 2026-03-23
**Status:** Draft

## Problem Statement

แต่ละ project มี spec documents อยู่ใน `.claude/specs/` (spec.md, plan.md, research.md, data-model.md, contracts/, tasks.md) แต่ปัจจุบันต้องเปิด editor หรือ terminal เพื่ออ่าน ผู้ใช้ไม่สามารถดู spec ได้จากหน้าเว็บ โดยเฉพาะ Mermaid diagrams ที่อยู่ใน markdown ต้อง render จึงจะอ่านได้ ทำให้ flow การทำงาน (ดู spec → สั่ง Claude → review changes) ต้องสลับไปมาระหว่างเว็บกับ editor

## User Scenarios & Testing

### User Story 1 - Browse and Read Specs (Priority: P1)

ผู้ใช้เลือก project แล้วเปิด Specs tab เห็นรายการ feature specs ทั้งหมด (เช่น 001-cli-launcher, 002-session-input) คลิกเข้าไปเห็นไฟล์ต่างๆ (spec.md, plan.md, tasks.md) คลิกไฟล์แล้วเห็น markdown ถูก render สวยงาม

**Why this priority**: อ่าน spec ได้คือ core value — ไม่ต้องสลับไป editor
**Independent Test**: เลือก project → Specs tab → เห็น feature list → คลิก feature → เห็นไฟล์ → คลิกไฟล์ → เห็น rendered markdown

**Acceptance Scenarios**:
1. **Given** project ที่มี `.claude/specs/` directory, **When** ผู้ใช้เปิด Specs tab, **Then** เห็นรายการ feature directories (001-cli-launcher, 002-session-input, etc.)
2. **Given** feature list แสดงอยู่, **When** ผู้ใช้คลิก feature, **Then** เห็นรายการไฟล์ .md ใน feature directory (spec.md, plan.md, tasks.md, etc.)
3. **Given** ไฟล์ list แสดงอยู่, **When** ผู้ใช้คลิก spec.md, **Then** เห็น markdown rendered พร้อม headings, tables, code blocks, lists
4. **Given** project ไม่มี `.claude/specs/`, **When** เปิด Specs tab, **Then** แสดงข้อความ "No specs found"

### User Story 2 - View Mermaid Diagrams (Priority: P1)

ผู้ใช้เปิด spec ที่มี Mermaid code block (เช่น architecture diagram, flowchart, sequence diagram) ระบบ render เป็น diagram แบบ visual ไม่ใช่แสดง code text

**Why this priority**: Mermaid diagrams เป็นส่วนสำคัญของ spec — ถ้าไม่ render ก็แค่ดู raw code ซึ่งอ่านยาก
**Independent Test**: เปิด spec ที่มี mermaid block → เห็น diagram render เป็นรูป

**Acceptance Scenarios**:
1. **Given** markdown มี ` ```mermaid ` code block, **When** render, **Then** แสดงเป็น diagram (flowchart, sequence, etc.) ไม่ใช่ raw text
2. **Given** mermaid syntax ผิด, **When** render, **Then** แสดง error message แทน diagram (ไม่ crash ทั้งหน้า)
3. **Given** markdown มีทั้ง text และ mermaid, **When** render, **Then** text ปกติ + diagrams สลับกันถูกต้อง

### Edge Cases
- Project ไม่มี `.claude/` directory — แสดง "No specs found"
- Spec file ขนาดใหญ่ (> 100KB) — ยังแสดงได้แต่อาจช้า
- Markdown มี relative links/images — แสดง text fallback
- Feature directory มี subdirectories (เช่น contracts/, checklists/) — แสดงเป็น expandable tree
- Mermaid diagram ซับซ้อน — render ตามความสามารถของ library

## Functional Requirements

- **FR-001**: System MUST scan `.claude/specs/` directory ของ project ที่เลือกและแสดงรายการ feature directories
- **FR-002**: System MUST display list of .md files within each feature directory
- **FR-003**: System MUST render markdown content with proper formatting (headings, tables, code blocks, lists, bold/italic)
- **FR-004**: System MUST render Mermaid code blocks as visual diagrams
- **FR-005**: System MUST handle Mermaid render errors gracefully (show error, not crash)
- **FR-006**: System MUST support nested directories (contracts/, checklists/)
- **FR-007**: System MUST show "No specs found" when `.claude/specs/` doesn't exist
- **FR-008**: System MUST add a "Specs" tab to the existing ProjectPanel

## Key Entities

- **SpecFeature**: A feature directory under `.claude/specs/` — key attributes: name (e.g., "001-cli-launcher"), files list
- **SpecFile**: A markdown file within a feature — key attributes: name, relativePath, content

## Success Criteria (technology-agnostic, measurable)

- **SC-001**: User can open and read any spec file within 1 second of clicking
- **SC-002**: Mermaid diagrams render as visual diagrams, not raw code
- **SC-003**: Markdown tables, code blocks, and headings display correctly
- **SC-004**: Navigation from feature list → file list → content takes max 2 clicks

## Out of Scope

- Editing spec files from the web UI (read-only)
- Creating new spec files or features from the web
- Rendering non-markdown files (images, PDFs)
- Live-reload when spec files change on disk
- Search within spec content

## Assumptions

- Spec files follow the `.claude/specs/###-feature-name/` convention
- All spec files are markdown (.md extension)
- Mermaid diagrams use standard fenced code blocks (` ```mermaid `)
- File reading reuses existing `/api/projects/:id/files/content` endpoint
- Maximum file size for rendering: 1MB (same as file viewer)
- Dark theme for rendered markdown matching existing UI
