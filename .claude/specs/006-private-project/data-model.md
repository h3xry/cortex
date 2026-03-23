# Data Model: 006-private-project

## Entity Changes

### Project (modified)
| Field | Type | Change | Description |
|-------|------|--------|-------------|
| id | string | existing | UUID short |
| name | string | existing | Basename of directory |
| path | string | existing | Absolute filesystem path |
| isGitRepo | boolean | existing | Whether .git folder exists |
| addedAt | string | existing | ISO 8601 datetime |
| **isPrivate** | **boolean** | **new** | Whether project is hidden |

### Settings (new file: `~/.cc-monitor/settings.json`)
| Field | Type | Description |
|-------|------|-------------|
| privatePasswordHash | string \| null | scrypt hash of global private password |

## State Transitions

### Project Privacy
```
public ──[set private + password]──> private
private ──[unlock + verify password]──> private (visible in session)
private ──[remove private + verify password]──> public
```

### Unlock Session (client-side only)
```
locked ──[correct password via POST /api/private/unlock]──> unlocked
unlocked ──[page refresh / browser close]──> locked
```

## Validation Rules
- Password: minimum 4 characters
- Password hash: scrypt with random salt, stored as `salt:hash` format
- isPrivate default: `false`
- Cannot set private if no global password exists yet (first time sets the password)
