import { Toast } from "./Toast";
import type { NotificationEvent } from "../types";

interface ToastContainerProps {
  toasts: NotificationEvent[];
  onDismiss: (id: string) => void;
  onNavigate: (event: NotificationEvent) => void;
}

export function ToastContainer({ toasts, onDismiss, onNavigate }: ToastContainerProps) {
  // Show max 3 toasts
  const visible = toasts.slice(0, 3);

  if (visible.length === 0) return null;

  return (
    <div className="toast-container">
      {visible.map((event) => (
        <Toast
          key={event.id}
          event={event}
          onDismiss={() => onDismiss(event.id)}
          onClick={() => { onDismiss(event.id); onNavigate(event); }}
        />
      ))}
    </div>
  );
}
