# Research: 006-private-project

## Password Hashing in Node.js

**Decision:** ใช้ built-in `crypto.scrypt` + `crypto.randomBytes` ของ Node.js
**Rationale:** ไม่ต้องเพิ่ม dependency ใหม่ เพียงพอสำหรับ casual privacy, scrypt เป็น memory-hard hash ที่ปลอดภัย
**Alternatives:**
- `bcrypt` (npm) — ต้องเพิ่ม dependency, native addon อาจมีปัญหา build
- `argon2` (npm) — เหมือน bcrypt, overkill สำหรับ use case นี้
**Status:** Implemented (v1) — ไม่เปลี่ยน

## Global Password Storage

**Decision:** เก็บ `privatePasswordHash` ใน `~/.cortex/settings.json` แยกจาก projects.json
**Rationale:** Password เป็น global setting ไม่ใช่ per-project data, แยกไฟล์ทำให้ clean กว่า
**Alternatives:**
- เก็บใน projects.json — ปน data กับ config
- เก็บใน environment variable — ไม่ persistent, ซับซ้อนเกินไป
**Status:** Implemented (v1) — ไม่เปลี่ยน

## Unlock Mechanism (v2 — CHANGED)

**Decision:** Token-based — server generate random UUID, เก็บใน in-memory `Set<string>`, client ส่งกลับใน `X-Unlock-Token` header
**Rationale:** Page refresh ต้อง re-lock (client loses token in JS memory). Boolean flag จะทำให้ unlock ค้างข้าม refresh ซึ่งไม่ตรง requirement
**Alternatives:**
- Boolean flag ฝั่ง server — ง่ายกว่าแต่ refresh ไม่ re-lock
- Client-only state (v1) — ไม่ enforce ฝั่ง server, private data ยังรั่วผ่าน API
- Session cookie — ต้อง cookie management, เกินจำเป็น
**Status:** NEW (replacing v1 client-only approach)

## API Filtering Strategy (v2 — CHANGED)

**Decision:** Server filter private projects/sessions ออกจาก response เมื่อ request ไม่มี valid token
**Rationale:** FR-008~012 กำหนดว่าห้ามพึ่ง client filtering อย่างเดียว — ต้อง enforce ฝั่ง server
**Alternatives:**
- Client-side filtering (v1) — private data ยังรั่วถ้าดู Network tab
- Separate endpoints `/api/projects/private` — เพิ่ม endpoint ไม่จำเป็น
**Status:** NEW (replacing v1 client-side filtering)

## WebSocket Token Delivery

**Decision:** ส่ง token ผ่าน query param `?token=xxx` ใน WS URL
**Rationale:** Browser WebSocket API ไม่รองรับ custom headers ใน upgrade request. Query param เป็นวิธีมาตรฐานที่ใช้กัน (เช่น socket.io, Slack)
**Alternatives:**
- ส่งเป็น first message หลัง connect — ต้อง buffer output จนกว่า auth เสร็จ, ซับซ้อนขึ้น
- Subprotocol header — ไม่ semantic, hacky
**Status:** NEW

## Private Session Detection

**Decision:** Cross-check `session.folderPath` กับ `project.path` ของ private projects
**Rationale:** Session เก็บ `folderPath`, project เก็บ `path` — match กันด้วย exact string comparison. ต้อง check ทั้ง `projectId` และ `folderPath` เพราะ POST /api/sessions รับทั้ง 2 แบบ
**Alternatives:**
- เก็บ `isPrivate` flag ใน session object — ต้อง sync state เมื่อ project privacy เปลี่ยน
- Block เฉพาะ projectId — ทิ้ง folderPath bypass hole
**Status:** NEW
