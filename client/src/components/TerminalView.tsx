import { useTerminal } from "../hooks/useTerminal";
import "@xterm/xterm/css/xterm.css";

interface TerminalViewProps {
  sessionId: string;
  folderPath: string;
}

export function TerminalView({ sessionId, folderPath }: TerminalViewProps) {
  const { terminalRef } = useTerminal(sessionId);

  return (
    <div className="terminal-view">
      <div className="terminal-header">
        <span className="terminal-title">{folderPath}</span>
        <span className="terminal-session-id">ID: {sessionId}</span>
      </div>
      <div className="terminal-container" ref={terminalRef} />
    </div>
  );
}
