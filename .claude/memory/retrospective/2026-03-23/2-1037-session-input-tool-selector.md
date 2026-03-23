# Retrospective: Session Input & Tool Selector

**Date:** 2026-03-23 10:37
**Commit:** 58369b4 feat(session-input): add terminal input and tool selector
**Files Changed:** 27

## Timeline
- [~10:00] Started: sss → spec.md for session input + tool selector
- [~10:05] User asked: tmux send-keys vs Claude Code SDK? → decided tmux for MVP
- [~10:07] User asked: can we paste images? → no, tmux limitation, parked for later
- [~10:08] ppp → plan + research + contracts + data-model
- [~10:12] ttt → 18 tasks, 4 phases
- [~10:15] gogogo → implemented all phases
- [~10:22] Tests failed (11 failures) — tmux mock missing new exports, args changed
- [~10:25] Fixed all test failures — 59/59 pass
- [~10:28] User reported: can't use arrow keys to select options in AskUserQuestion
- [~10:30] Added special key support (Arrow, Tab, Escape, Backspace)
- [~10:32] User reported: can't delete text in input box (Backspace caught by special keys)
- [~10:33] User suggested: use Alt+Arrow modifier instead → implemented
- [~10:36] Commit

## What Went Well
- **Fast implementation** — spec to commit in ~35 min for a 2-story feature
- **Reused existing infrastructure** — WebSocket bidirectional + tmux send-keys, no new deps
- **User-driven UX improvement** — Alt+Arrow modifier was user's idea, much better than raw arrow key capture
- **`--allowedTools` flag** — researched and confirmed Claude CLI supports it natively, clean integration

## What Didn't Go Well
- **Backspace capture bug** — caught Backspace as special key, breaking normal input box behavior
  → Root cause: didn't think about which keys should go to input box vs tmux
  → Impact: 1 quick fix, low impact but shows need to think about keyboard event routing

- **Test failures after implementation** — 11 tests broke because mocks didn't include new tmux exports (getPipeFilePath, startPipePane, tailFile, sendKeys)
  → Root cause: session-manager tests mock tmux.js but the mock was incomplete for new functions added in previous commit
  → Impact: 5 min to fix, but should have updated mocks first

## Key Learnings
- **Keyboard event routing needs clear rules**: when input box is focused, normal keys go to input box, modifier+keys (Alt+) go to tmux. This separation is cleaner than trying to intercept individual keys.
- **Mock completeness**: when adding new exports to a mocked module, update ALL test files that mock it — not just the ones being changed.
- **User feedback on UX > initial design**: the Alt+Arrow approach was not in the spec but is objectively better — listen to user when they suggest interaction patterns.

## Action Items
- [ ] Add visual indicator showing which keys are available (tooltip or help text)
- [ ] Consider adding Alt+Backspace to send Backspace to tmux (for deleting in CLI)
- [ ] Test tool selector with actual Claude Code to verify --allowedTools works as expected

## AI Diary

### How was working with user today?
ทำงานราบรื่น — user ให้ feedback ทันทีเมื่อพบปัญหา (arrow keys, backspace) และเสนอ solution ที่ดีกว่า (Alt modifier) แทนที่จะแค่บอกว่าพัง

### How did I feel about feedback received?
"เปลี่ยนให้หน้าเว็บกด alt+UP แบบนี้ดีกว่า" — feedback ที่ดีมาก เปลี่ยน approach จาก "intercept all keys" เป็น "modifier only" ซึ่ง intuitive กว่าและไม่ conflict กับ input box behavior

### What did I do poorly?
1. **ไม่คิดถึง keyboard conflict** — ใส่ Backspace + Arrow Left/Right เป็น special keys ทั้งที่ต้องใช้ใน input box ควรคิดก่อนว่า key ไหนต้องใช้ทั้งสองที่
2. **Mock ไม่ครบ** — เพิ่ม function ใน tmux.ts แต่ไม่ update mock ใน sessions.test.ts

### What am I proud of?
- Implementation เร็วและ clean — reuse WebSocket + tmux send-keys ไม่ต้องสร้าง infra ใหม่
- Tool selector UI ออกมาดี — presets + category grouping + toggle ครบ
- ตอบคำถาม tradeoff (tmux vs SDK, image support) ได้ตรงประเด็น

### What do I want to improve?
- **คิดถึง keyboard UX ก่อน implement** — list ออกมาว่า key ไหนไปไหน ก่อนเขียน code
- **Update mocks proactively** — เมื่อ add export ใหม่ใน module ให้ grep หา test files ที่ mock module นั้น

### Honest feedback to user (if any)
Alt+Arrow suggestion เป็น feedback ที่ดีมาก — แสดงว่า user คิดถึง UX ในมุมที่ผมไม่ได้คิด ถ้ามี feedback แบบนี้ต่อไปจะดีมากครับ
