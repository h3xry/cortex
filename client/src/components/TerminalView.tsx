import { useState, useEffect, useRef } from "react";
import { useTerminal } from "../hooks/useTerminal";
import { TerminalInput, type TerminalInputHandle } from "./TerminalInput";
import "@xterm/xterm/css/xterm.css";

interface TerminalViewProps {
  sessionId: string;
  folderPath: string;
  sessionEnded: boolean;
}

export function TerminalView({
  sessionId,
  folderPath,
  sessionEnded,
}: TerminalViewProps) {
  const { terminalRef, sendInput, sendControl, isUserScrolling, scrollToBottom, forceResize, connectionState, reconnect } =
    useTerminal(sessionId);
  const [showInput, setShowInput] = useState(true);
  const inputRef = useRef<TerminalInputHandle>(null);

  // Auto-focus input when user starts typing anywhere in terminal view
  // Uses capture phase to intercept BEFORE xterm.js processes the key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!showInput || sessionEnded) return;
      // Skip if any non-xterm input/textarea is focused (modals, forms, etc.)
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
        if (!active.closest(".xterm")) return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Printable character: append to input and focus, block xterm from processing
      if (e.key.length === 1) {
        e.preventDefault();
        e.stopPropagation();
        inputRef.current?.appendText(e.key);
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [showInput, sessionEnded]);

  return (
    <div className="terminal-view">
      <div className="terminal-header">
        <span className="terminal-title">{folderPath}</span>
        <div className="terminal-header-actions">
          <button
            className="terminal-mode-button"
            onClick={forceResize}
            title="Refresh terminal (resize tmux)"
          >
            ↻
          </button>
          <button
            className={`terminal-mode-button ${showInput ? "" : "active"}`}
            onClick={() => setShowInput(!showInput)}
            title={showInput ? "Read mode" : "Input mode"}
          >
            {showInput ? "👁" : "⌨"}
          </button>
          <span className="terminal-session-id">{sessionId}</span>
        </div>
      </div>
      <div className="terminal-container" ref={terminalRef} />
      {connectionState === "reconnecting" && (
        <div className="terminal-connection-overlay terminal-reconnecting">
          Reconnecting...
        </div>
      )}
      {connectionState === "failed" && (
        <div className="terminal-connection-overlay terminal-failed">
          Connection lost
          <button className="terminal-retry-button" onClick={reconnect}>
            Retry
          </button>
        </div>
      )}
      {isUserScrolling && (
        <button
          className="terminal-scroll-bottom"
          onClick={scrollToBottom}
        >
          ↓ Latest
        </button>
      )}
      {showInput && (
        <TerminalInput
          ref={inputRef}
          onSendInput={sendInput}
          onSendControl={sendControl}
          disabled={sessionEnded}
          sessionId={sessionId}
        />
      )}
    </div>
  );
}
