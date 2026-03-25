import type { NotificationEvent } from "../types";
import { NOTIFICATION_COLORS } from "../services/notification";

interface NotificationPanelProps {
  history: NotificationEvent[];
  onClear: () => void;
  onNavigate: (event: NotificationEvent) => void;
  onMarkAllRead: () => void;
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationPanel({ history, onClear, onNavigate, onMarkAllRead }: NotificationPanelProps) {
  return (
    <div className="notification-panel">
      <div className="notification-panel-header">
        <span>Notifications</span>
        <div style={{ display: "flex", gap: 8 }}>
          {history.some((n) => !n.read) && (
            <button className="notification-panel-clear" onClick={onMarkAllRead}>
              Mark read
            </button>
          )}
          {history.length > 0 && (
            <button className="notification-panel-clear" onClick={onClear}>
              Clear all
            </button>
          )}
        </div>
      </div>
      <div className="notification-panel-list">
        {history.length === 0 ? (
          <div className="notification-panel-empty">No notifications yet</div>
        ) : (
          history.map((event) => (
            <div
              key={event.id}
              className={`notification-panel-item ${event.read ? "" : "unread"}`}
              onClick={() => onNavigate(event)}
            >
              <div
                className="notification-panel-dot"
                style={{ backgroundColor: NOTIFICATION_COLORS[event.type] }}
              />
              <div className="notification-panel-content">
                <div className="notification-panel-title">{event.title}</div>
                <div className="notification-panel-msg">{event.message}</div>
                <div className="notification-panel-time">{timeAgo(event.timestamp)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
