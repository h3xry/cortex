# Research: Split View

## Multiple ProjectPanel Instances

**Decision:** Render 2 ProjectPanel components side-by-side — แต่ละตัวมี project + state อิสระ
**Rationale:** ProjectPanel เป็น self-contained อยู่แล้ว — hooks, tabs, sessions filter ทำงานอิสระต่อ instance. Terminal ใช้ ResizeObserver + FitAddon แยกกัน ไม่ conflict
**Alternatives:** Custom split component ที่ render เฉพาะ tab (rejected — ซับซ้อนกว่า, ต้อง duplicate logic)

**สิ่งที่ทำงานได้เลย (ไม่ต้องแก้):**
- Multiple terminals — WebSocket + xterm + FitAddon เป็น independent per instance
- ResizeObserver — แต่ละ terminal watch container ของตัวเอง
- Tab state — activeTab, activeSession เก็บ per-component
- Session filtering — แต่ละ panel filter จาก project.path ของตัวเอง

**สิ่งที่ต้องแก้:**
- App.tsx — เพิ่ม split state + render 2 ProjectPanels
- CSS — .main-content ต้องรองรับ flex-direction: row เมื่อ split
- Focus management — input ส่งไป panel ที่ focus
- Notification navigation — ต้องรู้ว่า navigate ไป panel ไหน

## Drag Resize

**Decision:** CSS flexbox + mousedown/mousemove/mouseup handlers บน divider element
**Rationale:** ง่ายที่สุด ไม่ต้อง library. คำนวณ ratio จาก mouse position relative to container
**Alternatives:** CSS resize property (rejected — ไม่ smooth, ไม่ customizable), react-split-pane library (rejected — เพิ่ม dependency)

## Split Direction

**Decision:** Toggle CSS flex-direction ของ container: `row` (horizontal) / `column` (vertical)
**Rationale:** แค่เปลี่ยน 1 CSS property + divider cursor. Content ไม่ต้อง re-render
**Alternatives:** Re-layout DOM (rejected — ไม่จำเป็น, flexbox handle ได้)
