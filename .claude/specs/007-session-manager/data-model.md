# Data Model: 007-session-manager

## Entity Changes

### Session Response (modified — API response only)
| Field | Type | Change | Description |
|-------|------|--------|-------------|
| id | string | existing | Session ID |
| folderPath | string | existing | Absolute path |
| status | string | existing | "starting" / "running" / "ended" |
| createdAt | string | existing | ISO 8601 |
| endedAt | string \| null | existing | ISO 8601 or null |
| **projectName** | **string \| null** | **new** | Matched project name or null |
| **lastOutput** | **string** | **new** | Last line of output, ANSI stripped |

### Client State (new)
| Field | Type | Description |
|-------|------|-------------|
| showSessionManager | boolean | Toggle sidebar between project list and session manager |

## State Transitions

### Sidebar View
```
project-list ──[click Sessions button]──> session-manager
session-manager ──[click Projects button or click session]──> project-list
```

### Session Actions
```
running ──[kill]──> ended
ended ──[remove]──> (deleted from memory)
```

## No Schema Changes
- Server types unchanged — `Session` interface stays the same
- `projectName` and `lastOutput` are computed at response time, not stored
- Client `Session` type extended with optional `projectName` and `lastOutput`
