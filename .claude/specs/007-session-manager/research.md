# Research: 007-session-manager

## Output Preview — Strip ANSI vs Render

**Decision:** Strip ANSI codes แล้วแสดง plain text เป็น last line preview
**Rationale:** Preview เป็นแค่ snippet สั้นๆ ไม่คุ้มที่จะ render ANSI colors ในบริบทของ list item, plain text อ่านง่ายกว่าและไม่ต้องเพิ่ม dependency
**Alternatives:**
- Render ANSI ด้วย ansi-to-html — ซับซ้อน, เพิ่ม dependency, overkill สำหรับ 1-line preview
- ไม่แสดง preview — ลด usefulness ของ Session Manager

## Preview Data Source

**Decision:** เพิ่ม `lastOutput` field ใน `GET /api/sessions` response โดย server strip ANSI แล้วส่ง last line จาก outputBuffer
**Rationale:** Server มี outputBuffer อยู่แล้ว แค่เพิ่ม logic strip + extract last line, Client ไม่ต้อง connect WebSocket เพื่อดู preview
**Alternatives:**
- Client connect WebSocket ต่อทุก session — หนักมาก, เปิด 10 WS connections พร้อมกัน
- Separate SSE endpoint — ซับซ้อนเกินไป

## Session Manager UI Location

**Decision:** ปุ่มที่ sidebar เหนือ project list, กดแล้วแสดง session list แทน project list ใน sidebar เดิม
**Rationale:** ไม่ต้องสร้าง layout ใหม่ ใช้พื้นที่ sidebar ที่มีอยู่, toggle ระหว่าง project view กับ session view
**Alternatives:**
- Panel แยก — ต้องแก้ layout หลัก, ซับซ้อน
- Modal/Overlay — ปิดเมื่อ interact, ไม่เหมาะกับ monitoring

## Session-to-Project Mapping

**Decision:** Server จับคู่ session กับ project โดย match `folderPath`, ส่ง project name ใน response
**Rationale:** Session มี `folderPath`, projects มี `path` — match ง่าย, ไม่ต้องเปลี่ยน data model
**Alternatives:**
- เก็บ projectId ใน session — ต้องแก้ createSession API, breaking change
- Client ทำ mapping เอง — ซ้ำซ้อน, client ต้อง fetch ทั้ง sessions + projects

## Remove Ended Session

**Decision:** เพิ่ม `removeSession(id)` ที่ลบ session จาก in-memory map (ต่างจาก `deleteSession` ที่ kill tmux + mark ended)
**Rationale:** `deleteSession` ทำ 2 อย่าง (kill + mark ended), ต้องการ operation แยกที่ลบจาก memory เฉยๆ สำหรับ ended sessions
**Alternatives:**
- ใช้ DELETE endpoint เดิม — ปัจจุบัน DELETE kill tmux session, ถ้า already ended จะ error
