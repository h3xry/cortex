# API Contracts: 006-private-project

## Modified Endpoints

### GET /api/projects
**Change:** Response includes `isPrivate` field on each project

```json
[
  {
    "id": "abc12345",
    "name": "my-project",
    "path": "/Users/h3xry/Work/my-project",
    "isGitRepo": true,
    "addedAt": "2026-03-23T10:00:00Z",
    "isPrivate": false
  },
  {
    "id": "def67890",
    "name": "secret-project",
    "path": "/Users/h3xry/Work/secret-project",
    "isGitRepo": true,
    "addedAt": "2026-03-23T11:00:00Z",
    "isPrivate": true
  }
]
```

## New Endpoints

### POST /api/private/setup
ตั้งรหัสผ่าน global private (ครั้งแรก) หรือเปลี่ยนรหัส

**Request:**
```json
{
  "password": "mypassword",
  "currentPassword": "oldpassword"  // required only when changing
}
```

**Response 200:** `{ "ok": true }`
**Response 400:** `{ "error": "Password must be at least 4 characters" }`
**Response 401:** `{ "error": "Current password is incorrect" }` (when changing)

### POST /api/private/unlock
ปลดล็อก — ตรวจรหัสผ่าน

**Request:**
```json
{
  "password": "mypassword"
}
```

**Response 200:** `{ "ok": true }`
**Response 401:** `{ "error": "Incorrect password" }`

### GET /api/private/status
เช็คว่ามีการตั้ง password ไว้แล้วหรือยัง

**Response 200:**
```json
{
  "hasPassword": true
}
```

### PATCH /api/projects/:id/private
ตั้ง/ยกเลิก private สำหรับ project

**Request:**
```json
{
  "isPrivate": true,
  "password": "mypassword"
}
```

**Response 200:** Updated project object
**Response 401:** `{ "error": "Incorrect password" }`
**Response 400:** `{ "error": "No private password set. Call POST /api/private/setup first" }`
