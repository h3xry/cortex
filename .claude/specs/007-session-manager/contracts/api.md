# API Contracts: 007-session-manager

## Modified Endpoints

### GET /api/sessions
**Change:** Response includes `projectName` and `lastOutput` per session

```json
{
  "sessions": [
    {
      "id": "abc12345",
      "folderPath": "/Users/h3xry/Work/my-project",
      "status": "running",
      "createdAt": "2026-03-23T10:00:00Z",
      "endedAt": null,
      "projectName": "my-project",
      "lastOutput": "Compiling src/main.ts..."
    },
    {
      "id": "def67890",
      "folderPath": "/Users/h3xry/Work/other",
      "status": "ended",
      "createdAt": "2026-03-23T09:00:00Z",
      "endedAt": "2026-03-23T09:30:00Z",
      "projectName": null,
      "lastOutput": "--- Session ended ---"
    }
  ]
}
```

### DELETE /api/sessions/:id
**Change:** Now handles both running (kill + remove) and ended (remove only) sessions

**Running session:** Kills tmux session → marks ended → removes from memory
**Ended session:** Removes from memory directly

**Response 200:** `{ "id": "abc12345", "status": "ended" }`
**Response 404:** `{ "error": "Session not found" }`

## No New Endpoints
All functionality served through existing endpoints with enhanced response data.
