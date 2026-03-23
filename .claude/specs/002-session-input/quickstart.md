# Quickstart & Validation: 002-session-input

**Created:** 2026-03-23

---

## Validation Scenarios

### Scenario 1: Send Text Input
1. Launch a session from the web UI
2. Wait for Claude Code prompt to appear (❯)
3. Type "hello" in the input box and press Enter
4. **Pass:** "hello" appears in the terminal and Claude responds

### Scenario 2: Send Ctrl+C
1. Launch a session and send a prompt that triggers a long operation
2. Click the Ctrl+C button (or press keyboard shortcut)
3. **Pass:** Operation is interrupted, Claude shows interrupt message

### Scenario 3: Input Disabled on Ended Session
1. Launch a session, then stop it (click stop button)
2. Try to type in the input box
3. **Pass:** Input box is disabled, shows "Session ended" message

### Scenario 4: Tool Selector — Read Only
1. Select a folder
2. Click Launch — tool selector appears
3. Select "Read Only" preset
4. Launch the session
5. Ask Claude to create a file
6. **Pass:** Claude says it cannot use Write tool

### Scenario 5: Tool Selector — Custom
1. Select a folder, click Launch
2. Toggle OFF: Bash, Write
3. Toggle ON: Read, Edit, Glob, Grep
4. Launch
5. **Pass:** Claude can read and edit files but cannot run bash commands

### Scenario 6: Tool Selector — Full Access
1. Select "Full Access" preset (default)
2. Launch
3. **Pass:** Claude can use all tools without restriction
