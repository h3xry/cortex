import { useState } from "react";
import { useTerminal } from "../hooks/useTerminal";
import { TerminalInput } from "./TerminalInput";
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
          onSendInput={sendInput}
          onSendControl={sendControl}
          disabled={sessionEnded}
        />
      )}
    </div>
  );
}
