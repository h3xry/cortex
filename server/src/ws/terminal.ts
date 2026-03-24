import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";
import * as sessionManager from "../services/session-manager.js";
import * as projectStore from "../services/project-store.js";
import { isValidToken } from "../services/unlock-store.js";
import { ALLOWED_ORIGINS, PORT } from "../config.js";
import type { WsMessage, WsClientMessage } from "../types.js";
import * as tmux from "../services/tmux.js";

const WS_ALLOWED_ORIGINS = new Set([
  ...ALLOWED_ORIGINS,
  `http://localhost:${PORT}`,
]);

export function handleWebSocketUpgrade(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", async (request, socket, head) => {
    const origin = request.headers.origin;
    if (origin && !WS_ALLOWED_ORIGINS.has(origin)) {
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

    const readonly = url.searchParams.get("readonly") === "1";
    const token = url.searchParams.get("token");

    // Check if session belongs to a private project
    const sessionId = match[1];
    const session = sessionManager.getSession(sessionId);
    if (session) {
      const privatePaths = await projectStore.getPrivateProjectPaths();
      if (privatePaths.has(session.folderPath)) {
        if (!token || !isValidToken(token)) {
          console.log(`[WS] REJECTED: private session ${sessionId}, no valid token`);
          socket.destroy();
          return;
        }
      }
    }

    console.log(`[WS] ACCEPTED: session=${sessionId}${readonly ? " (readonly)" : ""}`);

    wss.handleUpgrade(request, socket, head, (ws) => {
      handleConnection(ws, sessionId, readonly);
    });
  });
}

function handleConnection(ws: WebSocket, sessionId: string, readonly = false): void {
  const session = sessionManager.getSession(sessionId);

  if (!session) {
    sendMessage(ws, { type: "error", message: "Session not found" });
    ws.close();
    return;
  }

  // Send current status
  sendMessage(ws, { type: "status", status: session.status });

  if (session.status === "ended") {
    ws.close();
    return;
  }

  // Send buffered output so client sees terminal history immediately on connect.
  // This is raw PTY data (not capture-pane), so xterm.js reflows it at any width.
  const buffer = sessionManager.getOutputBuffer(sessionId);
  if (buffer) {
    sendMessage(ws, { type: "output", data: buffer });
  }

  // Stream live output
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

  // Heartbeat: ping every 30s, terminate after 2 missed pongs
  let missedPongs = 0;
  const pingInterval = setInterval(() => {
    if (missedPongs >= 2) {
      console.log(`[WS] Dead connection detected for session ${sessionId}, terminating`);
      ws.terminate();
      return;
    }
    missedPongs++;
    ws.ping();
  }, 30_000);

  ws.on("pong", () => {
    missedPongs = 0;
  });

  const cleanup = () => {
    removeListener();
    clearInterval(statusInterval);
    clearInterval(pingInterval);
  };

  // Handle client→server messages (input/control/resize)
  // Readonly connections only receive output — ignore all input
  ws.on("message", async (raw) => {
    if (readonly) return;
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
        // Send a space then backspace to force Claude Code to re-render
        // This triggers pipe-pane to capture fresh output at new size
        setTimeout(async () => {
          try {
            await tmux.sendKeys(session.tmuxSessionName, " ");
            await tmux.sendKeys(session.tmuxSessionName, "BSpace");
          } catch {
            // ignore
          }
        }, 200);
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
