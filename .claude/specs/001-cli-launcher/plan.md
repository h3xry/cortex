# Implementation Plan: CLI Launcher

**Spec:** [spec.md](./spec.md)
**Created:** 2026-03-23
**Status:** Draft

## Summary

สร้าง web app สำหรับ launch และ monitor Claude Code CLI sessions ผ่าน tmux:
- **Frontend:** React + Vite + xterm.js — folder browser, session list, terminal viewer
- **Backend:** Node.js + Express — REST API สำหรับ folders/sessions, WebSocket สำหรับ terminal streaming
- **Session manager:** tmux pipe-pane → Node.js stream → WebSocket → xterm.js

## Technical Context

| Aspect | Decision |
|--------|----------|
| Language/Version | TypeScript (Node.js >= 18) |
| Frontend | React 19 + Vite |
| Terminal Emulator | xterm.js + @xterm/addon-fit |
| Backend | Express + ws (WebSocket) |
| Storage | In-memory (Map) |
| Testing | Vitest (frontend) + Vitest (backend) |
| Target Platform | Web app (localhost) |
| Project Type | Full-stack web app (monorepo) |
| Performance Goals | Output latency < 500ms, launch < 3s |
| Constraints | Local only, no auth, tmux required |

## Constitution Check

- [x] Quality Over Speed — plan includes testing strategy, quality gate
- [x] User First — spec driven by user requirements
- [x] Simplicity — minimal stack, in-memory storage, no ORM
- [x] Spec-Driven — following full workflow
- [x] Codebase Consistency — single language (TypeScript), consistent patterns

## Project Structure

### Documentation (this feature)
```
.claude/specs/001-cli-launcher/
├── spec.md          # What/Why
├── plan.md          # This file
├── research.md      # Decision log
├── data-model.md    # Entities
├── contracts/
│   └── api.md       # REST + WebSocket contracts
├── quickstart.md    # Validation scenarios
└── tasks.md         # (ttt output)
```

### Source Code
```
tacking-n-learning/
├── package.json              # Root workspace config
├── tsconfig.json             # Shared TS config
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts          # Entry point (Express + WebSocket setup)
│   │   ├── routes/
│   │   │   ├── folders.ts    # GET /api/folders
│   │   │   └── sessions.ts   # POST/GET/DELETE /api/sessions
│   │   ├── services/
│   │   │   ├── tmux.ts       # tmux command wrapper
│   │   │   └── session-manager.ts  # Session lifecycle
│   │   ├── ws/
│   │   │   └── terminal.ts   # WebSocket handler for streaming
│   │   └── types.ts          # Shared types
│   └── tests/
│       ├── folders.test.ts
│       ├── sessions.test.ts
│       └── tmux.test.ts
├── client/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       │   ├── FolderBrowser.tsx
│       │   ├── SessionList.tsx
│       │   ├── TerminalView.tsx
│       │   └── LaunchButton.tsx
│       ├── hooks/
│       │   ├── useFolders.ts
│       │   ├── useSessions.ts
│       │   └── useTerminal.ts
│       └── types.ts
└── CLAUDE.md
```

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐│
│  │  Folder   │ │ Session  │ │  Terminal    ││
│  │  Browser  │ │  List    │ │  (xterm.js)  ││
│  └────┬─────┘ └────┬─────┘ └──────┬───────┘│
│       │REST         │REST          │WebSocket│
└───────┼─────────────┼──────────────┼────────┘
        │             │              │
┌───────┼─────────────┼──────────────┼────────┐
│       ▼             ▼              ▼         │
│  ┌─────────────────────────────────────┐    │
│  │         Express + ws Server          │    │
│  ├──────────┬──────────┬───────────────┤    │
│  │ /api/    │ /api/    │ /ws/sessions/ │    │
│  │ folders  │ sessions │ :id           │    │
│  └────┬─────┴────┬─────┴───────┬───────┘    │
│       │          │             │             │
│       ▼          ▼             ▼             │
│   fs.readdir  SessionMgr   pipe-pane stream │
│               (in-memory)                    │
│                  │                           │
│                  ▼                           │
│              tmux service                    │
│           (child_process.exec)               │
└──────────────────────────────────────────────┘
        │
        ▼
   tmux sessions
   (claude code CLI)
```

## Key Technical Decisions

1. **Monorepo with npm workspaces** — server/ + client/ ใน root เดียว, shared types
2. **xterm.js** — render ANSI escape codes ได้ถูกต้อง (colors, cursor, etc.)
3. **tmux pipe-pane** — stream output จาก tmux pane ผ่าน child_process → WebSocket
4. **Output buffer** — เก็บ last 100KB per session สำหรับ reconnect/refresh
5. **No database** — in-memory Map เพียงพอสำหรับ <= 10 sessions

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| None | — | — |
