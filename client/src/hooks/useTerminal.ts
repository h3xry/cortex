import { useEffect, useRef, useCallback, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import type { WsMessage, WsClientMessage } from "../types";
import { getUnlockToken } from "../unlock-token";

export type ConnectionState = "connected" | "reconnecting" | "failed";

const MAX_RECONNECT_RETRIES = 5;
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 10_000;

export function useTerminal(sessionId: string) {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const userScrollingRef = useRef(false);
  const reconnectRef = useRef<(() => void) | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connected");

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
    fitAddonRef.current = fitAddon;

    // Track if user has scrolled away from bottom
    let writingData = false; // flag to ignore scroll events caused by term.write

    const checkIfAtBottom = () => {
      const viewport = terminalRef.current?.querySelector(".xterm-viewport") as HTMLElement | null;
      if (!viewport) return true;
      const atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 10;
      userScrollingRef.current = !atBottom;
      setIsUserScrolling(!atBottom);
      return atBottom;
    };

    // Watch viewport scroll to detect user scrolling
    const viewport = terminalRef.current.querySelector(".xterm-viewport") as HTMLElement | null;
    const onViewportScroll = () => {
      if (writingData) return; // ignore scroll events from term.write
      checkIfAtBottom();
    };
    viewport?.addEventListener("scroll", onViewportScroll, { passive: true });

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

    // --- WebSocket connection with reconnect logic ---
    let intentionalClose = false;
    let retryCount = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let sessionEnded = false;
    let isReconnect = false;

    const writeWithoutAutoScroll = (data: string) => {
      writingData = true;
      if (userScrollingRef.current && viewport) {
        const savedScroll = viewport.scrollTop;
        term.write(data, () => {
          viewport.scrollTop = savedScroll;
          writingData = false;
        });
      } else {
        term.write(data, () => {
          writingData = false;
        });
      }
    };

    // Register onResize once — uses wsRef to always reference the current WS
    term.onResize(({ cols, rows }) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "resize", cols, rows }));
      }
    });

    const connectWs = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const token = getUnlockToken();
      const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
      const wsUrl = `${protocol}//${window.location.host}/stream/sessions/${sessionId}${tokenParam}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`[WS] Connected to session ${sessionId}`);
        // Clear terminal on reconnect — server sends fresh buffer
        if (isReconnect) {
          term.clear();
        }
        retryCount = 0;
        setConnectionState("connected");
        // Sync tmux size with xterm on connect
        fitAddon.fit();
        const { cols, rows } = term;
        ws.send(JSON.stringify({ type: "resize", cols, rows }));
      };

      ws.onerror = (event) => {
        console.error(`[WS] Error for session ${sessionId}:`, event);
      };

      ws.onclose = (event) => {
        console.log(`[WS] Closed for session ${sessionId}: code=${event.code}`);
        wsRef.current = null;

        if (intentionalClose || sessionEnded) return;

        // Attempt reconnect with exponential backoff
        retryCount++;
        if (retryCount <= MAX_RECONNECT_RETRIES) {
          const delay = Math.min(BACKOFF_BASE_MS * Math.pow(2, retryCount - 1), BACKOFF_MAX_MS);
          console.log(`[WS] Reconnecting in ${delay}ms (attempt ${retryCount}/${MAX_RECONNECT_RETRIES})`);
          setConnectionState("reconnecting");
          reconnectTimer = setTimeout(() => {
            if (intentionalClose) return;
            isReconnect = true;
            connectWs();
          }, delay);
        } else {
          console.log(`[WS] Max retries reached for session ${sessionId}`);
          setConnectionState("failed");
        }
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
            writeWithoutAutoScroll(msg.data);
            break;
          case "status":
            if (msg.status === "ended") {
              sessionEnded = true;
              writeWithoutAutoScroll("\r\n\x1b[90m--- Session ended ---\x1b[0m\r\n");
            }
            break;
          case "error":
            writeWithoutAutoScroll(`\r\n\x1b[31mError: ${msg.message}\x1b[0m\r\n`);
            break;
        }
      };
    };

    // Expose manual reconnect for retry button
    reconnectRef.current = () => {
      if (intentionalClose || sessionEnded) return;
      retryCount = 0;
      isReconnect = true;
      setConnectionState("reconnecting");
      connectWs();
    };

    // Initial connection
    connectWs();

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
      intentionalClose = true;
      reconnectRef.current = null;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      touchCleanup?.();
      viewport?.removeEventListener("scroll", onViewportScroll);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
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

  const scrollToBottom = useCallback(() => {
    termRef.current?.scrollToBottom();
    userScrollingRef.current = false;
    setIsUserScrolling(false);
  }, []);

  const forceResize = useCallback(() => {
    if (fitAddonRef.current && termRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
      fitAddonRef.current.fit();
      const { cols, rows } = termRef.current;
      wsRef.current.send(JSON.stringify({ type: "resize", cols, rows }));
    }
  }, []);

  const reconnect = useCallback(() => {
    reconnectRef.current?.();
  }, []);

  return { terminalRef, sendInput, sendControl, isUserScrolling, scrollToBottom, forceResize, connectionState, reconnect };
}
