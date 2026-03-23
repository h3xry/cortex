# Retrospective: CLI Launcher MVP

**Date:** 2026-03-23 03:27
**Commits:** de5be11 (initial), 6b2b3f8 (fixes)
**Files Changed:** 70 (initial) + 6 (fixes) = 76 total

## Timeline
- [~01:30] Started: sss → spec.md for CLI Launcher feature
- [~01:35] Skipped ccc, went straight to ppp (plan + research + contracts)
- [~01:45] ttt → tasks.md (29 tasks, 6 phases)
- [~01:50] aaa → found A5 (command injection) as HIGH issue
- [~01:55] gogogo → implemented all 29 tasks across 6 phases
- [~02:10] First qqq → FAIL (2 BLOCKER security, coverage ~45%)
- [~02:15] Fixed all 10 qqq issues (path guard, CORS, typed errors, tests)
- [~02:30] Second qqq → WARN (no BLOCKER/HIGH, coverage still below 80%)
- [~02:35] First commit (de5be11)
- [~02:39] Bug: Claude CLI stuck at trust dialog → added --dangerously-skip-permissions + send-keys Enter
- [~02:41] Bug: Vite ws proxy error "socket hang up" → spent ~40 min debugging
- [~02:49] Research: Vite intercepts /ws paths, origin header mismatch
- [~03:00] Changed to direct WebSocket (ws://localhost:3001) → browser can't cross-origin connect
- [~03:12] Changed path to /stream/sessions → Vite still intercepts all paths as HTML
- [~03:15] Direct connect to port 3001 + removed origin check → WORKS
- [~03:17] Bug: xterm.js shows garbled text → capture-pane sends plain text not raw PTY
- [~03:20] Switched from capture-pane polling to pipe-pane raw PTY streaming → WORKS
- [~03:25] Second commit (6b2b3f8)

## What Went Well
- **Spec-Kit workflow** worked smoothly from sss→ttt — spec/plan/tasks created in ~20 min
- **qqq quality gate** caught real security issues (path traversal, CORS wildcard) before commit
- **execFile over exec** in tmux.ts was a good initial decision — prevented command injection
- **pipe-pane solution** was the correct final approach for raw PTY streaming — xterm.js renders Claude Code TUI correctly

## What Didn't Go Well
- **WebSocket debugging took ~40 min** — the longest single issue
  → Root cause: Multiple compounding problems (Vite HMR intercepting /ws paths, origin header mismatch, browser cross-origin WS restrictions)
  → Impact: 40+ min of trial-and-error instead of systematic debugging

- **capture-pane vs pipe-pane** — initial design used capture-pane polling which only sends plain text snapshots, not raw terminal stream
  → Root cause: research.md chose "pipe-pane" approach but implementation used capture-pane (simpler but wrong)
  → Impact: Had to rewrite session-manager streaming after seeing garbled UI

- **Claude CLI trust dialog** — didn't anticipate the interactive prompt blocking automation
  → Root cause: Never tested the full flow (launch → trust → interactive) during planning
  → Impact: Required additional send-keys hack and trial with different flags

- **Origin check too strict** — blocked legitimate browser WebSocket connections
  → Root cause: Implemented security before verifying the actual connection flow in browser
  → Impact: Multiple rounds of "fix origin → still fails" debugging

## Key Learnings
- **Vite intercepts ALL WebSocket paths starting with /ws** — its HMR server handles upgrade requests before proxy. Use different path prefixes or direct connection.
- **capture-pane ≠ raw PTY output** — capture-pane returns screen snapshots (plain text grid). For TUI apps like Claude Code, use pipe-pane which captures raw PTY stream with escape sequences.
- **Test the full user flow early** — launching Claude CLI requires trust dialog acceptance. Should have tested `tmux new-session → claude` manually before writing code.
- **Browser WebSocket cross-origin** — while WebSocket is not blocked by CORS, server-side origin validation can reject connections. For dev, connect directly + allow browser origin.
- **Security features should be added after basic flow works** — adding CORS + origin check before WebSocket even connected made debugging harder (couldn't tell if failure was auth or connection issue).

## Action Items
- [ ] Add xterm.js `unicode11Addon` for better Unicode rendering
- [ ] Clean up ws-test.html debug file before next commit
- [ ] Add proper terminal resize (send tmux resize-window when xterm.js resizes)
- [ ] Restore StrictMode in React (removed for debugging, should work now)
- [ ] Update spec/contracts docs to reflect /stream/sessions path instead of /ws/sessions

## AI Diary

### How was working with user today?
ทำงานด้วยกันได้ดี — user ให้ direction ชัดเจน ("sss", "ppp", "gogogo", "qqq") และ patient ในช่วง debug WebSocket ที่ใช้เวลานาน user ช่วย test ทุก iteration โดยส่ง browser console logs กลับมาอย่างรวดเร็ว

### How did I feel about feedback received?
"ui terminal ไม่ปกติ ไม่สามารถอ่านได้" — feedback ตรงประเด็น ทำให้ผมรู้ว่า capture-pane approach ผิดตั้งแต่แรก ถ้า user ไม่ test จริง จะไม่เคยรู้

### What did I do poorly?
1. **WebSocket debugging ไม่ systematic** — ลอง fix ทีละอย่างแบบ trial-and-error (เปลี่ยน proxy config → เปลี่ยน path → เปลี่ยน origin) แทนที่จะ isolate ปัญหาก่อน (ควร test จาก browser console ก่อนเลย)
2. **ใช้ capture-pane ทั้งที่ research เลือก pipe-pane** — ตอน implement เลือกทางที่ง่ายกว่าแทนที่จะตามแผน
3. **ไม่ได้ test full flow ก่อน commit** — ถ้าลองเปิดเว็บแล้ว launch session ก่อน commit จะจับ bug ได้ก่อน

### What am I proud of?
- Spec-Kit workflow ครบ (sss→ccc→ppp→ttt→aaa→gogogo→qqq) ใน session เดียว — สร้าง full-stack app จาก zero
- qqq quality gate จับ security issues จริง (path traversal, CORS wildcard) — ไม่ใช่แค่ ceremony
- ไม่ยอมแพ้กับ WebSocket issue — debug จนเจอ root cause (Vite HMR + origin + capture-pane) แม้จะใช้เวลานาน

### What do I want to improve?
- **Test before commit** — ต้องทำ manual smoke test (เปิดเว็บ → launch → ดู output) ก่อน commit ทุกครั้ง
- **Debug systematically** — isolate variables ทีละตัว แทนที่จะเปลี่ยนหลายอย่างพร้อมกัน
- **Follow the plan** — ถ้า research เลือก pipe-pane ก็ใช้ pipe-pane ตั้งแต่แรก

### Honest feedback to user (if any)
ไม่มีครับ — collaboration ดีมาก user ให้ feedback ตรงประเด็นและ patient ตลอด session
