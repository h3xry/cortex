# Feature: Session Input & Tool Selector

**ID:** 002-session-input
**Created:** 2026-03-23
**Status:** Draft

## Problem Statement

ปัจจุบันหน้าเว็บแสดง terminal output แบบ read-only เท่านั้น ผู้ใช้ไม่สามารถพิมพ์คำสั่งหรือตอบคำถามของ Claude Code ผ่านเว็บได้ ต้องไปพิมพ์ผ่าน terminal โดยตรง นอกจากนี้ เมื่อ launch session ผู้ใช้ไม่สามารถเลือกได้ว่าจะอนุญาตให้ Claude Code ใช้ tools อะไรบ้าง (เช่น Read, Write, Edit, Bash, AskUserQuestion) ทำให้ต้องยอมรับหรือปฏิเสธ permission ทีละตัวขณะทำงาน

## User Scenarios & Testing

### User Story 1 - Send Input to Session (Priority: P1)

ผู้ใช้เห็น Claude Code ถามคำถาม (เช่น AskUserQuestion) บน terminal ในเว็บ ผู้ใช้พิมพ์คำตอบในช่อง input ด้านล่าง terminal แล้วกด Enter เพื่อส่งข้อความไปยัง CLI session

**Why this priority**: เป็น core feature ที่เปลี่ยน read-only monitor เป็น interactive tool — ไม่มี input = ยังต้องใช้ terminal ตรง
**Independent Test**: เปิดเว็บ → launch session → Claude ถามคำถาม → พิมพ์ตอบจากเว็บ → เห็นคำตอบถูกส่งและ Claude ทำงานต่อ

**Acceptance Scenarios**:
1. **Given** session กำลังทำงานและ Claude แสดงคำถาม, **When** ผู้ใช้พิมพ์ข้อความและกด Enter, **Then** ข้อความถูกส่งไปยัง CLI session และแสดงบน terminal
2. **Given** session กำลังทำงาน, **When** ผู้ใช้พิมพ์หลายบรรทัด, **Then** สามารถส่งได้ทีละบรรทัดหรือทั้งก้อน
3. **Given** session สถานะ "ended", **When** ผู้ใช้พิมพ์ข้อความ, **Then** ช่อง input ถูก disable พร้อมข้อความบอกว่า session จบแล้ว

### User Story 2 - Tool Selector on Launch (Priority: P1)

ก่อน launch session ผู้ใช้สามารถเลือกว่าจะอนุญาตให้ Claude Code ใช้ tools อะไรบ้าง เช่น อนุญาต Read แต่ไม่อนุญาต Write/Bash เพื่อให้ Claude ทำงานแบบ read-only

**Why this priority**: ควบคุม permission ก่อน launch ลดความเสี่ยง — ถ้าไม่มีต้อง approve/deny ทีละตัวขณะทำงาน
**Independent Test**: เปิดเว็บ → เลือก folder → เห็น tool selector → toggle tools → launch → Claude ใช้ได้เฉพาะ tools ที่เลือก

**Acceptance Scenarios**:
1. **Given** ผู้ใช้เลือก folder แล้ว, **When** กดจะ launch, **Then** เห็น panel แสดงรายการ tools ทั้งหมดพร้อม toggle เปิด/ปิด
2. **Given** tool selector แสดงอยู่, **When** ผู้ใช้ปิด Write และ Bash, **Then** launch session โดย Claude จะถูกจำกัดให้ใช้ได้เฉพาะ tools ที่เปิดไว้
3. **Given** ไม่มี tool ถูกเลือกเลย, **When** ผู้ใช้กด launch, **Then** แสดง warning ว่าต้องเลือกอย่างน้อย 1 tool

### Edge Cases
- ผู้ใช้ส่ง input ขณะ Claude กำลังทำงาน (ไม่ได้ถามคำถาม) — ควรส่งไปเป็น text input ปกติ
- ผู้ใช้ส่ง special characters หรือ escape sequences — ควร sanitize หรือส่งตรง?
- ผู้ใช้ส่ง Ctrl+C — ควร interrupt process ได้
- Network หลุดขณะพิมพ์ — แสดง error แต่ไม่สูญเสีย input ที่พิมพ์แล้ว
- Tool selector: ถ้า Claude ต้องการ tool ที่ถูกปิด — Claude จะได้รับ permission denied จาก CLI ปกติ

## Functional Requirements

- **FR-001**: System MUST allow user to type text and send it as keyboard input to the active CLI session
- **FR-002**: System MUST support sending Enter key (newline) to submit input
- **FR-003**: System MUST support sending Ctrl+C to interrupt the CLI process
- **FR-004**: System MUST disable input when session status is "ended"
- **FR-005**: System MUST display a tool selector before launching a session with toggleable tools
- **FR-006**: System MUST pass selected tool permissions to the CLI session on launch
- **FR-007**: System MUST show the list of available tools: Read, Write, Edit, Bash, AskUserQuestion, Glob, Grep, WebFetch, WebSearch, NotebookEdit
- **FR-008**: System MUST provide preset configurations (e.g., "Read Only", "Full Access", "Custom")

## Key Entities

- **ToolPermission**: A tool that can be allowed or denied — key attributes: name, displayName, enabled (boolean), category (file/system/web)
- **InputMessage**: Text sent from web to CLI session — key attributes: text, type (text/control)

## Success Criteria (technology-agnostic, measurable)

- **SC-001**: User can send text input and see it reflected in the terminal within 200ms
- **SC-002**: Ctrl+C successfully interrupts a running CLI process within 500ms
- **SC-003**: User can configure tool permissions before launch in under 10 seconds
- **SC-004**: CLI session respects tool permissions — denied tools are not usable by Claude

## Out of Scope

- Editing tool permissions after session is already launched
- Custom tool parameter configuration (e.g., limiting Bash to specific commands)
- Saving/loading permission presets across sessions
- File upload through the web input
- Rich text or markdown input (plain text only)

## Assumptions

- Claude Code CLI supports `--allowedTools` flag to restrict available tools
- Keyboard input can be sent to tmux sessions via standard tmux commands
- Tool list is based on Claude Code's current built-in tools
- Default preset: "Full Access" (all tools enabled)
- Input is plain text — no terminal emulator input handling (arrow keys, tab completion) for MVP
