# Data Model: Session Stability

No new entities. Changes to existing `SessionEntry` internal state:

## Modified: SessionEntry

| Field | Type | Change | Purpose |
|-------|------|--------|---------|
| tailRestartCount | number | NEW | Track restart attempts for backoff/circuit breaker |
| tailLastRestartAt | number (timestamp) | NEW | Track timing for 30s window reset |

## State Transitions: Output Stream

```
starting → active → (failed → restarting → active)* → stopped
                         │                                  ↑
                         └── (3 failures in 30s) ──────────┘
```

- **starting**: Waiting for pipe-pane to be ready
- **active**: Tail process running, output flowing
- **failed**: Tail process exited/errored
- **restarting**: Backoff delay, about to retry
- **stopped**: Max retries exceeded OR session ended

Note: This state is internal tracking only, not exposed to clients. The client-facing session status remains: `starting | running | ended`.
