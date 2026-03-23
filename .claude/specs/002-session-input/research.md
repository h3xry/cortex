# Research: 002-session-input

**Created:** 2026-03-23

---

## 1. Sending Input to tmux Sessions

**Decision:** `tmux send-keys` (already implemented in tmux.ts)
**Rationale:** `tmux send-keys -t <session> <text>` sends keyboard input to a tmux pane. Supports literal text, Enter, Ctrl+C (via `C-c`), and other special keys. Already have `sendKeys()` function from 001-cli-launcher.
**Alternatives:**
- Direct PTY write — requires access to the PTY fd, complex
- Named pipe stdin — would require wrapping claude command with stdin redirect

## 2. Tool Permission Mechanism

**Decision:** Use `--allowedTools` flag with comma-separated tool names
**Rationale:** Claude Code CLI natively supports `--allowedTools "Read,Glob,Grep"` to restrict which tools are available. Combined with `--dangerously-skip-permissions`, this gives full control. Also supports `--disallowedTools` for the inverse approach.
**Alternatives:**
- `--tools` flag — similar but replaces entire tool list including built-ins
- `--permission-mode` — controls approval flow, not tool availability
- `--disallowedTools` — inverse approach, deny specific tools. Less explicit than allowedTools for security.

## 3. Input Transport (Browser → Server → tmux)

**Decision:** WebSocket bidirectional — reuse existing WS connection for sending input
**Rationale:** WebSocket is already established for output streaming. Adding client→server messages (input) reuses the same connection. No new endpoint needed. Message format: `{ type: "input", data: "text" }` and `{ type: "control", key: "C-c" }`.
**Alternatives:**
- REST POST endpoint — simpler but higher latency, no bidirectional flow
- New separate WebSocket — unnecessary when existing WS can be bidirectional

## 4. Available Tools List

**Decision:** Hardcoded list based on Claude Code built-in tools
**Rationale:** The tool list is relatively stable. Hardcoding avoids needing to query the CLI for available tools (which has no such command). Update when new tools are added to Claude Code.
**Tools:** Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, NotebookEdit, AskUserQuestion, TodoRead, TodoWrite, Agent
