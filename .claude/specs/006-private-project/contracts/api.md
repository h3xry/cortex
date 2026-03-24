# API Contracts: 006-private-project (v2)

## Auth Header

All endpoints that return project/session data check:
```
X-Unlock-Token: <uuid>
```
If missing or invalid → private data is filtered/rejected.

---

## Modified Endpoints

### GET /api/projects
**Change (v2):** Server filters private projects unless valid token

**Request:**
```
GET /api/projects
X-Unlock-Token: <uuid>   (optional)
```

**Response 200 (with valid token):**
```json
{
  "projects": [
    { "id": "abc123", "name": "public-project", "isPrivate": false, ... },
    { "id": "def456", "name": "secret-project", "isPrivate": true, ... }
  ]
}
```

**Response 200 (without token / invalid token):**
```json
{
  "projects": [
    { "id": "abc123", "name": "public-project", "isPrivate": false, ... }
  ]
}
```
Private projects are silently excluded — no error, no count hint.

### GET /api/sessions
**Change (v2):** Server filters sessions of private projects unless valid token

**Request:**
```
GET /api/sessions
X-Unlock-Token: <uuid>   (optional)
```

**Response 200 (without token):**
Sessions whose `folderPath` matches a private project's `path` are excluded from response. Sessions themselves are NOT killed — just hidden.

### POST /api/sessions
**Change (v2):** Server rejects session creation for private projects unless valid token

**Request:**
```
POST /api/sessions
X-Unlock-Token: <uuid>   (optional)
Content-Type: application/json

{
  "projectId": "def456",
  "allowedTools": ["Bash"]
}
```

**Response 403 (private project, no valid token):**
```json
{ "error": "Project is private" }
```

Also checks `folderPath` — if it matches a private project's path → same 403.

### WebSocket /stream/sessions/:id
**Change (v2):** Check token for sessions of private projects

**Request:**
```
ws://host/stream/sessions/:id?token=<uuid>
```

If session belongs to private project AND token is missing/invalid → connection destroyed (socket.destroy).

---

## Existing Endpoints (unchanged)

### POST /api/private/setup
ตั้ง/เปลี่ยนรหัสผ่าน global — **no change**

### GET /api/private/status
เช็คว่ามี password หรือยัง — **no change**

### PATCH /api/projects/:id/private
ตั้ง/ยกเลิก private — **no change** (ต้อง unlock ก่อนถึงจะเห็น project)

---

## Modified Endpoint

### POST /api/private/unlock
**Change (v2):** Returns token

**Request:**
```json
{ "password": "mypassword" }
```

**Response 200:**
```json
{ "ok": true, "token": "550e8400-e29b-41d4-a716-446655440000" }
```

**Response 401:** `{ "error": "Incorrect password" }`

---

## New Endpoint (optional)

### POST /api/private/lock
Explicitly invalidate a token (e.g., user clicks "lock" button)

**Request:**
```
POST /api/private/lock
X-Unlock-Token: <uuid>
```

**Response 200:** `{ "ok": true }`
