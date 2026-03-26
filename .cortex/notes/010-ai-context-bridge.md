---
id: 010
title: AI Context Bridge
tags: [idea, ai, integration]
category: idea
pinned: true
createdAt: 2026-03-25T12:00:00.000Z
updatedAt: 2026-03-25T12:00:00.000Z
---

เชื่อม notes + session history เข้ากับ Claude Code session โดยอัตโนมัติ

- เมื่อ launch session → inject relevant notes เป็น context
- เช่น project มี note "Login JWT" ที่ clarify แล้ว → ใส่เป็น system prompt
- session จบ → auto-create note สรุปสิ่งที่ทำ
- link notes ↔ sessions ↔ git commits เป็น knowledge graph
- timeline view: note → session → commit → note (feedback loop)

นี่คือ killer feature ที่ทำให้ Cortex ต่างจาก terminal ธรรมดา:
"ทุกอย่างที่คุณจดไว้ AI อ่านได้ ทุกอย่างที่ AI ทำ คุณมี note"
