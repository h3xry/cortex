# Quickstart: Git Review Enhancement

## Scenario 1: View Commit History
1. เปิด project ที่มี git commits
2. ไปที่ Changes tab
3. กด "History" toggle (default = Working Directory)
4. **Expected:** เห็น commit list 50 รายการ — message, author, date, hash
5. Scroll ลง → load more commits

## Scenario 2: View Commit Detail
1. อยู่ใน History view
2. กดเลือก commit
3. **Expected:** เห็น commit detail (full message, author name+email, committer, date, full hash)
4. เห็น files changed list พร้อม +/- count
5. กดเลือกไฟล์ → เห็น diff ของไฟล์นั้นใน commit

## Scenario 3: Branch Checkout
1. ดู Changes tab → เห็น current branch ด้านบน
2. กดที่ branch name → dropdown แสดง all branches (local + remote)
3. เลือก branch อื่น
4. **Expected:** checkout สำเร็จ → history refresh ตาม branch ใหม่

## Scenario 4: Checkout with Dirty Working Directory
1. แก้ไขไฟล์ใน project (มี uncommitted changes)
2. พยายาม checkout branch อื่น
3. **Expected:** แสดง warning "You have uncommitted changes. Checkout anyway?"
4. กด Cancel → ไม่ checkout
5. กด Confirm → checkout (หรือ error ถ้า conflict)

## Scenario 5: Diff View Toggle
1. เปิด diff ของไฟล์ใดก็ได้ (working directory หรือ commit)
2. ดู default = unified diff (green/red inline)
3. กดปุ่ม toggle → Side-by-Side
4. **Expected:** 2 columns, old left / new right
5. กด toggle กลับ → unified
6. เปิดไฟล์อื่น → ยังคง mode ที่เลือกไว้

## Scenario 6: Working Directory ↔ History Toggle
1. เปิด Changes tab → เห็น working directory changes (default, เหมือนเดิม)
2. กด "History" → เห็น commit list
3. กด "Working Directory" → กลับมาเห็น uncommitted changes
4. **Expected:** behavior เดิมไม่เปลี่ยนแปลง

## Scenario 7: Non-Git Project
1. เปิด project ที่ไม่ใช่ git repo
2. ไปที่ Changes tab
3. **Expected:** ไม่แสดง history/branch features — behavior เดิม
