# Feature: Git Review Enhancement

**ID:** 016-git-review
**Created:** 2026-03-26
**Status:** Draft

## Problem Statement

ผู้ใช้ต้องการ review code changes ใน Cortex ได้ครบ workflow แต่ตอนนี้ Changes tab ทำได้แค่ดู diff ของ working directory เทียบ HEAD — ไม่สามารถ:
- ดู commit history ย้อนหลัง
- ดูว่าใคร commit อะไร เมื่อไหร่
- ดู diff ของ commit เก่าๆ
- สลับ branch เพื่อ review code ของ branch อื่น
- toggle ระหว่าง unified diff กับ side-by-side diff

ทำให้ต้องเปิด terminal แยกเพื่อ `git log`, `git checkout`, `git diff` ซึ่งลดประโยชน์ของ Cortex ในฐานะ review tool

## User Scenarios & Testing

### User Story 1 - Git History (Priority: P1)
ผู้ใช้เปิด Changes tab แล้วดู commit history ของ project — เห็นรายการ commits เรียงตามเวลา แสดง message, author, date. กดเลือก commit แล้วเห็น diff ของ commit นั้น

**Why this priority**: เป็น foundation ของ git review — ไม่เห็น history ก็ review ไม่ได้
**Independent Test**: เปิด Changes tab → เห็น commit list → กดเลือก commit → เห็น files changed + diff

**Acceptance Scenarios**:
1. **Given** project เป็น git repo, **When** เปิด Changes tab, **Then** เห็น commit history list (default 50 commits) แสดง: commit message (1 line), author name, relative date (e.g. "2 hours ago"), short hash
2. **Given** commit list แสดงอยู่, **When** กดเลือก commit, **Then** แสดง files changed ของ commit นั้น พร้อม additions/deletions count
3. **Given** เลือก commit แล้ว, **When** กดเลือกไฟล์, **Then** แสดง diff ของไฟล์นั้นใน commit ที่เลือก
4. **Given** commit list แสดงอยู่, **When** scroll ลงมาถึงล่าง, **Then** load more commits (pagination หรือ infinite scroll)
5. **Given** commit list แสดงอยู่, **When** ดู commit detail, **Then** เห็น full commit message, author name, author email, committer name (ถ้าต่างจาก author), date, full hash

### User Story 2 - Branch Viewer & Checkout (Priority: P1)
ผู้ใช้เห็น branch ปัจจุบัน สลับไป branch อื่นได้ เพื่อ review code ของ branch นั้น

**Why this priority**: เท่ากับ US1 — ต้อง checkout branch ก่อนถึงจะเห็น history/diff ที่ถูกต้อง
**Independent Test**: เห็น current branch → กด dropdown → เลือก branch อื่น → checkout สำเร็จ → history เปลี่ยนตาม

**Acceptance Scenarios**:
1. **Given** project เป็น git repo, **When** ดู Changes tab, **Then** เห็น current branch name แสดงชัดเจน
2. **Given** ดู current branch, **When** กด branch selector, **Then** เห็น dropdown แสดง local branches ทั้งหมด + remote branches
3. **Given** เลือก branch จาก dropdown, **When** กด, **Then** checkout ไป branch นั้น + refresh commit history ตาม branch ใหม่
4. **Given** มี uncommitted changes ใน working directory, **When** พยายาม checkout branch อื่น, **Then** แสดง warning "You have uncommitted changes. Checkout anyway?" พร้อม confirm/cancel
5. **Given** checkout สำเร็จ, **When** ดู Changes tab, **Then** commit history, working directory changes, และ branch name อัพเดทตาม branch ใหม่

### User Story 3 - Diff View Toggle (Priority: P1)
ผู้ใช้ toggle ระหว่าง unified diff (สีเขียว/แดงในไฟล์เดียว) กับ side-by-side diff (2 columns เทียบกัน)

**Why this priority**: UX ปัจจุบันมีแค่ unified — บางคนชอบ side-by-side มากกว่า
**Independent Test**: ดู diff → กด toggle → เห็น side-by-side → กดกลับ → เห็น unified

**Acceptance Scenarios**:
1. **Given** กำลังดู diff ของไฟล์, **When** กดปุ่ม toggle, **Then** สลับระหว่าง unified กับ side-by-side view
2. **Given** ดู unified diff, **Then** แสดง lines เรียงกัน — เขียว = added, แดง = deleted, เทา = context
3. **Given** ดู side-by-side diff, **Then** แสดง 2 columns: ซ้าย = old, ขวา = new, highlight changes ในแต่ละ line
4. **Given** เลือก view mode แล้ว, **When** เปิดไฟล์อื่น, **Then** ยังคง view mode เดิม (persist ตลอด session)
5. **Given** ดู diff บน mobile, **When** เลือก side-by-side, **Then** สามารถ scroll horizontal ได้ หรือ fallback เป็น unified ถ้าหน้าจอแคบเกินไป

### User Story 4 - Working Directory vs Commit History Toggle (Priority: P2)
ผู้ใช้สลับระหว่างดู working directory changes (เหมือนตอนนี้) กับ commit history ได้

**Why this priority**: ต้องมีทั้งสอง view — แต่ working directory มีอยู่แล้ว แค่เพิ่ม toggle
**Independent Test**: อยู่หน้า Changes → เห็น tab/toggle Working Directory | History → สลับได้

**Acceptance Scenarios**:
1. **Given** เปิด Changes tab, **When** ดู default view, **Then** เห็น working directory changes (behavior เดิม)
2. **Given** เปิด Changes tab, **When** กด "History" toggle, **Then** สลับไปดู commit history
3. **Given** อยู่ History view, **When** กด "Working Directory" toggle, **Then** กลับมาดู uncommitted changes

### Edge Cases
- Project ไม่ใช่ git repo → ไม่แสดง history/branch features (เหมือนเดิม)
- Branch ที่ checkout ถูกลบจาก remote → แสดง warning "branch not found on remote"
- Commit history ว่าง (new repo ยังไม่มี commit) → แสดง "No commits yet"
- ไฟล์ binary ใน diff → แสดง "Binary file changed" ไม่พยายาม render diff
- Commit มี 100+ files changed → แสดง list ได้ + pagination ถ้าจำเป็น
- Detached HEAD state → แสดง "(detached)" แทน branch name
- Checkout fail (dirty working tree + conflict) → แสดง error message ชัดเจน
- Side-by-side diff กับไฟล์ที่ยาวมาก → virtual scroll เพื่อไม่ให้ lag
- Author กับ Committer ต่างกัน (เช่น cherry-pick) → แสดงทั้งสอง

## Functional Requirements

### Git History
- **FR-001**: ระบบต้องแสดง commit history list — message, author, date, short hash
- **FR-002**: Default แสดง 50 commits, load more เมื่อ scroll ถึงล่าง
- **FR-003**: กดเลือก commit → แสดง files changed + diff ของ commit นั้น
- **FR-004**: แสดง commit detail: full message, author (name + email), committer (ถ้าต่าง), date, full hash
- **FR-005**: Diff ของ commit ใช้ `parent..commit` comparison

### Branch
- **FR-006**: แสดง current branch name
- **FR-007**: Branch dropdown แสดง local + remote branches
- **FR-008**: เลือก branch → checkout ไป branch นั้น
- **FR-009**: ถ้ามี uncommitted changes → warning ก่อน checkout
- **FR-010**: Checkout สำเร็จ → refresh history + working directory

### Diff View
- **FR-011**: Toggle unified / side-by-side diff
- **FR-012**: Unified diff — inline, color-coded (green/red/gray)
- **FR-013**: Side-by-side diff — 2 columns, old left / new right, line-aligned
- **FR-014**: View mode persist ตลอด session (ไม่ต้อง persist ข้าม refresh)
- **FR-015**: Mobile fallback — side-by-side ต้อง scroll horizontal หรือ auto-switch เป็น unified

### Navigation
- **FR-016**: Toggle ระหว่าง "Working Directory" กับ "History" ใน Changes tab
- **FR-017**: Default view = Working Directory (behavior เดิมไม่เปลี่ยน)

## Key Entities

- **Commit**: hash, shortHash, message, authorName, authorEmail, committerName, committerEmail, date, filesChanged[]
- **Branch**: name, isRemote, isCurrent
- **CommitFile**: filePath, status (added/modified/deleted/renamed), additions, deletions

## Success Criteria

- **SC-001**: ผู้ใช้ดู commit history ได้ภายใน 2 วินาทีหลังเปิด Changes tab
- **SC-002**: Checkout branch สำเร็จภายใน 3 วินาที
- **SC-003**: Toggle diff view (unified ↔ side-by-side) เกิดขึ้นทันที (< 100ms)
- **SC-004**: ผู้ใช้ระบุ author ของ commit ได้ถูกต้อง 100%
- **SC-005**: Diff ของ commit แสดง files changed ครบถ้วน 100%
- **SC-006**: การทำงานเดิม (working directory changes) ไม่เปลี่ยนแปลง

## Out of Scope

- Git operations: stage, commit, push, pull, merge, rebase, stash (read-only เท่านั้น)
- Conflict resolver / merge tool
- Blame / annotate view
- File-level history (history ของไฟล์เดียว)
- Git graph visualization (branch diagram)
- Cherry-pick, revert operations
- Tag management
- Submodule support
- Search in commit messages
- Compare arbitrary commits (เทียบเฉพาะ commit กับ parent)

## Assumptions

- Read-only — ยกเว้น checkout branch เป็น write operation เดียว
- History pagination: 50 commits per page
- Branch list refresh เมื่อเปิด dropdown (ไม่ poll)
- Diff rendering ใช้ existing DiffViewer component เป็น base + เพิ่ม side-by-side mode
- Remote branches แสดงเป็น `origin/branch-name` ใน dropdown
- Author info มาจาก `git log --format` ไม่ต้อง resolve จาก external service (เช่น GitHub avatar)
- Side-by-side diff ใช้ synchronized scroll ระหว่าง 2 columns
- Commit diff ใช้ `git diff <parent>...<commit>` สำหรับ single-parent commits

## Clarifications

### Session 2026-03-26
- Q: ยังอยากได้ stage/commit/push ไหม? → A: **Read-only ก่อน** — เฉพาะ history, branch, diff
- Q: Diff toggle แบบไหน? → A: **Toggle ได้** ทั้ง unified และ side-by-side
- Q: Code tab กับ Changes tab ควรรวมกันไหม? → A: **แยกกันถูกแล้ว** ไม่ต้องรวม
