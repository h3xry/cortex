User wants to work with notes in `.cortex/notes/`.

Input: $ARGUMENTS

## Phase 1: Resolve Input

### Input is a note ID (e.g. `001`, `002`, `42`)
Read and clarify an existing note.

1. Use Glob to find the file: `.cortex/notes/{id}-*.md` (e.g. `001-*.md`)
2. If not found, try exact match: `.cortex/notes/{id}.md`
3. Read the file content
4. Go to **Phase 2: Analyze**

### Input starts with a category keyword
If input starts with: `idea`, `meeting`, `requirement`, `planned`, `in-progress`, `done`, `archived` followed by a title or description:

1. Extract category + title from input (e.g. "meeting standup วันนี้" → category: meeting, title: "standup วันนี้")
2. Create new note with the category-specific template (see **Templates** below)
3. Go to **Phase 2: Analyze**

### Input is raw text (e.g. "เพิ่มระบบ Login JWT")
Create a new note with category `idea` (default) and clarify it.

1. Create a new note file in `.cortex/notes/` with sequential ID and title slug (e.g. `011-login-jwt.md`)
2. Use YAML frontmatter: id, title, tags, category: idea, pinned: false, createdAt, updatedAt
3. Pre-fill content with **idea template**
4. Go to **Phase 2: Analyze**

### Input is empty
List notes so user can pick:

1. Use Glob to search for `.cortex/notes/*.md`
2. Parse each file's YAML frontmatter
3. Present:
```
📋 Notes ใน project นี้:

| # | ID | Category | Title | Tags | Updated |
|---|----|----------|-------|------|---------|
| 1 | 001 | idea | [title] | [tags] | [date] |

เลือก note (เลข #), พิมพ์หัวข้อใหม่, หรือ "meeting/requirement/idea <title>"
```

---

## Templates

When creating a new note, pre-fill content based on category:

### idea (default)
```markdown
## Problem
<!-- ปัญหาที่อยากแก้ -->

## Proposal
<!-- ไอเดีย / แนวทาง -->

## Impact
<!-- ผลกระทบถ้าทำ — ใครได้ประโยชน์ -->

## Effort
<!-- ประเมินความยาก: S / M / L / XL -->

## Next Steps
- [ ]
```

### meeting
```markdown
## Date


## Attendees
-

## Agenda
-

## Discussion


## Decisions
-

## Action Items
- [ ] [who] — [what] (by [when])

## Next Meeting

```

### requirement
```markdown
## Source
<!-- ใครเป็นคนบอก / มาจากที่ไหน -->

## Priority
<!-- P1 (must) / P2 (should) / P3 (nice-to-have) -->

## Description
<!-- อธิบายว่าต้องการอะไร -->

## Acceptance Criteria
- [ ]
- [ ]

## Constraints
<!-- ข้อจำกัด เช่น timeline, budget, tech stack -->

## Dependencies
<!-- ต้องรออะไรก่อนถึงจะทำได้ -->

## Deadline

```

### planned
```markdown
## Overview
<!-- สรุปสั้นๆ ว่าจะทำอะไร -->

## Scope
-
- **Out of scope:**
  -

## Approach
<!-- แนวทาง / technical approach -->

## Tasks
- [ ]

## Timeline

```

### in-progress
```markdown
## Goal
<!-- เป้าหมายของงานนี้ -->

## Progress
- [ ]
- [ ]

## Blockers
<!-- อะไรที่ติดขัด -->

## Notes
<!-- บันทึกระหว่างทำ -->
```

### done
```markdown
## Summary
<!-- สรุปว่าทำอะไรไป -->

## Outcome
<!-- ผลลัพธ์ -->

## Lessons Learned
<!-- สิ่งที่ได้เรียนรู้ -->

## Related
<!-- links, commits, specs ที่เกี่ยวข้อง -->
```

### archived
(No template — free-form)

---

## Phase 2: Analyze

Read the note and identify what's **unclear, too broad, or missing scope**.

Think like a technical reviewer:
- What decisions are implied but not stated?
- What scope boundaries are missing?
- What technical details need to be defined?
- What edge cases are not considered?
- What constraints should be explicit?

**Adapt analysis to category:**
- **requirement** → focus on: acceptance criteria ครบไหม, priority ชัดไหม, deadline realistic ไหม, dependencies identified ไหม
- **meeting** → focus on: action items มี owner + deadline ไหม, decisions ชัดเจนไหม, missing attendees ที่ควรรู้
- **idea** → focus on: problem defined ชัดไหม, effort estimate realistic ไหม, impact วัดได้ไหม
- **planned** → focus on: scope ชัดไหม, approach feasible ไหม, tasks breakdown ครบไหม
- **in-progress** → focus on: blockers resolved ยัง, progress on track ไหม

---

## Phase 3: Clarify

Present analysis and questions in a single batch:

```
📝 อ่าน note แล้ว — มีจุดที่ต้อง clarify:

**สิ่งที่เข้าใจแล้ว:**
- [point 1]
- [point 2]

**คำถามที่ต้อง clarify:**
1. [question about scope/decision]
2. [question about technical detail]
3. [question about constraint]

ตอบได้เลย หรือบอก "skip" ข้อที่ไม่รู้/ยังไม่ตัดสินใจ
```

**Rules:**
- 3-7 questions depending on how broad the note is
- Questions must be specific and actionable — not generic
- Provide options where possible (e.g. "Token expiry: 1hr / 24hr / 7d?")
- If user answers "skip" → mark as "TBD" in output
- If answers raise new questions → 1-2 follow-ups max

---

## Phase 4: Write Back

Write the clarified note **back to the same file**. Use the category template as base structure, fill in with clarified content.

**Write rules:**
- Use Edit tool to replace note content (keep YAML frontmatter)
- Update `updatedAt` in frontmatter
- Keep `id`, `createdAt`, `pinned` unchanged
- Update `title`, `tags`, and `category` if needed

### CRITICAL: Preserve Original Note

You MUST ALWAYS append the original note at the end inside a `<details>` block. This is NOT optional.

```
<details>
<summary>Original Note</summary>

[exact original content — no edits]

</details>
```

**Why:** The original note is the user's own words — reference for what they intended.

---

## Language Rules
- Match user's language: Thai → Thai, English → English, mixed → mixed
- Technical terms always in English

## Edge Cases
- **Already well-structured** → suggest minor improvements only
- **Just a title, no content** → use category template, ask clarify questions
- **User says "skip all"** → write with what you have, mark unknowns as TBD
- **Very long note** → focus top 5-7 gaps
- **Already clarified** (has `<details>`) → find NEW gaps, append to existing structure
- **Category change** → reformat content to match new category template
