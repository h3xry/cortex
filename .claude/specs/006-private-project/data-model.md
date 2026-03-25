# Data Model: 006-private-project (v2)

## Entity Changes

### Project (modified — v1, no change in v2)
| Field | Type | Change | Description |
|-------|------|--------|-------------|
| id | string | existing | UUID short |
| name | string | existing | Basename of directory |
| path | string | existing | Absolute filesystem path |
| isGitRepo | boolean | existing | Whether .git folder exists |
| addedAt | string | existing | ISO 8601 datetime |
| **isPrivate** | **boolean** | **v1** | Whether project is hidden |

### Settings (v1, no change in v2: `~/.cortex/settings.json`)
| Field | Type | Description |
|-------|------|-------------|
| privatePasswordHash | string \| null | scrypt hash of global private password |

### Unlock Token Set (NEW in v2 — server memory only)
| Aspect | Value |
|--------|-------|
| Type | `Set<string>` in-process variable |
| Token format | `crypto.randomUUID()` (UUID v4) |
| Lifecycle | Created on successful unlock, removed on lock/server restart |
| Persistence | **None** — in-memory only |
| Client delivery | Returned in `POST /api/private/unlock` response |
| Client storage | JS module-level variable (not React state, not localStorage) |
| Client sends via | `X-Unlock-Token` header (HTTP), `?token=` query param (WS) |

## State Transitions

### Project Privacy (unchanged from v1)
```
public ──[set private + password]──> private
private ──[unlock + verify password]──> private (visible via token)
private ──[remove private + verify password]──> public
```

### Unlock Token Lifecycle (NEW v2)
```
[no token] ──[POST /api/private/unlock + correct password]──> token issued
                                                                   │
token issued ──[page refresh]──> token lost (client-side)          │
token issued ──[server restart]──> token invalidated (server-side) │
token issued ──[POST /api/private/lock]──> token removed           │
```

### Request Authorization (NEW v2)
```
Request arrives
  ├── Has X-Unlock-Token header?
  │   ├── Yes → token in Set? → Yes → UNLOCKED (show all)
  │   │                       → No  → LOCKED (filter private)
  │   └── No  → LOCKED (filter private)
  │
  └── WebSocket upgrade?
      ├── Has ?token= param?
      │   ├── Yes → token in Set? → Yes → UNLOCKED
      │   │                       → No  → REJECT if private session
      │   └── No  → REJECT if private session
```

## Validation Rules
- Password: minimum 4 characters
- Password hash: scrypt with random salt, stored as `salt:hash` format
- isPrivate default: `false`
- Token: UUID v4 format, no expiration (lives until server restart or explicit lock)
- Cannot set private if no global password exists yet (first time sets the password)
