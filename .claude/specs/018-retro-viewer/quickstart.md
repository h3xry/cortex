# Quickstart: Cross-Project Retrospective Viewer

## Scenario 1: View All Retros
1. เปิด Cortex → sidebar → กด "Retros"
2. **Expected:** เห็น list retros ทุก project เรียงตามวัน (ล่าสุดก่อน)
3. แต่ละ item แสดง: project name badge, date, title

## Scenario 2: Read a Retro
1. อยู่ใน Retros view → กดเลือก retro
2. **Expected:** เห็น rendered markdown ด้านขวา (desktop) หรือ full screen (mobile)

## Scenario 3: Filter by Project
1. กด project dropdown → เลือก "cortex"
2. **Expected:** เห็นเฉพาะ retros ของ cortex (9 retros)
3. เลือก "All Projects" → เห็นทั้งหมด

## Scenario 4: Switch to Lessons
1. อยู่ Retros tab → กด "Lessons"
2. **Expected:** เห็น lessons ทุก project เรียงตามวัน
3. กดเลือก lesson → เห็น rendered markdown

## Scenario 5: Private Project
1. มี private project ที่ยังไม่ unlock
2. **Expected:** retros ของ private project ไม่แสดงใน list
3. Unlock → refresh → เห็น retros ของ private project เพิ่มเข้ามา

## Scenario 6: Empty State
1. Project ใหม่ไม่มี retros
2. **Expected:** ไม่ crash, แสดง "No retrospectives yet"

## Scenario 7: Mobile
1. เปิดบน mobile → กด Retros
2. **Expected:** เห็น list full width → กด item → เห็น content full width + back button
