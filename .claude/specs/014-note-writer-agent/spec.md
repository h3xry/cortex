# Feature: Note Writer Agent

**ID:** 014-note-writer-agent
**Created:** 2026-03-25
**Status:** Draft

## Problem Statement

เมื่อ user ต้องการเขียน note (ไม่ว่าจะเป็น meeting note, decision log, idea dump, หรือ knowledge note) มักจะได้ข้อมูลแบบกระจัดกระจาย ไม่มีโครงสร้าง หรือไม่รู้ว่าควรจัดรูปแบบยังไงให้อ่านง่าย

ต้องการ Claude Code subagent ที่:
- **Clarify** — ถามคำถามเพื่อเข้าใจ context, audience, purpose ก่อนเขียน
- **Summarize** — สรุป raw info ที่ user ให้มา แล้วยืนยันก่อน format
- **Format** — เขียน note ที่มีโครงสร้างชัดเจน อ่านง่าย เป็น markdown

## User Scenarios & Testing

### User Story 1 - Clarify แล้วเขียน Note (Priority: P1)
User มี topic ที่อยากจด แต่ยังไม่มี raw info → agent ถามคำถาม 3-5 ข้อ เพื่อดึงข้อมูลออกมา → สรุปให้ confirm → เขียน note

**Why this priority**: เป็น core flow — ไม่มี clarify ก็ไม่ต่างจาก copy-paste
**Independent Test**: บอก agent ว่า "จด meeting note" → agent ถามคำถาม → ตอบ → ได้ structured note

**Acceptance Scenarios**:
1. **Given** user เรียก agent พร้อม topic, **When** agent เริ่มทำงาน, **Then** agent ถามคำถาม 3-5 ข้อ (context, audience, purpose, key points, format preference)
2. **Given** user ตอบคำถามครบ, **When** agent ได้ข้อมูลแล้ว, **Then** agent สรุปสิ่งที่เข้าใจให้ user confirm ก่อนเขียน
3. **Given** user confirm สรุปถูกต้อง, **When** agent เขียน note, **Then** ได้ structured markdown note ที่มี heading, sections, bullet points ตามเนื้อหา

### User Story 2 - Raw Info → Structured Note (Priority: P1)
User มี raw info อยู่แล้ว (ข้อความยาวๆ, bullet points กระจัดกระจาย, copy จาก chat) → agent สรุป → ถามยืนยัน → format เป็น note

**Why this priority**: เป็น use case ที่พบบ่อยพอๆ กับ US1
**Independent Test**: paste raw meeting transcript → agent สรุป key points → confirm → ได้ clean note

**Acceptance Scenarios**:
1. **Given** user ให้ raw info มาพร้อม topic, **When** agent รับข้อมูล, **Then** agent สรุปเป็น key points ให้ review
2. **Given** agent สรุปแล้ว, **When** user บอกว่าขาดอะไร/ผิดตรงไหน, **Then** agent ปรับสรุปแล้วถามยืนยันอีกรอบ
3. **Given** user confirm แล้ว, **When** agent เขียน note, **Then** ได้ structured note ที่ครบถ้วนตาม confirmed summary

### User Story 3 - เลือก Output Destination (Priority: P2)
User เลือกได้ว่าจะ save note ไปที่ไหน — app notes, file path, หรือแค่แสดงใน terminal

**Why this priority**: เสริมความยืดหยุ่น แต่ MVP แค่แสดง output ก็ใช้ได้
**Independent Test**: เขียน note → เลือก save to file → file ถูกสร้าง

**Acceptance Scenarios**:
1. **Given** note เขียนเสร็จแล้ว, **When** agent ถาม destination, **Then** user เลือกได้: display only / save to file path / save to app notes
2. **Given** user เลือก save to file, **When** agent save, **Then** เขียน `.md` file ที่ path ที่ระบุ
3. **Given** user เลือก display only, **When** agent แสดง, **Then** แสดง formatted note ใน terminal (ไม่สร้าง file)

### Edge Cases
- User ให้ raw info แต่ไม่บอก topic → agent ถาม topic ก่อน
- User ตอบคำถาม clarify สั้นมาก → agent ถาม follow-up ได้อีก 1-2 ข้อ (ไม่เกิน total 7)
- User บอก "ไม่ต้อง clarify เขียนเลย" → agent ข้ามไป format ทันที
- Raw info เป็นภาษาผสม (Thai + English) → note เขียนภาษาเดียวกับ input
- Note ยาวมาก → แบ่งเป็น sections ย่อยๆ มี Table of Contents

## Functional Requirements

### Clarify Phase
- **FR-001**: Agent ต้องถามคำถาม 3-5 ข้อ แบบ batch (ถามทีเดียว) เมื่อ user ไม่ได้ให้ raw info มา
- **FR-002**: คำถามต้องครอบคลุม: context (อะไร), audience (ใครอ่าน), purpose (เอาไปทำอะไร), key points (สาระสำคัญ), format preference (รูปแบบที่ต้องการ)
- **FR-003**: Agent ต้องปรับคำถามตาม topic — ไม่ถามแบบ template ตายตัว
- **FR-004**: ถ้า user บอกข้ามขั้น clarify → agent ต้องข้ามได้

### Summarize Phase
- **FR-005**: Agent ต้องสรุป key points จากข้อมูลที่ได้ ให้ user ยืนยันก่อนเขียน
- **FR-006**: Summary ต้องเป็น bullet points สั้นๆ อ่านง่าย
- **FR-007**: User ต้องแก้ไข/เพิ่มเติม summary ได้ก่อน confirm

### Format Phase
- **FR-008**: Note output ต้องเป็น valid markdown
- **FR-009**: Note ต้องมีโครงสร้าง: title, sections, bullet points, emphasis ตามความเหมาะสม
- **FR-010**: Agent ต้องเลือก format ที่เหมาะกับ content type (meeting note ≠ decision log ≠ idea dump)
- **FR-011**: Note ต้องอ่านง่ายทั้งใน rendered markdown และ raw text

### Output
- **FR-012**: Default output คือแสดงใน terminal
- **FR-013**: Agent สามารถ save เป็น `.md` file ได้ถ้า user ระบุ path

## Key Entities

- **Agent Definition**: `.claude/agents/note-writer.md` — agent config file
- **Slash Command**: `.claude/commands/note.md` — shortcut เรียก agent
- **Note Output**: Structured markdown content (title + sections + metadata)

## Success Criteria

- **SC-001**: Agent ถามคำถาม clarify ได้ตรงประเด็นกับ topic ใน 100% ของกรณี
- **SC-002**: Summary ครอบคลุม key points จาก input ≥ 90%
- **SC-003**: Note output อ่านง่ายกว่า raw input อย่างชัดเจน (user subjective)
- **SC-004**: Flow ทั้งหมด (clarify → summarize → format) เสร็จภายใน 3 รอบ interaction
- **SC-005**: Note output เป็น valid markdown 100%

## Out of Scope

- Template management (เลือก/สร้าง note template)
- Auto-categorization หรือ auto-tagging
- Integration กับ Cortex app notes API โดยตรง (MVP แค่เขียน file)
- Image/diagram generation
- Multi-note batch processing
- Version control ของ note

## Assumptions

- Agent เป็น Claude Code subagent (`.claude/agents/note-writer.md`) + slash command (`.claude/commands/note.md`)
- User เรียกใช้ผ่าน `/note` หรือ Claude Code เรียก agent โดยตรง
- ใช้ tools: Read, Write, Edit, Glob, Grep + AskUserQuestion
- Model: Opus — ต้องการ quality สูงสุดสำหรับ clarify + format
- ภาษา output ตาม input ของ user (Thai/English/ผสม)
- Default format เป็น markdown
- Agent ไม่ต้อง persist state ระหว่าง session

## Clarifications

### Session 2026-03-25
- Q: วิธีเรียกใช้ agent — agent อย่างเดียว, agent+command, หรือ command อย่างเดียว? → A: **Agent + Slash command** — มี `/note` เป็น shortcut + `.claude/agents/note-writer.md` เป็น agent definition
- Q: Clarify questions ถามทีเดียวหรือทีละข้อ? → A: **ถามทีเดียว (batch)** — แสดงคำถามทั้งหมดในรอบเดียว ลด interaction rounds
- Q: Model ที่ใช้สำหรับ agent? → A: **Opus** — ต้องการ quality สูงสุดสำหรับ clarify + format note
