# Tasks: Note Writer Agent

**Plan:** [plan.md](./plan.md)
**Created:** 2026-03-25
**Total Tasks:** 3

## Phase 1: Agent Definition (US1 + US2 — MVP)

**Goal:** Agent ที่ clarify + summarize + format note ได้
**Independent Test:** `/note meeting note` → ถามคำถาม → ตอบ → ได้ structured note

- [x] T001 Create agent definition in `.claude/agents/note-writer.md` — frontmatter (name, description, model: opus, tools) + full prompt covering: role, flow detection, clarify phase (batch 3-5 questions), summarize phase (bullet points + confirm), format phase (content-type-aware templates), output (display/save), language rules, edge cases

## Phase 2: Slash Command (US3 — Output Destination)

**Goal:** User เรียกใช้ผ่าน `/note` ได้สะดวก
**Independent Test:** `/note decision log` → agent รับ topic แล้วเริ่ม flow

- [x] T002 Create slash command in `.claude/commands/note.md` — pass `$ARGUMENTS` to note-writer agent

## Phase 3: Validation

- [x] T003 Run quickstart.md scenarios (topic only, raw info, skip clarify, save to file) — verify agent works end-to-end

## Dependencies

```
T001 → T002 → T003
```

## Implementation Strategy

1. T001 — เขียน agent prompt (bulk of the work)
2. T002 — เขียน command shortcut (1 minute)
3. T003 — test ด้วย quickstart scenarios
