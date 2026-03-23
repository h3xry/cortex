# Quickstart: 007-session-manager

## Validation Scenarios

### Scenario 1: View All Sessions
```
1. Launch 2 sessions from different projects
2. Click "Sessions" button in sidebar
3. See both sessions with: status badge, project name, duration, last output preview
4. Running sessions sorted first, then by creation time
```

### Scenario 2: Kill Session
```
1. Have a running session visible in Session Manager
2. Click kill button (x) on the session
3. Confirm in dialog
4. Session status changes to "ended"
5. Terminal view shows "Session ended" message
```

### Scenario 3: Monitor Multiple Sessions
```
1. Have 2 running sessions
2. Open Session Manager
3. See live preview text updating for both sessions
4. Click on session A → switches to project A's terminal tab showing session A
5. Click "Sessions" again → back to session list
6. Click on session B → switches to project B's terminal tab showing session B
```

### Scenario 4: Remove Ended Session
```
1. Have an ended session in Session Manager
2. Click remove button
3. Session disappears from list
```

### Scenario 5: Empty State
```
1. No sessions exist
2. Open Session Manager
3. See "No active sessions" message
```

## Manual Test Steps (Mobile)
1. Open sidebar (hamburger menu)
2. Tap "Sessions" button
3. See session list with touch-friendly tap targets
4. Tap session to switch → sidebar closes, terminal opens
