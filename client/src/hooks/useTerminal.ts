import { useEffect, useRef, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import type { WsMessage, WsClientMessage } from "../types";

export function useTerminal(sessionId: string) {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      theme: {
        background: "#1e1e2e",
        foreground: "#cdd6f4",
        cursor: "#f5e0dc",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    termRef.current = term;

    // On mobile: touch scroll using xterm's scrollLines API
    const isMobile = window.matchMedia("(max-width: 1024px)").matches;
    let touchCleanup: (() => void) | null = null;
    if (isMobile) {
      let lastY = 0;
      let lastTime = 0;
      let velocity = 0;
      let momentumId = 0;
      const lineHeight = 18; // approximate px per terminal line

      const onTouchStart = (e: TouchEvent) => {
        e.stopPropagation();
        e.preventDefault();
        cancelAnimationFrame(momentumId);
        lastY = e.touches[0].clientY;
        lastTime = Date.now();
        velocity = 0;
      };

      const onTouchMove = (e: TouchEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const y = e.touches[0].clientY;
        const deltaY = lastY - y; // positive = scroll down
        const now = Date.now();
        const dt = now - lastTime;
        if (dt > 0) {
          velocity = deltaY / dt;
        }
        const lines = Math.round(deltaY / lineHeight);
        if (lines !== 0) {
          term.scrollLines(lines);
          lastY = y;
        }
        lastTime = now;
      };

      const onTouchEnd = (e: TouchEvent) => {
        e.stopPropagation();
        e.preventDefault();
        // Momentum scroll using velocity
        const decel = 0.95;
        const tick = () => {
          velocity *= decel;
          if (Math.abs(velocity) < 0.005) return;
          const lines = Math.round(velocity * 16 / lineHeight);
          if (lines !== 0) {
            term.scrollLines(lines);
          }
          momentumId = requestAnimationFrame(tick);
        };
        momentumId = requestAnimationFrame(tick);
      };

      const container = terminalRef.current;
      container.addEventListener("touchstart", onTouchStart, { capture: true });
      container.addEventListener("touchmove", onTouchMove, { capture: true });
      container.addEventListener("touchend", onTouchEnd, { capture: true });

      touchCleanup = () => {
        cancelAnimationFrame(momentumId);
        container.removeEventListener("touchstart", onTouchStart, { capture: true });
        container.removeEventListener("touchmove", onTouchMove, { capture: true });
        container.removeEventListener("touchend", onTouchEnd, { capture: true });
      };
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/stream/sessions/${sessionId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`[WS] Connected to session ${sessionId}`);
      // Sync tmux size with xterm on connect
      fitAddon.fit();
      const { cols, rows } = term;
      ws.send(JSON.stringify({ type: "resize", cols, rows }));
    };

    ws.onerror = (event) => {
      console.error(`[WS] Error for session ${sessionId}:`, event);
      term.write("\r\n\x1b[31mWebSocket connection error\x1b[0m\r\n");
    };

    ws.onclose = (event) => {
      console.log(`[WS] Closed for session ${sessionId}: code=${event.code}`);
    };

    ws.onmessage = (event) => {
      let msg: WsMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      switch (msg.type) {
        case "output":
          term.write(msg.data);
          break;
        case "status":
          if (msg.status === "ended") {
            term.write("\r\n\x1b[90m--- Session ended ---\x1b[0m\r\n");
          }
          break;
        case "error":
          term.write(`\r\n\x1b[31mError: ${msg.message}\x1b[0m\r\n`);
          break;
      }
    };

    // Send resize to tmux when terminal size changes
    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols, rows }));
      }
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener("resize", handleResize);

    // Also watch container size changes (tab switch, panel resize)
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    // Initial resize to sync tmux with xterm size
    setTimeout(() => {
      fitAddon.fit();
    }, 100);

    return () => {
      touchCleanup?.();
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      ws.close();
      term.dispose();
    };
  }, [sessionId]);

  const sendMessage = useCallback((msg: WsClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const sendInput = useCallback(
    (text: string) => {
      sendMessage({ type: "input", data: text });
    },
    [sendMessage],
  );

  const sendControl = useCallback(
    (key: string) => {
      sendMessage({ type: "control", key });
    },
    [sendMessage],
  );

  return { terminalRef, sendInput, sendControl };
}
