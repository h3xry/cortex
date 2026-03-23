import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import type { WsMessage } from "../types";

interface MiniTerminalProps {
  sessionId: string;
  status: string;
}

export function MiniTerminal({ sessionId, status }: MiniTerminalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: false,
      cursorStyle: "bar",
      cursorInactiveStyle: "none",
      fontSize: 10,
      lineHeight: 1.1,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      disableStdin: true,
      scrollback: 200,
      theme: {
        background: "#11111b",
        foreground: "#cdd6f4",
        cursor: "transparent",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    // Connect to the same WebSocket stream (read-only)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/stream/sessions/${sessionId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      fitAddon.fit();
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

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      ws.close();
      term.dispose();
    };
  }, [sessionId]);

  return (
    <div
      className={`mini-terminal ${status !== "running" ? "mini-terminal-ended" : ""}`}
      ref={containerRef}
    />
  );
}
