import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import type { WsMessage } from "../types";

interface MiniTerminalProps {
  sessionId: string;
  status: string;
}

export function MiniTerminal({ sessionId, status }: MiniTerminalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!inner || !container) return;

    // Fixed 80x24 terminal — matches typical tmux size
    // CSS transform scales it to fit the card visually
    const term = new Terminal({
      cursorBlink: false,
      cursorStyle: "bar",
      cursorInactiveStyle: "none",
      fontSize: 13,
      lineHeight: 1.0,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      disableStdin: true,
      scrollback: 300,
      cols: 80,
      rows: 24,
      theme: {
        background: "#11111b",
        foreground: "#cdd6f4",
        cursor: "transparent",
      },
    });

    term.open(inner);

    // Scale the rendered terminal to fit the card container
    const scaleToFit = () => {
      const screen = inner.querySelector(".xterm-screen") as HTMLElement | null;
      if (!screen) return;
      const realW = screen.offsetWidth;
      const realH = screen.offsetHeight;
      if (realW === 0 || realH === 0) return;

      const scale = Math.min(container.clientWidth / realW, container.clientHeight / realH);
      inner.style.transform = `scale(${scale})`;
      inner.style.transformOrigin = "top left";
      inner.style.width = `${realW}px`;
      inner.style.height = `${realH}px`;
    };

    // Wait for xterm to render before scaling
    requestAnimationFrame(() => requestAnimationFrame(scaleToFit));

    // Read-only WebSocket — NO resize messages sent
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/stream/sessions/${sessionId}?readonly=1`;
    const ws = new WebSocket(wsUrl);

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

    const resizeObserver = new ResizeObserver(scaleToFit);
    resizeObserver.observe(container);

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
    >
      <div className="mini-terminal-inner" ref={innerRef} />
    </div>
  );
}
