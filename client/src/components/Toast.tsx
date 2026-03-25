import { useEffect, useState } from "react";
import type { NotificationEvent } from "../types";
import { NOTIFICATION_COLORS, NOTIFICATION_LABELS } from "../services/notification";

interface ToastProps {
  event: NotificationEvent;
  onDismiss: () => void;
  onClick: () => void;
}

export function Toast({ event, onDismiss, onClick }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const color = NOTIFICATION_COLORS[event.type];
  const label = NOTIFICATION_LABELS[event.type];

  return (
    <div
      className={`toast ${exiting ? "toast-exit" : "toast-enter"}`}
      style={{ borderLeftColor: color }}
      onClick={onClick}
    >
      <div className="toast-header">
        <span className="toast-label" style={{ color }}>{label}</span>
        <button
          className="toast-close"
          onClick={(e) => { e.stopPropagation(); setExiting(true); setTimeout(onDismiss, 300); }}
        >
          ×
        </button>
      </div>
      <div className="toast-title">{event.title}</div>
      <div className="toast-message">{event.message}</div>
    </div>
  );
}
