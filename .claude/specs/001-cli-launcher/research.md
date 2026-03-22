# Research: 001-cli-launcher

**Created:** 2026-03-23

---

## 1. Terminal Streaming to Browser

**Decision:** WebSocket + xterm.js
**Rationale:** WebSocket ให้ bidirectional real-time communication, xterm.js เป็น standard terminal emulator ในเว็บที่รองรับ ANSI escape codes, colors, cursor movement ครบถ้วน — เหมาะกับ Claude Code CLI ที่มี rich terminal output
**Alternatives:**
- SSE (Server-Sent Events) — unidirectional only, ไม่เหมาะถ้าต้อง send input ในอนาคต
- Polling — latency สูง, ไม่ real-time
- Socket.IO — overhead เกินจำเป็น, native WebSocket เพียงพอ

## 2. Session Management

**Decision:** tmux (user-specified)
**Rationale:** ผู้ใช้ระบุใช้ tmux เป็น session manager, tmux รองรับ detach/attach, capture-pane สำหรับอ่าน output, และ pipe-pane สำหรับ stream output แบบ real-time
**Alternatives:** ไม่มี — user requirement

## 3. Backend Runtime

**Decision:** Node.js + Express
**Rationale:** Same ecosystem กับ React frontend, child_process module สำหรับ tmux commands, ws library สำหรับ WebSocket, simple และ lightweight
**Alternatives:**
- Go — performance ดีกว่าแต่ต่าง ecosystem, เพิ่ม complexity ในการ develop
- Python (FastAPI) — ได้แต่ต่าง ecosystem เช่นกัน
- Bun/Deno — ยังไม่ stable เท่า Node.js สำหรับ child_process use cases

## 4. Frontend Framework Setup

**Decision:** React + Vite
**Rationale:** Vite เร็วกว่า CRA, modern tooling, HMR ดี, ผู้ใช้ระบุ React
**Alternatives:**
- Next.js — SSR ไม่จำเป็นสำหรับ local tool
- CRA — deprecated, ช้า

## 5. tmux Output Streaming Approach

**Decision:** `tmux pipe-pane` → named pipe → Node.js read stream → WebSocket
**Rationale:** `pipe-pane` ส่ง output ของ pane ไปยัง command/file แบบ real-time, ใช้ named pipe (FIFO) ให้ Node.js อ่านเป็น stream ได้ทันที ไม่ต้อง polling
**Alternatives:**
- `tmux capture-pane` + polling — ไม่ real-time, ต้อง poll ทุก N ms
- PTY spawning โดยตรง (node-pty) — ข้าม tmux ไปเลย แต่ user ต้องการใช้ tmux
- `script` command — ไม่ portable เท่า tmux pipe-pane
