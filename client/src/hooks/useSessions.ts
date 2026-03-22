import { useState, useEffect, useCallback } from "react";
import type { Session } from "../types";

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refreshSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
        setError(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch sessions",
      );
    }
  }, []);

  const createSession = useCallback(
    async (folderPath: string): Promise<Session> => {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderPath }),
      });
      if (!res.ok) {
        const text = await res.text();
        let parsed: { error?: string } = {};
        try {
          parsed = JSON.parse(text);
        } catch {
          // non-JSON response
        }
        throw new Error(parsed.error ?? `HTTP ${res.status}`);
      }
      const session: Session = await res.json();
      await refreshSessions();
      return session;
    },
    [refreshSessions],
  );

  const deleteSession = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        let parsed: { error?: string } = {};
        try {
          parsed = JSON.parse(text);
        } catch {
          // non-JSON response
        }
        throw new Error(parsed.error ?? `HTTP ${res.status}`);
      }
      await refreshSessions();
    },
    [refreshSessions],
  );

  useEffect(() => {
    refreshSessions();
    const interval = setInterval(refreshSessions, 3000);
    return () => clearInterval(interval);
  }, [refreshSessions]);

  return { sessions, error, createSession, deleteSession, refreshSessions };
}
