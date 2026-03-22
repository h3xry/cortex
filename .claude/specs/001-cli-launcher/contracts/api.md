# API Contracts: 001-cli-launcher

**Created:** 2026-03-23

---

## REST Endpoints

### GET /api/folders?path={path}

Browse file system directories.

**Query Params:**
- `path` (optional) — absolute path, default: user home directory

**Response 200:**
```json
{
  "current": "/Users/h3xry/Work",
  "parent": "/Users/h3xry",
  "entries": [
    { "name": "project-a", "path": "/Users/h3xry/Work/project-a", "hasChildren": true },
    { "name": "project-b", "path": "/Users/h3xry/Work/project-b", "hasChildren": false }
  ]
}
```

**Response 400:** `{ "error": "Invalid path" }`
**Response 404:** `{ "error": "Path not found" }`

---

### POST /api/sessions

Launch new CLI session.

**Request Body:**
```json
{
  "folderPath": "/Users/h3xry/Work/project-a"
}
```

**Response 201:**
```json
{
  "id": "a1b2c3d4",
  "folderPath": "/Users/h3xry/Work/project-a",
  "status": "starting",
  "createdAt": "2026-03-23T10:00:00Z"
}
```

**Response 400:** `{ "error": "Folder does not exist" }`
**Response 409:** `{ "error": "Maximum sessions (10) reached" }`

---

### GET /api/sessions

List all sessions.

**Response 200:**
```json
{
  "sessions": [
    {
      "id": "a1b2c3d4",
      "folderPath": "/Users/h3xry/Work/project-a",
      "status": "running",
      "createdAt": "2026-03-23T10:00:00Z",
      "endedAt": null
    }
  ]
}
```

---

### DELETE /api/sessions/:id

Stop a session (kill tmux session).

**Response 200:** `{ "id": "a1b2c3d4", "status": "ended" }`
**Response 404:** `{ "error": "Session not found" }`

---

## WebSocket

### ws://localhost:{port}/ws/sessions/:id

Stream terminal output for a session.

**Connection:** Client connects with session ID in URL path.

**Server → Client Messages:**
```json
{ "type": "output", "data": "terminal output text with ANSI codes" }
{ "type": "status", "status": "running" }
{ "type": "status", "status": "ended" }
{ "type": "error", "message": "Session not found" }
```

**Behavior:**
- On connect: send buffered output (last N bytes) + start streaming
- On session end: send status "ended" then close connection
- On invalid session ID: send error then close
