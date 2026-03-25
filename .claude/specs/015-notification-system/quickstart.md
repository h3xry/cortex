# Quickstart: Notification System

## Scenario 1: Session Completed Notification
1. เปิด Cortex → grant notification permission เมื่อ prompt ขึ้น
2. Launch session ใน project ใดก็ได้
3. ให้ session ทำงานจนจบ
4. **Expected:** เห็น in-app toast (green) "Session completed — [project name]" + ได้ยินเสียง success + browser notification (ถ้าอยู่ tab อื่น)
5. กดที่ toast → navigate ไปหน้า session

## Scenario 2: Waiting for Input
1. Launch session → ให้ Claude ถามคำถามหรือรอ permission
2. ไปเปิด tab อื่น
3. **Expected:** browser notification "Waiting for input — [project name]" + เสียง attention
4. กดที่ notification → กลับมาหน้า Cortex ที่ session นั้น

## Scenario 3: Long-Running Alert
1. เปิด settings → ตั้ง threshold เป็น 1 min (สำหรับทดสอบ)
2. Launch session ที่ใช้เวลานาน
3. รอ 1 นาที
4. **Expected:** toast + notification "Session running for 1+ minutes" + เสียง reminder
5. ไม่แจ้งซ้ำอีก (แจ้งครั้งเดียวต่อ session)

## Scenario 4: Customizable Rules
1. เปิด notification settings
2. ปิด "session completed" สำหรับ project A
3. Launch session ใน project A → รอจบ
4. **Expected:** ไม่มี notification
5. Launch session ใน project B → รอจบ
6. **Expected:** มี notification ปกติ

## Scenario 5: Sound Toggle
1. เปิด settings → ปิดเสียง (global)
2. Session จบ
3. **Expected:** มี toast + browser notification แต่ไม่มีเสียง

## Scenario 6: Notification History
1. ปล่อยให้หลาย sessions จบ
2. กดที่ bell icon ใน header
3. **Expected:** เห็น history panel แสดง notifications ย้อนหลัง เรียงล่าสุดก่อน
4. มี unread badge count ที่ bell icon
5. กดที่ notification ใน history → navigate ไปหน้าที่เกี่ยวข้อง

## Scenario 7: Permission Denied Fallback
1. เปิด Cortex → deny notification permission
2. Session จบ
3. **Expected:** ยังเห็น in-app toast + เสียง (แต่ไม่มี browser notification)
