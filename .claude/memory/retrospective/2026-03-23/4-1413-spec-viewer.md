# Retrospective: Spec Viewer

**Date:** 2026-03-23 14:13
**Commit:** 7aabf91 feat(spec-viewer): add Specs tab with markdown + mermaid rendering
**Files Changed:** 14

## Timeline
- [~13:00] Started: sss → spec.md for spec viewer (2 user stories)
- [~13:02] ppp → plan + research (no new server code needed)
- [~13:03] ttt → 10 tasks
- [~13:04] gogogo → installed deps, implemented all phases
- [~13:08] All tests pass, Specs tab working
- [~13:09] User: "ไฟล์ .md ใน Files tab ดู render ได้ไหม?" → added Preview/Code/Diff mode toggle
- [~13:10] User: "mermaid กระพริบ" → first fix: memo MermaidBlock
- [~14:10] User: "ยังกระพริบ" → root cause: useSessions polling ทุก 3s trigger re-render ทั้ง tree → fixed with JSON.stringify comparison + memo MarkdownViewer
- [~14:12] Commit

## What Went Well
- **No server code needed** — reused existing file API endpoints ทั้งหมด
- **Feature scope clear** — markdown + mermaid rendering ตรงไปตรงมา
- **User request for .md preview in Files tab** — เพิ่มได้เร็วเพราะ MarkdownViewer component reusable
- **Root cause analysis สำหรับ mermaid flicker** — traced จาก MermaidBlock → MarkdownViewer → useSessions polling

## What Didn't Go Well
- **Mermaid flicker ใช้เวลาแก้ 2 rounds**
  → Round 1: memo MermaidBlock — ไม่พอเพราะ parent ยังถูก re-render
  → Round 2: memo MarkdownViewer + fix useSessions setState — แก้ root cause
  → Root cause: useSessions polling ทุก 3s เรียก `setSessions(data.sessions)` ทุกครั้ง แม้ data ไม่เปลี่ยน ทำให้ React re-render ทั้ง component tree
  → Impact: ~5 min debugging, ควรคิดถึง re-render chain ตั้งแต่แรก

- **ไม่ได้คิดถึง .md preview ใน Files tab ตอน spec**
  → User ต้องถามเพิ่ม
  → Root cause: คิดว่า spec viewer เป็น feature แยก ไม่ได้คิดว่า markdown rendering ควร available ทุกที่

## Key Learnings
- **Polling setState ต้อง compare ก่อน update**: `setSessions(data)` ทุก 3s = re-render ทุก 3s แม้ data เหมือนเดิม. ต้อง `JSON.stringify` compare หรือใช้ deep equal ก่อน setState
- **Reusable components ควร memo by default**: component ที่ render heavy content (markdown, diagrams) ควร wrap ด้วย `memo` ตั้งแต่สร้าง ไม่ใช่แก้ทีหลังเมื่อ user เห็นกระพริบ
- **Feature ที่เพิ่ม rendering capability ควรถูกใช้ทุกที่**: เมื่อเพิ่ม markdown renderer ให้คิดว่า "ที่ไหนอีกบ้างที่ user อาจต้องการดู rendered markdown?" — Files tab, Changes tab, etc.

## Action Items
- [ ] Audit ทุก hook ที่มี polling interval — ใส่ state comparison ก่อน setState
- [ ] Add `memo` to all heavy components (DiffViewer, FileViewer, etc.)

## AI Diary

### How was working with user today?
ดี — user ทดสอบจริงและแจ้ง bug ชัดเจน "mermaid กระพริบ อ่านไม่รู้เรื่อง"

### How did I feel about feedback received?
"ยังกระพริบ" หลังจากแก้ round 1 — ทำให้ต้อง dig deeper หา root cause จริงๆ (useSessions polling) ซึ่งเป็น feedback ที่ดี เพราะ round 1 fix แค่ symptom ไม่ใช่ root cause

### What did I do poorly?
1. **แก้ flicker 2 rounds** — ควร trace re-render chain ตั้งแต่ round 1: "ทำไม parent ถูก re-render?" → "useSessions polling" → "setState ทุกครั้งแม้ data เหมือนเดิม"
2. **ไม่ได้คิดถึง .md preview ใน Files tab** — ควรถามตัวเองว่า "feature นี้ใช้ที่อื่นได้ไหม?"

### What am I proud of?
- Zero server code สำหรับ feature ใหม่ — reuse API 100%
- Root cause fix ที่ useSessions (JSON.stringify compare) แก้ปัญหา re-render ให้ทั้ง app ไม่ใช่แค่ mermaid

### What do I want to improve?
- **Trace re-render chain ก่อนแก้**: เมื่อเห็น flicker ให้ถามว่า "อะไร trigger re-render?" ก่อน memo component
- **คิด cross-cutting**: feature ใหม่ที่เพิ่ม capability ควรถูกพิจารณาใช้ในทุก context ที่เกี่ยวข้อง

### Honest feedback to user (if any)
"ไฟล์ที่เป็น md ใน Project จะดู render ได้ไหม?" — คำถามที่ดีมาก ทำให้ feature มีค่ามากขึ้นเพราะ markdown preview ใช้ได้ทุกที่ ไม่ใช่แค่ Specs tab
