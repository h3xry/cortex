import type { Session } from "../types";

interface SessionListProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelect: (session: Session) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function SessionList({
  sessions,
  activeSessionId,
  onSelect,
  onDelete,
  onRefresh,
}: SessionListProps) {
  if (sessions.length === 0) return null;

  return (
    <div className="session-list">
      <div className="session-list-header">
        <h3>Sessions</h3>
        <button className="refresh-button" onClick={onRefresh} title="Refresh">
          ↻
        </button>
      </div>

      {sessions.map((session) => (
        <div
          key={session.id}
          className={`session-item ${activeSessionId === session.id ? "active" : ""}`}
          onClick={() => onSelect(session)}
        >
          <div className="session-info">
            <span
              className={`status-badge status-${session.status}`}
              title={session.status}
            />
            <span className="session-folder">
              {session.folderPath.split("/").pop()}
            </span>
          </div>
          <div className="session-meta">
            <span className="session-id">{session.id}</span>
            {session.status === "running" && (
              <button
                className="stop-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
                title="Stop session"
              >
                ■
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
