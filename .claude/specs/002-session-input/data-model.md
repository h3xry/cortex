# Data Model: 002-session-input

**Created:** 2026-03-23

---

## Entities

### ToolConfig

| Field | Type | Description |
|-------|------|-------------|
| name | string | Tool identifier (e.g., "Read", "Bash") |
| displayName | string | Human-readable name |
| category | enum | "file" / "system" / "web" / "agent" |
| enabled | boolean | Whether tool is allowed |

**Categories:**
- file: Read, Write, Edit, Glob, Grep, NotebookEdit
- system: Bash, TodoRead, TodoWrite
- web: WebFetch, WebSearch
- agent: Agent, AskUserQuestion

### Presets

| Preset | Enabled Tools |
|--------|--------------|
| Full Access | All tools |
| Read Only | Read, Glob, Grep, WebFetch, WebSearch |
| Safe Mode | Read, Glob, Grep, AskUserQuestion |
| Custom | User-defined |

### WsClientMessage (new — browser → server)

| Field | Type | Description |
|-------|------|-------------|
| type | "input" / "control" / "resize" | Message type |
| data | string | Text to send (for type "input") |
| key | string | Special key (for type "control"): "C-c", "Enter" |

### WsServerMessage (existing — server → browser)

Already defined in types.ts: output, status, error

## Changes to Existing Entities

### Session (updated)

Add field:
| Field | Type | Description |
|-------|------|-------------|
| allowedTools | string[] | List of allowed tool names for this session |

## Storage

In-memory — tool configs are ephemeral per-session, defined at launch time.
