import { useState, useRef, useCallback, useEffect } from "react";
import type { Session, NotificationEvent, NotificationType } from "../types";
import {
  isEventEnabled,
  playSound,
  sendBrowserNotification,
  getSettings,
} from "../services/notification";

const MAX_HISTORY = 50;

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function useNotifications(sessions: Session[], selectedProjectId: string | null) {
  const [toasts, setToasts] = useState<NotificationEvent[]>([]);
  const [history, setHistory] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const prevSessionsRef = useRef<Map<string, { status: string; activityStatus: string }>>(new Map());
  const longRunningAlerted = useRef<Set<string>>(new Set());

  const fireNotification = useCallback((event: NotificationEvent) => {
    // Add to toasts
    setToasts((prev) => [event, ...prev].slice(0, 3));

    // Add to history
    setHistory((prev) => [event, ...prev].slice(0, MAX_HISTORY));
    setUnreadCount((prev) => prev + 1);

    // Play sound
    playSound(event.type);

    // Browser notification
    sendBrowserNotification(event);
  }, []);

  const createEvent = useCallback(
    (
      type: NotificationType,
      session: Session,
      title: string,
      message: string,
    ): NotificationEvent => ({
      id: makeId(),
      type,
      projectId: session.folderPath,
      projectName: session.projectName || session.folderPath.split("/").pop() || "Unknown",
      sessionId: session.id,
      title,
      message,
      targetUrl: session.folderPath,
      timestamp: new Date().toISOString(),
      read: false,
    }),
    [],
  );

  // Detect state changes
  useEffect(() => {
    const prevMap = prevSessionsRef.current;
    const settings = getSettings();

    for (const session of sessions) {
      const prev = prevMap.get(session.id);
      const currStatus = session.status;
      const currActivity = session.activity?.status || "unknown";
      const projectId = session.folderPath;

      if (!prev) {
        // First time seeing this session — just record, don't fire
        continue;
      }

      // Session completed (running → ended + done)
      if (prev.status === "running" && currStatus === "ended" && currActivity === "done") {
        if (isEventEnabled(projectId, "session_completed")) {
          const name = session.projectName || "Session";
          fireNotification(
            createEvent("session_completed", session, "Session Completed", `${name} finished successfully`),
          );
        }
      }

      // Session error (running → ended + error)
      if (prev.status === "running" && currStatus === "ended" && currActivity === "error") {
        if (isEventEnabled(projectId, "session_error")) {
          const name = session.projectName || "Session";
          fireNotification(
            createEvent("session_error", session, "Session Error", `${name} ended with an error`),
          );
        }
      }

      // Waiting for input (!help → help)
      if (prev.activityStatus !== "help" && currActivity === "help") {
        if (isEventEnabled(projectId, "waiting_input")) {
          const name = session.projectName || "Session";
          fireNotification(
            createEvent("waiting_input", session, "Waiting for Input", `${name} needs your response`),
          );
        }
      }

      // Long-running check
      if (currStatus === "running" && !longRunningAlerted.current.has(session.id)) {
        const runningMs = Date.now() - new Date(session.createdAt).getTime();
        if (runningMs > settings.longRunningThreshold) {
          if (isEventEnabled(projectId, "long_running")) {
            const mins = Math.floor(runningMs / 60000);
            const name = session.projectName || "Session";
            fireNotification(
              createEvent("long_running", session, "Long Running Session", `${name} running for ${mins}+ minutes`),
            );
            longRunningAlerted.current.add(session.id);
          }
        }
      }
    }

    // Update prev state
    const newMap = new Map<string, { status: string; activityStatus: string }>();
    for (const session of sessions) {
      newMap.set(session.id, {
        status: session.status,
        activityStatus: session.activity?.status || "unknown",
      });
    }
    prevSessionsRef.current = newMap;

    // Clean up ended sessions from longRunningAlerted
    for (const id of longRunningAlerted.current) {
      if (!sessions.find((s) => s.id === id && s.status === "running")) {
        longRunningAlerted.current.delete(id);
      }
    }
  }, [sessions, fireNotification, createEvent]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setHistory((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setUnreadCount(0);
  }, []);

  return {
    toasts,
    history,
    unreadCount,
    dismissToast,
    markAllRead,
    clearHistory,
  };
}
