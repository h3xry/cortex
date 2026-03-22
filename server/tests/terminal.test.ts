import { describe, it, expect, afterEach } from "vitest";
import { createServer, type Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import type { WsMessage } from "../src/types.js";

describe("WebSocket terminal handler", () => {
  let server: Server;
  let wss: WebSocketServer;
  let port: number;

  const ALLOWED_ORIGIN = "http://localhost:5173";

  async function setup() {
    server = createServer();
    wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request, socket, head) => {
      const origin = request.headers.origin;
      if (origin && origin !== ALLOWED_ORIGIN) {
        socket.destroy();
        return;
      }

      const url = new URL(
        request.url ?? "",
        `http://${request.headers.host}`,
      );
      const match = url.pathname.match(/^\/ws\/sessions\/([^/]+)$/);

      if (!match) {
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        const sessionId = match[1];

        if (sessionId === "notfound") {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Session not found",
            } satisfies WsMessage),
          );
          return;
        }

        ws.send(
          JSON.stringify({
            type: "output",
            data: "hello world",
          } satisfies WsMessage),
        );

        ws.on("error", () => {});
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as { port: number }).port;
        resolve();
      });
    });
  }

  afterEach(() => {
    wss?.close();
    server?.close();
  });

  it("should reject connections to invalid paths", async () => {
    await setup();
    const ws = new WebSocket(`ws://localhost:${port}/ws/invalid`, {
      origin: ALLOWED_ORIGIN,
    });
    await expect(
      new Promise((_, reject) => {
        ws.on("error", reject);
        ws.on("open", () => reject(new Error("Should not open")));
      }),
    ).rejects.toThrow();
  });

  it("should reject connections with wrong origin", async () => {
    await setup();
    const ws = new WebSocket(`ws://localhost:${port}/ws/sessions/test`, {
      origin: "http://evil.com",
    });
    await expect(
      new Promise((_, reject) => {
        ws.on("error", reject);
        ws.on("open", () => reject(new Error("Should not open")));
      }),
    ).rejects.toThrow();
  });

  it("should send error for nonexistent session", async () => {
    await setup();
    const ws = new WebSocket(`ws://localhost:${port}/ws/sessions/notfound`, {
      origin: ALLOWED_ORIGIN,
    });
    const msg = await new Promise<WsMessage>((resolve) => {
      ws.on("message", (data) => resolve(JSON.parse(data.toString())));
    });
    expect(msg).toEqual({ type: "error", message: "Session not found" });
    ws.close();
  });

  it("should send output for existing session", async () => {
    await setup();
    const ws = new WebSocket(`ws://localhost:${port}/ws/sessions/test123`, {
      origin: ALLOWED_ORIGIN,
    });
    const msg = await new Promise<WsMessage>((resolve) => {
      ws.on("message", (data) => resolve(JSON.parse(data.toString())));
    });
    expect(msg).toEqual({ type: "output", data: "hello world" });
    ws.close();
  });

  it("should accept connections without origin header", async () => {
    await setup();
    const ws = new WebSocket(
      `ws://localhost:${port}/ws/sessions/test123`,
    );
    await new Promise<void>((resolve, reject) => {
      ws.on("open", () => resolve());
      ws.on("error", reject);
    });
    ws.close();
  });
});
