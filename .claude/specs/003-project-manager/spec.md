# Feature: Project Manager

**ID:** 003-project-manager
**Created:** 2026-03-23
**Status:** Draft

## Problem Statement

ปัจจุบันระบบแสดง folder browser ที่เปิดดู directory ทั้งหมดในเครื่อง ซึ่งไม่สะดวกและไม่ปลอดภัย — ผู้ใช้ต้อง navigate หา folder ทุกครั้งที่จะ launch session นอกจากนี้ เมื่อ Claude Code ทำงานแล้ว ผู้ใช้ไม่สามารถดูได้ว่าไฟล์ไหนถูกเปลี่ยนแปลง ต้องกลับไปเปิด terminal แล้วรัน git diff เอง

ต้องการระบบที่ผู้ใช้ **add project เข้ามาก่อน** แล้วจัดการทุกอย่างในนั้น — launch sessions, ดูไฟล์, ดู git changes, review code — ไม่ต้องออกจากหน้าเว็บ

## User Scenarios & Testing

### User Story 1 - Add and Manage Projects (Priority: P1)

ผู้ใช้พิมพ์ path ของ project directory เพื่อ add เข้าระบบ project ที่ add แล้วจะแสดงในรายการบน sidebar ผู้ใช้สามารถเลือก project แล้ว launch Claude Code session ได้โดยไม่ต้อง browse folder ทุกครั้ง

**Why this priority**: เป็นพื้นฐานของทุก feature — ต้องมี project ก่อนถึงจะทำอย่างอื่นได้
**Independent Test**: เปิดเว็บ → พิมพ์ path → add project → เห็นในรายการ → เลือกแล้ว launch session ได้

**Acceptance Scenarios**:
1. **Given** หน้าเว็บเปิดอยู่, **When** ผู้ใช้พิมพ์ path (เช่น `/Users/h3xry/Work/myproject`) และกด Add, **Then** project ปรากฏในรายการ sidebar พร้อมชื่อ folder
2. **Given** project ถูก add แล้ว, **When** ผู้ใช้คลิกเลือก project, **Then** สามารถ launch Claude Code session ใน project นั้นได้ทันที
3. **Given** project ถูก add แล้ว, **When** ผู้ใช้กดลบ project, **Then** project หายจากรายการ (ไม่ลบไฟล์จริง)
4. **Given** ผู้ใช้พิมพ์ path ที่ไม่มีอยู่จริง, **When** กด Add, **Then** แสดง error message
5. **Given** project ถูก add แล้ว, **When** ผู้ใช้ refresh หน้าเว็บ, **Then** project ยังอยู่ในรายการ (persist)

### User Story 2 - Browse Project Files (Priority: P2)

ผู้ใช้สามารถดูรายการไฟล์และ folder ภายใน project ที่เลือก เปิดดู content ของไฟล์ได้ เพื่อ review code โดยไม่ต้องเปิด editor

**Why this priority**: ดูไฟล์ได้ทำให้ review code changes ได้ดีขึ้น
**Independent Test**: เลือก project → เห็น file tree → คลิกไฟล์ → เห็น content พร้อม syntax highlighting

**Acceptance Scenarios**:
1. **Given** project ถูกเลือก, **When** ผู้ใช้เปิด file browser tab, **Then** เห็น file tree ของ project (เฉพาะใน project directory)
2. **Given** file tree แสดงอยู่, **When** ผู้ใช้คลิกไฟล์, **Then** เห็น content ของไฟล์พร้อม syntax highlighting
3. **Given** file tree แสดงอยู่, **When** ผู้ใช้คลิก folder, **Then** expand/collapse เพื่อดู sub-files

### User Story 3 - View Git Diff (Priority: P1)

ผู้ใช้สามารถดู git diff ของ project เพื่อเห็นว่ามีไฟล์ไหนถูกเปลี่ยนแปลง (โดย Claude Code หรือใครก็ตาม) แสดง list ของ changed files แล้วคลิกดู diff ของแต่ละไฟล์ได้

**Why this priority**: Core value — เห็นสิ่งที่ Claude Code เปลี่ยนแปลง review ได้ก่อน commit
**Independent Test**: เลือก project ที่มี uncommitted changes → เห็น list ไฟล์ที่เปลี่ยน → คลิกดู diff ของแต่ละไฟล์

**Acceptance Scenarios**:
1. **Given** project ที่เลือกเป็น git repo และมี uncommitted changes, **When** ผู้ใช้เปิด Changes tab, **Then** เห็นรายการไฟล์ที่ถูกเปลี่ยนแปลงพร้อมสถานะ (modified/added/deleted)
2. **Given** รายการ changed files แสดงอยู่, **When** ผู้ใช้คลิกไฟล์, **Then** เห็น diff view แสดง old vs new content (inline หรือ side-by-side)
3. **Given** Claude Code session กำลังทำงาน, **When** Claude แก้ไขไฟล์, **Then** Changes tab อัปเดตอัตโนมัติ (หรือกด refresh)
4. **Given** project ไม่ใช่ git repo, **When** เปิด Changes tab, **Then** แสดงข้อความว่า "Not a git repository"

### Edge Cases
- Project path ถูกลบ/ย้ายหลังจาก add แล้ว — แสดง warning "path not found"
- Project ที่มี submodules — แสดง diff ของ root repo เท่านั้น
- ไฟล์ binary ใน diff — แสดง "Binary file changed" แทน content
- Project มี changes จำนวนมาก (100+ files) — pagination หรือ lazy load
- ไฟล์ขนาดใหญ่ — จำกัดการแสดง content (เช่น max 1MB)

## Functional Requirements

- **FR-001**: System MUST allow user to add a project by typing its absolute path
- **FR-002**: System MUST validate that the path exists and is a directory
- **FR-003**: System MUST persist project list across page refreshes
- **FR-004**: System MUST allow user to remove a project from the list
- **FR-005**: System MUST display project name (directory name) and path in sidebar
- **FR-006**: System MUST replace the current folder browser with a project list
- **FR-007**: System MUST allow browsing files within a selected project's directory only (not parent directories)
- **FR-008**: System MUST display file content with syntax highlighting when a file is clicked
- **FR-009**: System MUST show git status (list of changed files) for the selected project
- **FR-010**: System MUST show git diff for individual files (additions in green, deletions in red)
- **FR-011**: System MUST auto-refresh or allow manual refresh of git changes
- **FR-012**: System MUST limit file browsing and operations to within the project directory (security boundary)

## Key Entities

- **Project**: A registered project directory — key attributes: id, name, path, isGitRepo, addedAt
- **FileEntry**: A file or directory within a project — key attributes: name, path, type (file/directory), children
- **GitChange**: A changed file in git — key attributes: filePath, status (modified/added/deleted/renamed), diff content

## Success Criteria (technology-agnostic, measurable)

- **SC-001**: User can add a project and launch a session within 5 seconds (no folder browsing needed)
- **SC-002**: Project list persists across page refreshes — 0% data loss
- **SC-003**: Git diff view shows changed files within 2 seconds of opening
- **SC-004**: User can view file content with syntax highlighting within 1 second of clicking
- **SC-005**: All file operations are restricted to within the project directory — 0 path traversal possible

## Out of Scope

- Editing files directly from the web UI (read-only file viewer)
- Git operations (commit, push, pull, branch management) from the web UI
- Multi-repo/monorepo support (single git root per project)
- Staging/unstaging individual files for git
- Watching file changes in real-time (use manual refresh or polling)

## Assumptions

- Projects persist in server-side storage (simple JSON file) — not database
- File content is read-only — no editing from web
- Syntax highlighting based on file extension
- Git diff is `git diff HEAD` (unstaged + staged changes)
- Maximum file size for viewing: 1MB
- Maximum changed files display: 200
- Existing folder browser will be removed and replaced with project list
