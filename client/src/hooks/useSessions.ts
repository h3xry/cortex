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
        // Only update state if data actually changed (prevent unnecessary re-renders)
        setSessions((prev) => {
          const next = data.sessions;
          if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
          return next;
        });
        setError(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch sessions",
      );
    }
  }, []);

  const createSession = useCallback(
    async (
      folderPath: string,
      allowedTools?: string[],
      continueConversation?: boolean,
    ): Promise<Session> => {
      const body: Record<string, unknown> = { folderPath };
      if (allowedTools) body.allowedTools = allowedTools;
      if (continueConversation) body.continueConversation = true;

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
