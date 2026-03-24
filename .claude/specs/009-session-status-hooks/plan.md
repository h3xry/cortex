# Implementation Plan: Session Status via Hooks

**Spec:** [spec.md](./spec.md)
**Created:** 2026-03-24
**Status:** Draft

## Summary

ใช้ Claude Code hook system ส่ง HTTP POST มาที่ server เมื่อเกิด event → track status per session → แสดง badge ใน UI

## Technical Context

| Aspect | Decision |
|--------|----------|
| Hook delivery | HTTP POST to server (type: "command" + curl) |
| Hook setup | Append to ~/.claude/settings.json on session launch |
| Status tracking | In-memory Map keyed by session working directory |
| Events tracked | PreToolUse, PostToolUse, Stop, TaskCompleted, PermissionRequest, UserPromptSubmit |
| New Dependencies | None |

## Hook Setup Strategy

Append hooks to `~/.claude/settings.json` that curl to our server:
```json
{
  "type": "command",
  "command": "curl -s -X POST http://localhost:9002/api/hooks -H 'Content-Type: application/json' -d \"$(cat)\"",
  "timeout": 2
}
```

Claude Code sends JSON to stdin of the hook command. `$(cat)` reads stdin and curl POSTs it.

## New/Modified Files
```
server/src/
├── routes/
│   └── hooks.ts              # NEW: POST /api/hooks endpoint
├── services/
│   └── session-activity.ts   # NEW: track activity status per session
├── routes/sessions.ts        # Modified: include activity status in GET response
└── index.ts                  # Modified: register hooks route

client/src/
├── types.ts                  # Modified: add activity field to Session
├── components/
│   ├── SessionList (or equivalent) # Modified: show activity badge
│   └── ProjectPanel.tsx      # Modified: show activity in session tabs
└── index.css                 # Modified: badge styles

server/src/services/
└── hook-setup.ts             # NEW: append hooks to settings.json
```
