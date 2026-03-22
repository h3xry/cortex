# Quickstart & Validation: 001-cli-launcher

**Created:** 2026-03-23

---

## Prerequisites

- Node.js >= 18
- tmux installed (`brew install tmux` on macOS)
- Claude Code CLI installed (`claude` command available)

## Start Development

```bash
# Install dependencies
npm install

# Start backend + frontend (dev mode)
npm run dev
```

Open `http://localhost:5173` in browser.

## Validation Scenarios

### Scenario 1: Browse Folders
1. Open web app
2. See folder browser showing home directory
3. Click into a subfolder → see its children
4. Click parent → navigate up
5. **Pass:** folders load within 1 second, navigation works

### Scenario 2: Launch Session
1. Browse to a project folder
2. Click "Launch"
3. **Pass:** session appears in sidebar with "running" status, terminal output streams in real-time within 3 seconds

### Scenario 3: Multiple Sessions
1. Launch session in folder A
2. Launch session in folder B
3. Click between sessions in sidebar
4. **Pass:** each session shows its own terminal output, switching is instant

### Scenario 4: Session Ends
1. Wait for CLI session to complete (or kill tmux session externally)
2. **Pass:** status updates to "ended" in session list

### Scenario 5: Page Refresh
1. With a running session, refresh the page
2. **Pass:** session list reloads, clicking session shows current output

### Scenario 6: Error Handling
1. Try to launch with invalid folder path
2. **Pass:** clear error message, no crash
