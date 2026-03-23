# Quickstart: 006-private-project

## Validation Scenarios

### Scenario 1: First-time Setup + Set Private
```
1. GET /api/private/status → { hasPassword: false }
2. POST /api/private/setup { password: "1234" } → { ok: true }
3. PATCH /api/projects/abc123/private { isPrivate: true, password: "1234" } → project with isPrivate: true
4. GET /api/projects → project abc123 has isPrivate: true
5. Client: project abc123 ไม่แสดงใน list (filtered by client)
```

### Scenario 2: Unlock Private Projects
```
1. GET /api/projects → มี project ที่ isPrivate: true
2. Client: ไม่แสดง private projects
3. User กดปุ่มปลดล็อก → modal ใส่รหัส
4. POST /api/private/unlock { password: "1234" } → { ok: true }
5. Client: set unlocked state → แสดง private projects ใน list
6. User รีเฟรชหน้า → unlocked state หาย → private projects ซ่อนอีกครั้ง
```

### Scenario 3: Wrong Password
```
1. POST /api/private/unlock { password: "wrong" } → 401 { error: "Incorrect password" }
2. Client: แสดง error, private projects ยังคงซ่อน
```

### Scenario 4: Remove Private
```
1. (ต้อง unlock ก่อน)
2. PATCH /api/projects/abc123/private { isPrivate: false, password: "1234" } → project with isPrivate: false
3. Client: project กลับมาแสดงถาวร
```

### Scenario 5: Short Password Rejected
```
1. POST /api/private/setup { password: "ab" } → 400 { error: "Password must be at least 4 characters" }
```

## Manual Test Steps (UI)

1. เปิดแอป → ไม่มีปุ่มปลดล็อก (ยังไม่มี private projects)
2. กดค้างหรือ long-press ที่ project → เมนู "Set Private"
3. ใส่รหัส 4+ ตัว → ยืนยัน → project หายจาก list
4. ปุ่ม 🔒 โผล่ใน sidebar
5. กดปุ่ม 🔒 → modal ใส่รหัส → ใส่ถูก → เห็น private projects (มี badge 🔒)
6. รีเฟรชหน้า → private projects หายอีกครั้ง, ปุ่ม 🔒 ยังอยู่
