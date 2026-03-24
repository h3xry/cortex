# Quickstart: 011-project-plan

## Validation Scenarios

### Scenario 1: First Plan — Create Task (US1 MVP)
```
1. เปิด app → เลือก project จาก sidebar
2. กด "Plan" ใน sidebar toggle → เห็น empty state "Create your first task"
3. กด Add Task → กรอก title "[Feature] ระบบใหม่", tags [High], status Backlog
4. Save → เห็น task ใน Backlog column
5. Verify: GET /api/projects/:id/plan → tasks มี 1 item
6. Verify: ~/.cc-monitor/plans/<projectId>/plan.md exists + readable
```

### Scenario 2: Move Task Between Columns (US1)
```
1. มี task อยู่ใน Backlog
2. กดย้าย task ไป "In Progress"
3. Task ย้ายไป In Progress column
4. Verify: plan.md — task อยู่ภายใต้ ## In Progress section
```

### Scenario 3: Sub-tasks + Effort (US1)
```
1. สร้าง task พร้อม sub-tasks:
   - [ ] Design API — Back 1 manday
   - [ ] Implement — Back 2 manday
2. Check sub-task เป็น done: [x] Design API
3. Verify: plan.md แสดง [x] และ [ ] ถูกต้อง
```

### Scenario 4: Milestone with Progress (US2)
```
1. สร้าง milestone "MVP Launch" deadline 2026-04-15
2. Link 3 tasks เข้า milestone
3. Mark 1 task as done
4. Verify: progress bar แสดง 1/3 = 33%
5. เปลี่ยน deadline เป็นวันพรุ่งนี้ → urgent badge แสดง
6. เปลี่ยน deadline เป็นเมื่อวาน → overdue badge แสดง
```

### Scenario 5: Sprint with Velocity (US3)
```
1. สร้าง sprint "Sprint 1" (2026-03-24 to 2026-04-07)
2. Assign 5 tasks เข้า sprint
3. Mark 3 tasks as done
4. Verify: progress 3/5, remaining days แสดงถูก
5. เลื่อน end date ให้ผ่านแล้ว → velocity = 3
```

### Scenario 6: Dashboard Overview (US4)
```
1. มี tasks 10 ตัว: Backlog 3, InProgress 4, Done 3
2. มี milestones: 1 overdue, 1 upcoming
3. มี sprint: 1 active
4. เปิด Dashboard view →
   - Tasks by status: Backlog 3, InProgress 4, Done 3
   - Overdue: 1 milestone แสดง prominent
   - Current sprint: progress + remaining days
```

### Scenario 7: Filter Tasks (US1)
```
1. มี tasks หลายตัว: P1 High, P2 Feature, P3 Bug
2. Filter ตาม tag [High] → เห็นเฉพาะ High tasks
3. Filter ตาม status InProgress → เห็นเฉพาะ InProgress
4. Clear filter → เห็นทั้งหมด
```

### Scenario 8: Delete Milestone (Edge Case)
```
1. Milestone มี 3 tasks linked
2. ลบ milestone
3. Verify: tasks ยังอยู่ แค่ milestoneId เป็น null
4. Verify: plan.md — milestone section หายไป, tasks ยังอยู่
```

## Manual Test Steps (UI)

1. เปิดแอป → เลือก project → กด "Plan" ใน sidebar
2. สร้าง task → เห็นใน Backlog
3. ย้าย task ไป In Progress → column อัปเดต
4. สร้าง milestone → ดู progress bar
5. สร้าง sprint → ดู active sprint
6. กด Dashboard → เห็นสรุปทั้งหมด
7. เปิด `~/.cc-monitor/plans/<projectId>/plan.md` ด้วย text editor → อ่านเข้าใจ
8. ลอง edit `.md` file ตรงๆ → refresh app → เห็นข้อมูลอัปเดต (bidirectional)
