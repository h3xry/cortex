# API Contracts: 002-session-input

**Created:** 2026-03-23

---

## Changes to Existing Endpoints

### POST /api/sessions (updated)

**Request Body (updated):**
```json
{
  "folderPath": "/Users/h3xry/Work/project-a",
  "allowedTools": ["Read", "Glob", "Grep", "AskUserQuestion"]
}
```

- `allowedTools` (optional) — if omitted, all tools are allowed (full access)

**Response:** unchanged

---

## WebSocket (updated — now bidirectional)

### ws://localhost:3001/stream/sessions/:id

**Server → Client (unchanged):**
```json
{ "type": "output", "data": "terminal output" }
{ "type": "status", "status": "running" }
{ "type": "error", "message": "error text" }
```

**Client → Server (NEW):**
```json
{ "type": "input", "data": "user typed text" }
{ "type": "control", "key": "C-c" }
{ "type": "control", "key": "Enter" }
```

**Behavior:**
- `input`: Server sends `data` as keyboard input to tmux session via `send-keys`
- `control` with `key: "C-c"`: Server sends Ctrl+C to tmux session
- `control` with `key: "Enter"`: Server sends Enter key to tmux session
- If session is ended, input messages are ignored

---

## New REST Endpoint

### GET /api/tools

Returns the list of available tools with categories.

**Response 200:**
```json
{
  "tools": [
    { "name": "Read", "displayName": "Read Files", "category": "file" },
    { "name": "Write", "displayName": "Write Files", "category": "file" },
    { "name": "Edit", "displayName": "Edit Files", "category": "file" },
    { "name": "Glob", "displayName": "Find Files", "category": "file" },
    { "name": "Grep", "displayName": "Search Content", "category": "file" },
    { "name": "NotebookEdit", "displayName": "Edit Notebooks", "category": "file" },
    { "name": "Bash", "displayName": "Run Commands", "category": "system" },
    { "name": "TodoRead", "displayName": "Read Tasks", "category": "system" },
    { "name": "TodoWrite", "displayName": "Write Tasks", "category": "system" },
    { "name": "WebFetch", "displayName": "Fetch URLs", "category": "web" },
    { "name": "WebSearch", "displayName": "Web Search", "category": "web" },
    { "name": "Agent", "displayName": "Sub-agents", "category": "agent" },
    { "name": "AskUserQuestion", "displayName": "Ask Questions", "category": "agent" }
  ],
  "presets": [
    { "name": "Full Access", "tools": [] },
    { "name": "Read Only", "tools": ["Read", "Glob", "Grep", "WebFetch", "WebSearch"] },
    { "name": "Safe Mode", "tools": ["Read", "Glob", "Grep", "AskUserQuestion"] }
  ]
}
```

Note: `"tools": []` in Full Access preset means all tools (no restriction flag passed to CLI).
