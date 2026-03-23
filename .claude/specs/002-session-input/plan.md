# Implementation Plan: Session Input & Tool Selector

**Spec:** [spec.md](./spec.md)
**Created:** 2026-03-23
**Status:** Draft

## Summary

เพิ่ม 2 features ให้ web app:
1. **Input**: ส่ง keyboard input จาก browser ไปยัง Claude Code CLI ผ่าน WebSocket → tmux send-keys
2. **Tool Selector**: UI สำหรับเลือก tools ที่อนุญาตก่อน launch → ส่ง `--allowedTools` flag ให้ CLI

## Technical Context

| Aspect | Decision |
|--------|----------|
| Language/Version | TypeScript (existing monorepo) |
| Input Transport | WebSocket bidirectional (reuse existing connection) |
| tmux Input | `tmux send-keys` (already implemented) |
| Tool Restriction | `claude --allowedTools "Read,Glob,..."` flag |
| New Dependencies | None |
| Testing | Vitest (existing) |

## Constitution Check

- [x] Quality Over Speed — plan includes tests
- [x] User First — spec driven by user requirements
- [x] Simplicity — reuses existing WebSocket, no new infra
- [x] Spec-Driven — following workflow
- [x] Codebase Consistency — same patterns as 001

## Project Structure

### New/Modified Files
```
server/src/
├── routes/
│   ├── sessions.ts       # Modified: accept allowedTools in POST body
│   └── tools.ts          # NEW: GET /api/tools
├── services/
│   └── session-manager.ts # Modified: pass allowedTools to tmux command
├── ws/
│   └── terminal.ts       # Modified: handle client→server messages (input/control)
└── types.ts              # Modified: add WsClientMessage, update Session

client/src/
├── components/
│   ├── TerminalInput.tsx  # NEW: input box below terminal
│   ├── ToolSelector.tsx   # NEW: tool permission panel
│   └── TerminalView.tsx   # Modified: include TerminalInput
├── hooks/
│   ├── useTerminal.ts     # Modified: send input via WebSocket
│   └── useTools.ts        # NEW: fetch tools, manage presets
├── types.ts               # Modified: add WsClientMessage, ToolConfig
└── App.tsx                # Modified: integrate ToolSelector before launch
```

## Architecture

```
┌──────────────────────────────────────────────┐
│                  Browser                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │  Tool     │  │ Terminal │  │  Terminal   │ │
│  │ Selector  │  │  View    │  │  Input     │ │
│  └─────┬────┘  └────┬─────┘  └─────┬──────┘ │
│        │POST        │WS recv       │WS send  │
└────────┼────────────┼──────────────┼─────────┘
         │            │              │
┌────────┼────────────┼──────────────┼─────────┐
│        ▼            │              ▼          │
│  POST /sessions     │    ws.on("message")     │
│  {allowedTools}     │    → tmux send-keys     │
│        │            │              │          │
│        ▼            ▼              ▼          │
│    session-manager    WebSocket handler       │
│    (builds command)   (bidirectional)         │
│        │                                      │
│        ▼                                      │
│   tmux new-session                            │
│   claude --allowedTools "Read,Glob,..."       │
└───────────────────────────────────────────────┘
```

## Key Technical Decisions

1. **Reuse existing WebSocket** — no new connection, just add client→server message handling
2. **tmux send-keys for input** — already implemented, handles text + special keys
3. **--allowedTools flag** — native Claude Code support, no hacks needed
4. **Static tool list** — hardcoded in server, no CLI query needed
5. **Presets** — predefined tool combinations for quick selection

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| None | — | — |
