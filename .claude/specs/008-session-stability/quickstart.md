# Quickstart: Session Stability Validation

## Test 1: Tail Process Recovery (P1)
1. Create a session via API
2. Verify output is flowing (WebSocket receives data)
3. Kill the tail process: `kill $(pgrep -f "tail -f.*cc-<id>.log")`
4. Wait 5 seconds
5. **Expected:** Output resumes — new tail process spawned, WebSocket receives data again

## Test 2: Listener Isolation (P1)
1. Create a session
2. Connect 2 WebSocket viewers
3. Force-close one viewer's connection mid-stream (e.g., kill the browser tab)
4. **Expected:** Second viewer continues receiving output without interruption

## Test 3: Reliable Startup (P2)
1. Create 5 sessions rapidly (back-to-back API calls)
2. Connect a WebSocket to each
3. **Expected:** All 5 show output within 2 seconds of creation

## Test 4: Restart Circuit Breaker (P1)
1. Create a session
2. Kill the tail process 3 times rapidly (within 30 seconds)
3. **Expected:** After 3rd kill, system stops restarting and logs a warning. Session status still reflects tmux session state (running/ended).

## Test 5: WebSocket Heartbeat (P3)
1. Connect a WebSocket viewer
2. Simulate dead connection (e.g., firewall block without TCP close)
3. Wait 60 seconds
4. **Expected:** Server detects dead connection, cleans up listener
