# Research: 006-private-project

## Password Hashing in Node.js

**Decision:** ใช้ built-in `crypto.scrypt` + `crypto.randomBytes` ของ Node.js
**Rationale:** ไม่ต้องเพิ่ม dependency ใหม่ เพียงพอสำหรับ casual privacy, scrypt เป็น memory-hard hash ที่ปลอดภัย
**Alternatives:**
- `bcrypt` (npm) — ต้องเพิ่ม dependency, native addon อาจมีปัญหา build
- `argon2` (npm) — เหมือน bcrypt, overkill สำหรับ use case นี้

## Global Password Storage

**Decision:** เก็บ `privatePasswordHash` ใน `~/.cc-monitor/settings.json` แยกจาก projects.json
**Rationale:** Password เป็น global setting ไม่ใช่ per-project data, แยกไฟล์ทำให้ clean กว่า
**Alternatives:**
- เก็บใน projects.json — ปน data กับ config
- เก็บใน environment variable — ไม่ persistent, ซับซ้อนเกินไป

## Unlock Session Strategy

**Decision:** Client-side state (React useState) — ไม่เก็บใน localStorage/sessionStorage
**Rationale:** FR-004 กำหนดว่ารีเฟรชแล้วต้องซ่อนอีกครั้ง, React state หายเมื่อ remount ซึ่งตรงตาม requirement
**Alternatives:**
- sessionStorage — อยู่ข้าม refresh ภายใน tab เดียวกัน (ไม่ตรง requirement)
- Server-side session — ซับซ้อนเกินไป, ต้องเพิ่ม session management

## API Design: Filtering Private Projects

**Decision:** Server ส่ง private projects มาด้วยเสมอ แต่มี flag `isPrivate`, Client ทำ filtering
**Rationale:** ง่ายกว่า, ไม่ต้องเพิ่ม query param หรือ auth header, casual privacy ไม่ต้องซ่อนจาก API level
**Alternatives:**
- Server filter ด้วย query param `?unlocked=true` — ต้องส่ง token/proof, ซับซ้อนขึ้น
- Separate endpoint `/api/projects/private` — เพิ่ม endpoint ไม่จำเป็น
