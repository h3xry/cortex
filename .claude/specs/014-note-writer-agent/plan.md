# Implementation Plan: Note Writer Agent

**Spec:** [spec.md](./spec.md)
**Created:** 2026-03-25
**Status:** Draft

## Summary

สร้าง Claude Code subagent + slash command สำหรับเขียน note แบบมี flow:
1. **Clarify** — ถามคำถาม 3-5 ข้อ แบบ batch เพื่อเข้าใจ context
2. **Summarize** — สรุป key points ให้ user confirm
3. **Format** — เขียน structured markdown note

เป็น prompt-only feature — ไม่มี source code, ไม่มี data model, แค่เขียน 2 markdown files

## Technical Context

| Aspect | Decision |
|--------|----------|
| Language/Version | Markdown (Claude Code agent definition) |
| Primary Dependencies | None — built-in Claude Code agent system |
| Storage | N/A (agent writes output to terminal or file) |
| Testing | Manual — test by invoking `/note` |
| Target Platform | Claude Code CLI |
| Project Type | Agent definition |
| Performance Goals | N/A |
| Constraints | Must follow existing agent/command file format |

## Constitution Check

- [x] Spec aligns with project principles (Simplicity — minimal 2-file solution)
- [x] No constitution violations
- [x] Scope is appropriate (small, self-contained)

## Project Structure

### Documentation
```
.claude/specs/014-note-writer-agent/
├── spec.md          # What/Why ✅
├── plan.md          # This file
└── quickstart.md    # Validation scenarios
```

### Source Files (deliverables)
```
.claude/
├── agents/
│   └── note-writer.md    # Agent definition (frontmatter + prompt)
└── commands/
    └── note.md           # Slash command (delegates to agent)
```

## Design

### Agent Definition (`.claude/agents/note-writer.md`)

Frontmatter format (matching existing agents like `code-reviewer.md`):
```yaml
---
name: note-writer
description: Write structured, readable notes with clarification before writing.
model: opus
tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---
```

Prompt structure:
1. **Role** — คุณเป็น note writer ที่ช่วย user เขียน note ให้อ่านง่าย
2. **Flow Detection** — ดูจาก input ว่า user มี raw info หรือแค่มี topic
   - มี raw info → ไป Summarize Phase
   - มีแค่ topic → ไป Clarify Phase
   - บอกข้ามขั้น clarify → ไป Format Phase ทันที
3. **Clarify Phase** — ถาม batch 3-5 คำถาม (context, audience, purpose, key points, format)
   - คำถามต้อง adaptive ตาม topic ไม่ใช่ template ตายตัว
   - ถ้า user ตอบสั้น → follow-up ได้อีก 1-2 ข้อ (max total 7)
4. **Summarize Phase** — สรุปเป็น bullet points ให้ confirm
   - User แก้ไข/เพิ่มเติมได้
   - ถ้าแก้ → สรุปใหม่แล้วถามอีกรอบ
5. **Format Phase** — เขียน note ตาม content type
   - เลือก format อัตโนมัติ: meeting note, decision log, idea dump, knowledge note, etc.
   - Output เป็น valid markdown
6. **Output** — ถาม destination: display only / save to file
   - Default: display ใน terminal
   - ถ้า save: ใช้ Write tool เขียน `.md` file

### Slash Command (`.claude/commands/note.md`)

Simple command ที่ pass arguments ไปให้ agent:
```
User wants to write a note. Use the note-writer agent to help them.
Topic/input: $ARGUMENTS
```

### Note Format Guidelines (ใส่ใน agent prompt)

Agent ต้องเลือก format ตาม content type:

| Content Type | Structure |
|-------------|-----------|
| Meeting Note | Date, Attendees, Agenda, Discussion, Action Items, Next Steps |
| Decision Log | Context, Options, Decision, Rationale, Consequences |
| Idea/Brainstorm | Problem, Ideas (bullet), Pros/Cons, Next Steps |
| Knowledge Note | Topic, Summary, Details (sections), References |
| Debug Note | Problem, Environment, Steps Tried, Root Cause, Solution |
| General | Title, Overview, Body (sections), Key Takeaways |

### Language Rules
- ภาษา output ตาม input (Thai → Thai, English → English, ผสม → ผสม)
- Technical terms ใช้ภาษาอังกฤษเสมอ

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| None | — | — |

## Validation

- [x] Follows constitution (Simplicity — 2 files only)
- [x] Simpler alternatives considered (single command file → rejected เพราะ agent reusable จาก Agent tool ด้วย)
- [x] Dependencies identified (None — built-in system)
- [x] All NEEDS CLARIFICATION resolved (3 items from ccc)
- [x] File structure defined
- [x] No data model needed (prompt-only feature)
