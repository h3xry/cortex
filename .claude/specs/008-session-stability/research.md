# Research: Session Stability

## Topic 1: Tail Process Error Recovery Strategy

**Decision:** Retry with exponential backoff, max 3 attempts in 30 seconds
**Rationale:** Tail failures are typically transient (file briefly unavailable, permissions hiccup). Exponential backoff (1s, 2s, 4s) prevents tight restart loops while recovering quickly from single failures. After 3 failures, mark stream as dead — the session may still be alive (tmux polling will track that separately).
**Alternatives:**
- Immediate restart without backoff → risk tight loop consuming CPU
- Fixed interval restart → slower recovery for first failure
- No restart, just mark ended → too aggressive, kills healthy sessions

## Topic 2: Race Condition Between pipe-pane and tail

**Decision:** Verify log file has been written to (non-zero size or modification time change) before starting tail, with timeout
**Rationale:** `pipe-pane` is async — tmux sends the command but output doesn't flow immediately. Creating an empty file then tailing it immediately means tail starts on an empty file. Instead, after `startPipePane()`, poll the file briefly (up to 2s) to confirm pipe-pane is active before starting tail.
**Alternatives:**
- Sleep for fixed duration → unreliable, wastes time
- Start tail immediately, trust it works → current behavior, causes the bug
- Use inotify/fsevents to watch file → over-engineered for this use case

## Topic 3: WebSocket Heartbeat Implementation

**Decision:** Server-side ping every 30 seconds, terminate on 2 missed pongs
**Rationale:** The `ws` library supports native WebSocket ping/pong frames. 30s interval is standard and keeps connections alive through most proxies/firewalls. Terminating after 2 missed pongs (60s total) avoids killing connections on brief network hiccups.
**Alternatives:**
- Application-level JSON heartbeat → requires client changes, unnecessary
- Shorter interval (10s) → more overhead, not needed for this use case
- No heartbeat, rely on TCP keepalive → unreliable through proxies
