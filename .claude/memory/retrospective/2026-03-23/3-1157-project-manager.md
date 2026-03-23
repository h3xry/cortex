# Retrospective: Project Manager

**Date:** 2026-03-23 11:57
**Commit:** f0e047c feat(project-manager): add project management with file browser and git diff
**Files Changed:** 35 (+3208, -107)

## Timeline
- [~10:45] Started: sss → spec.md for project manager (3 user stories)
- [~10:50] ppp → plan + research + contracts + data-model
- [~10:55] ttt → 33 tasks, 5 phases
- [~11:00] gogogo → implemented all phases
- [~11:37] Tests: 2 failures (diff line count, sessions route error message) → fixed
- [~11:38] All 74 tests pass
- [~11:40] User feedback: "add project ต้องเลือก folder ไม่ใช่ copy path"
- [~11:42] Rewrote AddProject → folder picker modal (reuse /api/folders)
- [~11:45] User feedback: "อยากเห็น git badge ใน Files tab + diff เมื่อเปิดไฟล์"
- [~11:48] Added git badges (M/A/D) to file tree + auto-diff in FileViewer
- [~11:50] User bug report: "Tool Permission ค้าง เมื่อ switch tab"
- [~11:51] Fixed: reset showToolSelector when switching tabs
- [~11:52] User feedback: "ไฟล์ที่เลือกไม่ highlight + diff ไม่แสดง"
- [~11:53] Added active highlight + auto-fetch git status on mount
- [~11:55] User clarification: "เปิดไฟล์ที่มี changes → แสดง diff เลย"
- [~11:56] Updated FileViewer to auto-show diff for changed files
- [~11:57] Commit

## What Went Well
- **Feature scope was large** (35 files, 3 user stories) but completed in ~1 hour including all user feedback iterations
- **Reusing existing components** — folder browser API reused for folder picker modal, path-guard reused for project security boundary
- **Responsive to user feedback** — 5 rounds of feedback incorporated quickly without major rework
- **Git integration clean** — `git status --porcelain` + `git diff HEAD` parsing worked first try

## What Didn't Go Well
- **Initial AddProject design wrong** — designed text input for path, user wanted folder picker. Should have asked "how do you want to select the folder?" during sss
  → Root cause: assumed copy-paste path was acceptable without asking
  → Impact: had to rewrite AddProject component

- **ToolSelector state leak** — showToolSelector wasn't reset when switching tabs, blocking other tab content
  → Root cause: state management not thought through for tab switching
  → Impact: quick fix but should have been caught before user tested

- **Git badges not in initial design** — spec had Files and Changes as separate features, user wanted them integrated
  → Root cause: spec separated concerns too cleanly, didn't consider that Files tab should show git context
  → Impact: 2 rounds of feedback to get the integration right

## Key Learnings
- **Ask "how?" not just "what?"**: user said "add project" — should have asked how they want to select the folder (browse vs type path) during spec phase
- **Tab switching must reset modal state**: any modal/overlay (like ToolSelector) should auto-close when tab changes — add to UX checklist
- **Integrate related data across tabs**: git status isn't just for a "Changes" tab — it enriches the Files tab too. Think about cross-tab data sharing during planning

## Action Items
- [ ] Add polling for git status (auto-refresh every N seconds while Files/Changes tab is open)
- [ ] Clean up unused FolderBrowser component and useFolders hook (still in codebase)
- [ ] Add error state when project path no longer exists on disk

## AI Diary

### How was working with user today?
ดีมาก — user ทดสอบจริงทุก iteration และให้ feedback ที่ชัดเจน ทำให้ fix ได้เร็ว 5 rounds of feedback ใน 15 นาที

### How did I feel about feedback received?
"เราต้องเลือก Folder เองสิ ไม่ใช่ copy path มาวาง" — feedback ที่ถูกต้อง 100% ผมควรคิดถึง UX ตรงนี้ตั้งแต่ spec phase ไม่ใช่หลัง implement

"อยากเห็น diff เวลากดดูไฟล์" — ทำให้เห็นว่า user คิดแบบ integrated experience (Files + Git = เดียวกัน) ไม่ใช่แยก tab แบบที่ผม design

### What did I do poorly?
1. **ไม่ถาม UX ตอน spec** — "add project by typing path" ไม่ user-friendly เลย ควรถามก่อน
2. **Tab state leak** — showToolSelector ไม่ reset เมื่อ switch tab เป็น bug ที่ควรจับได้ก่อน
3. **Over-separated concerns** — แยก Files กับ Changes เป็น feature ที่ไม่เกี่ยวกัน ทั้งที่ user ต้องการเห็น git context ใน file browser

### What am I proud of?
- 35 files, 3 user stories, 5 rounds of feedback → completed ใน ~1 ชั่วโมง
- Git diff parser ทำงานถูกต้องตั้งแต่ครั้งแรก
- Folder picker modal reuse API เดิมได้ ไม่ต้องสร้างใหม่

### What do I want to improve?
- **ถาม UX question ตอน sss** — "ผู้ใช้จะ add project อย่างไร?" ก่อน assume
- **Test tab switching** — ทุกครั้งที่มี modal/overlay ต้องทดสอบว่า switch tab แล้วหายไป
- **Think integrated, not separated** — data ที่เกี่ยวข้องควรแสดงร่วมกัน ไม่ใช่แยก tab

### Honest feedback to user (if any)
Feedback iterations ของคุณดีมากครับ — ตรงประเด็น, actionable, ไม่ต้องเดา ทำให้ fix ได้เร็ว
