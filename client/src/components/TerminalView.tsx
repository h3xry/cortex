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
  const { terminalRef, sendInput, sendControl } = useTerminal(sessionId);

  return (
    <div className="terminal-view">
      <div className="terminal-header">
        <span className="terminal-title">{folderPath}</span>
        <span className="terminal-session-id">ID: {sessionId}</span>
      </div>
      <div className="terminal-container" ref={terminalRef} />
      <TerminalInput
        onSendInput={sendInput}
        onSendControl={sendControl}
        disabled={sessionEnded}
      />
    </div>
  );
}
