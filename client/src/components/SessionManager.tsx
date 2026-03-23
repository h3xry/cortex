import { useState, useEffect } from "react";
import { MiniTerminal } from "./MiniTerminal";
import type { Session } from "../types";

interface SessionManagerProps {
  sessions: Session[];
  onSelectSession: (session: Session) => void;
  onKillSession: (id: string) => Promise<void>;
  onRemoveSession: (id: string) => Promise<void>;
}

function formatDuration(from: string, to?: string | null): string {
  const end = to ? new Date(to).getTime() : Date.now();
  const diff = end - new Date(from).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function SessionManager({
  sessions,
  onSelectSession,
  onKillSession,
  onRemoveSession,
}: SessionManagerProps) {
  const [, setTick] = useState(0);
  const [killing, setKilling] = useState<string | null>(null);

  const hasRunning = sessions.some((s) => s.status === "running");
  useEffect(() => {
    if (!hasRunning) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [hasRunning]);

  const sorted = [...sessions].sort((a, b) => {
    if (a.status === "running" && b.status !== "running") return -1;
    if (a.status !== "running" && b.status === "running") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleKill = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Kill this session?")) return;
    setKilling(id);
    try {
      await onKillSession(id);
    } finally {
      setKilling(null);
    }
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveSession(id);
  };

  const runningCount = sorted.filter((s) => s.status === "running").length;

  return (
    <div className="sm-container">
      <div className="sm-header">
        <h2>Sessions</h2>
        {sorted.length > 0 && (
          <span className="sm-summary">
            {runningCount} running / {sorted.length} total
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="sm-empty">
          <div className="sm-empty-icon">~</div>
          <p>No active sessions</p>
          <p className="sm-empty-hint">
            Launch a session from a project to get started
          </p>
        </div>
      ) : (
        <div className="sm-grid">
          {sorted.map((session) => (
            <div
              key={session.id}
              className={`sm-card ${session.status === "running" ? "sm-card-running" : "sm-card-ended"}`}
              onClick={() => onSelectSession(session)}
            >
              <div className="sm-card-header">
                <div className="sm-card-status">
                  <span className={`sm-dot sm-dot-${session.status}`} />
                  <span className="sm-card-project">
                    {session.projectName ?? session.folderPath.split("/").pop()}
                  </span>
                </div>
                <div className="sm-card-actions">
                  <span className="sm-card-duration">
                    {session.status === "running"
                      ? formatDuration(session.createdAt)
                      : formatDuration(session.createdAt, session.endedAt)}
                  </span>
                  {session.status === "running" ? (
                    <button
                      className="sm-btn-kill"
                      onClick={(e) => handleKill(session.id, e)}
                      disabled={killing === session.id}
                      title="Kill session"
                    >
                      {killing === session.id ? "..." : "Kill"}
                    </button>
                  ) : (
                    <button
                      className="sm-btn-remove"
                      onClick={(e) => handleRemove(session.id, e)}
                      title="Remove session"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <MiniTerminal sessionId={session.id} status={session.status} />

              <div className="sm-card-footer">
                <span className="sm-card-id">{session.id.slice(0, 8)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
