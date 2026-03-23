import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";
import * as sessionManager from "../services/session-manager.js";
import { ALLOWED_ORIGIN, PORT } from "../config.js";
import type { WsMessage, WsClientMessage } from "../types.js";
import * as tmux from "../services/tmux.js";

const ALLOWED_ORIGINS = new Set([
  ALLOWED_ORIGIN,
  `http://localhost:${PORT}`,
]);

export function handleWebSocketUpgrade(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const origin = request.headers.origin;
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      socket.destroy();
      return;
    }

    const url = new URL(request.url ?? "", `http://${request.headers.host}`);
    const match = url.pathname.match(/^\/stream\/sessions\/([^/]+)$/);

    if (!match) {
      console.log(`[WS] REJECTED: path mismatch (${url.pathname})`);
      socket.destroy();
      return;
    }

    console.log(`[WS] ACCEPTED: session=${match[1]}`);

    wss.handleUpgrade(request, socket, head, (ws) => {
      handleConnection(ws, match[1]);
    });
  });
}

function handleConnection(ws: WebSocket, sessionId: string): void {
  const session = sessionManager.getSession(sessionId);

  if (!session) {
    sendMessage(ws, { type: "error", message: "Session not found" });
    ws.close();
    return;
  }

  // Send buffered output
  const buffer = sessionManager.getOutputBuffer(sessionId);
  if (buffer) {
    sendMessage(ws, { type: "output", data: buffer });
  }

  // Send current status
  sendMessage(ws, { type: "status", status: session.status });

  if (session.status === "ended") {
    ws.close();
    return;
  }

  // Stream new output
  const removeListener = sessionManager.addOutputListener(
    sessionId,
    (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        sendMessage(ws, { type: "output", data });
      }
    },
  );

  // Poll for status changes
  const statusInterval = setInterval(() => {
    const currentStatus = sessionManager.getSessionStatus(sessionId);
    if (currentStatus === "ended") {
      sendMessage(ws, { type: "status", status: "ended" });
      clearInterval(statusInterval);
      ws.close();
    }
  }, 1000);

  const cleanup = () => {
    removeListener();
    clearInterval(statusInterval);
  };

  // Handle client→server messages (input/control)
  ws.on("message", async (raw) => {
    if (session.status === "ended") return;

    let msg: WsClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    const ALLOWED_CONTROL_KEYS = new Set([
      "C-c", "Enter", "Up", "Down", "Left", "Right",
      "Tab", "BTab", "Escape", "BSpace",
    ]);

    try {
      if (msg.type === "input") {
        await tmux.sendKeys(session.tmuxSessionName, msg.data);
      } else if (msg.type === "control" && ALLOWED_CONTROL_KEYS.has(msg.key)) {
        await tmux.sendKeys(session.tmuxSessionName, msg.key);
      } else if (msg.type === "resize" && msg.cols > 0 && msg.rows > 0) {
        await tmux.resizeWindow(session.tmuxSessionName, msg.cols, msg.rows);
      }
    } catch (err) {
      console.error(`Send keys error for session ${sessionId}:`, err);
    }
  });

  ws.on("close", cleanup);

  ws.on("error", (err) => {
    console.error(`WebSocket error for session ${sessionId}:`, err);
    cleanup();
  });
}

function sendMessage(ws: WebSocket, message: WsMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}
