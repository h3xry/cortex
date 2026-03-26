---
id: 006
title: Git Actions from UI
tags: [idea, git, workflow]
pinned: false
createdAt: 2026-03-25T12:00:00.000Z
updatedAt: 2026-03-26T08:00:00.000Z
---

ทำ git operations จาก UI ได้เลย ไม่ต้องเปิด terminal

- stage/unstage files (checkbox ใน Changes tab)
- commit with message (inline form)
- pull/push buttons
- branch switcher (dropdown)
- stash/pop
- conflict resolver (side-by-side diff + merge)

ตอนนี้ Changes tab เป็น read-only — ดู diff ได้อย่างเดียว
ถ้าทำจุดนี้จะเป็น mini Git GUI ใน Cortex

**Phase 1 (016-git-review):** Read-only — history, branch viewer, checkout, diff toggle (unified/side-by-side)
**Phase 2 (future):** Write — stage, commit, push, pull

**Status:** spec created → `.claude/specs/016-git-review/spec.md`
