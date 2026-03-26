# Quickstart: Split View

## Scenario 1: Open Split View
1. เปิด project A → ดู terminal
2. กดปุ่ม Split (⊞) ใน header
3. **Expected:** หน้าจอแบ่ง 2 panels, ซ้าย = project A terminal, ขวา = PanelSelector

## Scenario 2: Terminal + Notes Side-by-Side
1. เปิด split → panel ซ้าย = terminal
2. Panel ขวา เลือก project เดียวกัน + tab "Notes"
3. **Expected:** เห็น terminal ซ้าย + notes ขวา พร้อมกัน

## Scenario 3: Cross-Project Sessions
1. เปิด split → panel ซ้าย = project A terminal
2. Panel ขวา เลือก project B + tab "Terminal"
3. **Expected:** 2 terminals ของต่าง project stream output พร้อมกัน

## Scenario 4: Focus & Input
1. อยู่ใน split mode กับ 2 terminals
2. Click ที่ panel ซ้าย → พิมพ์ text → Enter
3. **Expected:** input ส่งไป session ของ panel ซ้ายเท่านั้น
4. Click ที่ panel ขวา → พิมพ์ text → Enter
5. **Expected:** input ส่งไป session ของ panel ขวาเท่านั้น

## Scenario 5: Drag Resize
1. อยู่ใน split mode
2. Drag divider bar ไปทางซ้าย
3. **Expected:** panel ซ้ายเล็กลง panel ขวาใหญ่ขึ้น
4. Terminal ใน panel ที่ resize ปรับ columns/rows

## Scenario 6: Toggle Direction
1. อยู่ใน split mode (horizontal — ซ้าย-ขวา)
2. กดปุ่ม toggle direction
3. **Expected:** เปลี่ยนเป็น vertical (บน-ล่าง) content ยังคงเดิม

## Scenario 7: Close Split
1. อยู่ใน split mode
2. กดปุ่ม Close Split (✕)
3. **Expected:** กลับเป็น single panel, content ของ panel ซ้ายยังอยู่

## Scenario 8: Mobile
1. เปิด Cortex บน mobile (< 768px)
2. **Expected:** ไม่เห็นปุ่ม Split
