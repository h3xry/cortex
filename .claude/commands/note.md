User wants to work with notes in `.cortex/notes/`.

Input: $ARGUMENTS

## Phase 1: Resolve Input

### Input is a note ID (e.g. `001`, `002`, `42`)
Read and clarify an existing note.

1. Use Glob to find the file: `.cortex/notes/{id}-*.md` (e.g. `001-*.md`)
2. If not found, try exact match: `.cortex/notes/{id}.md`
3. Read the file content
4. Go to **Phase 2: Analyze**

### Input is raw text (e.g. "เพิ่มระบบ Login JWT")
Create a new note and clarify it.

1. Create a new note file in `.cortex/notes/` with sequential ID and title slug (e.g. `011-login-jwt.md`)
2. Use YAML frontmatter: id, title, tags, pinned: false, createdAt, updatedAt
3. Go to **Phase 2: Analyze**

### Input is empty
List notes so user can pick:

1. Use Glob to search for `.cortex/notes/*.md`
2. Parse each file's YAML frontmatter
3. Present:
```
📋 Notes ใน project นี้:

| # | ID | Title | Tags | Updated |
|---|----|-------|------|---------|
| 1 | 001 | [title] | [tags] | [date] |

เลือก note ที่ต้องการ clarify (เลข #) หรือพิมพ์หัวข้อใหม่
```

---

## Phase 2: Analyze

Read the note and identify what's **unclear, too broad, or missing scope**.

Think like a technical reviewer:
- What decisions are implied but not stated?
- What scope boundaries are missing?
- What technical details need to be defined?
- What edge cases are not considered?
- What constraints should be explicit?

**Examples:**

| User wrote | What's missing |
|-----------|----------------|
| "เพิ่มระบบ Login JWT" | Token expiry? Refresh token? Blacklist? Storage? |
| "ทำ caching layer" | Invalidation? TTL? What to cache? Redis/in-memory? |
| "refactor user service" | Which parts? Breaking changes? Migration? |

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

Write the clarified note **back to the same file**, structured as:

```markdown
# [Title]

## Overview
[1-2 sentence summary incorporating clarifications]

## Scope
- [scope item from clarification]
- [out of scope — if mentioned]

## Details
### [Section based on content type]
[organized details from original + clarifications]

## Decisions
- [decision] — **[chosen option]**
- [undecided] — **TBD**

## Open Questions
- [unresolved items]

## Action Items
- [ ] [concrete next step]

---

<details>
<summary>Original Note</summary>

[exact original content — no edits]

</details>
```

**Write rules:**
- Use Edit tool to replace note content (keep YAML frontmatter)
- Update `updatedAt` in frontmatter
- Keep `id`, `createdAt`, `pinned` unchanged
- Update `title` and `tags` if needed based on clarified content

### CRITICAL: Preserve Original Note

You MUST ALWAYS append the original note at the end inside a `<details>` block. This is NOT optional.

**Why:** The original note is the user's own words — reference for what they intended.

**Section selection** — pick what fits:
- Feature → Overview, Scope, Details, Decisions, Action Items
- Bug → Problem, Investigation, Root Cause, Solution
- Meeting → Agenda, Discussion, Decisions, Action Items
- Idea → Problem, Proposal, Pros/Cons, Next Steps

---

## Language Rules
- Match user's language: Thai → Thai, English → English, mixed → mixed
- Technical terms always in English

## Edge Cases
- **Already well-structured** → suggest minor improvements only
- **Just a title, no content** → treat title as topic, ask clarify questions
- **User says "skip all"** → write with what you have, mark unknowns as TBD
- **Very long note** → focus top 5-7 gaps
- **Already clarified** (has `<details>`) → find NEW gaps, append to existing structure
