# Research: Git Review Enhancement

## Git Log API

**Decision:** ใช้ `git log --format` กับ custom format string เพื่อดึง commit data ครบ
**Rationale:** ดึง hash, message, author, committer, date ได้ทีเดียวใน 1 command แทน parse หลายรอบ
**Format:** `git log --format="%H|%h|%s|%an|%ae|%cn|%ce|%aI" -50 --skip=N`
**Alternatives:** `git log --pretty=oneline` (rejected — ไม่มี author info), `git log --json` (rejected — git ไม่มี native JSON output)

## Commit Diff

**Decision:** ใช้ `git diff <parent>...<commit>` สำหรับดู changes ของ commit
**Rationale:** แสดง diff เทียบ parent เหมือน GitHub/GitLab
**For first commit:** `git diff --root <commit>` (ไม่มี parent)
**For files list:** `git diff-tree --no-commit-id -r --numstat <commit>` ดึง files changed + stats
**Alternatives:** `git show <commit>` (rejected — include commit message ด้วย ต้อง parse ออก)

## Branch List

**Decision:** `git branch -a --format="%(refname:short)|%(objectname:short)|%(HEAD)"`
**Rationale:** ดึง branch name, short hash, current marker ได้ทีเดียว. `-a` = local + remote
**Alternatives:** `git branch` + `git branch -r` แยก (rejected — 2 commands ไม่จำเป็น)

## Checkout

**Decision:** `git checkout <branch>` ผ่าน `execFile`
**Rationale:** Simple, ทำงานกับทั้ง local และ remote branches (auto-creates tracking branch)
**Safety:** ตรวจ dirty working tree ก่อน checkout ด้วย `git status --porcelain`
**Alternatives:** `git switch` (rejected — ไม่รองรับ git < 2.23)

## Side-by-Side Diff

**Decision:** Transform existing DiffHunk data เป็น 2-column layout ฝั่ง client
**Rationale:** ไม่ต้องเพิ่ม API ใหม่ — ใช้ diff data เดิม แค่ render ต่างกัน. Pair deleted + added lines ที่อยู่ติดกันเป็น side-by-side
**Alternatives:** ใช้ library เช่น `diff2html` (rejected — เพิ่ม dependency, ซับซ้อนเกินไป)
