# Quickstart: 006-private-project (v2)

## Validation Scenarios

### Scenario 1: First-time Setup + Set Private (unchanged from v1)
```
1. GET /api/private/status → { hasPassword: false }
2. POST /api/private/setup { password: "1234" } → { ok: true }
3. PATCH /api/projects/abc123/private { isPrivate: true, password: "1234" } → project with isPrivate: true
4. GET /api/projects → response ไม่มี abc123 (server filtered out)
```

### Scenario 2: Unlock with Token (v2 — CHANGED)
```
1. GET /api/projects → response มีแค่ public projects
2. POST /api/private/unlock { password: "1234" } → { ok: true, token: "uuid-xxx" }
3. GET /api/projects [X-Unlock-Token: uuid-xxx] → response มีทุก project (รวม private)
4. Client refresh → token หาย (JS variable reset)
5. GET /api/projects → response มีแค่ public projects อีกครั้ง
```

### Scenario 3: Session Filtering (v2 — NEW)
```
1. มี private project "secret" path=/Users/h3xry/Work/secret
2. มี running session ที่ folderPath=/Users/h3xry/Work/secret

Without token:
3. GET /api/sessions → session ของ secret ไม่แสดง (แต่ยังทำงานอยู่ใน tmux)
4. POST /api/sessions { projectId: "secret-id" } → 403 { error: "Project is private" }
5. POST /api/sessions { folderPath: "/Users/h3xry/Work/secret" } → 403 { error: "Project is private" }

With token:
6. GET /api/sessions [X-Unlock-Token: uuid-xxx] → session แสดงปกติ
7. POST /api/sessions { projectId: "secret-id" } [X-Unlock-Token: uuid-xxx] → 201 Created
```

### Scenario 4: WebSocket Blocking (v2 — NEW)
```
1. มี session "sess-123" ที่ belong กับ private project

Without token:
2. WS /stream/sessions/sess-123 → connection destroyed

With token:
3. WS /stream/sessions/sess-123?token=uuid-xxx → connection accepted
```

### Scenario 5: Wrong Password (unchanged)
```
1. POST /api/private/unlock { password: "wrong" } → 401 { error: "Incorrect password" }
2. No token issued
```

### Scenario 6: Remove Private (unchanged)
```
1. (ต้อง unlock ก่อน — มี valid token)
2. PATCH /api/projects/abc123/private { isPrivate: false, password: "1234" } → project with isPrivate: false
3. GET /api/projects → abc123 แสดงถาวร (แม้ไม่มี token)
```

### Scenario 7: Explicit Lock (v2 — NEW)
```
1. POST /api/private/lock [X-Unlock-Token: uuid-xxx] → { ok: true }
2. GET /api/projects [X-Unlock-Token: uuid-xxx] → token invalid แล้ว → มีแค่ public
```

## Manual Test Steps (UI)

1. เปิดแอป → ไม่มีปุ่มปลดล็อก (ยังไม่มี private projects)
2. กดค้างหรือ long-press ที่ project → เมนู "Set Private"
3. ใส่รหัส 4+ ตัว → ยืนยัน → project หายจาก list
4. ปุ่ม 🔒 โผล่ใน sidebar
5. กดปุ่ม 🔒 → modal ใส่รหัส → ใส่ถูก → เห็น private projects (มี badge 🔒)
6. **ตรวจ Network tab** → `GET /api/projects` response มี private projects (ไม่ leak เมื่อไม่มี token)
7. รีเฟรชหน้า → private projects หายอีกครั้ง, ปุ่ม 🔒 ยังอยู่
8. **ตรวจ Sessions tab** → session ของ private project ไม่แสดงเมื่อไม่มี token
