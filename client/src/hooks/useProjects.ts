import { useState, useEffect, useCallback } from "react";
import type { Project } from "../types";
import { getUnlockToken, setUnlockToken, clearUnlockToken, getAuthHeaders } from "../unlock-token";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [hasGlobalPassword, setHasGlobalPassword] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch {
      // Silent fail on poll
    }
  }, []);

  const fetchPrivateStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/private/status");
      if (res.ok) {
        const data = await res.json();
        setHasGlobalPassword(data.hasPassword);
      }
    } catch {
      // Silent fail
    }
  }, []);

  const addProject = useCallback(
    async (path: string): Promise<Project> => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ path }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const project: Project = await res.json();
      await fetchProjects();
      return project;
    },
    [fetchProjects],
  );

  const removeProject = useCallback(
    async (id: string) => {
      await fetch(`/api/projects/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      await fetchProjects();
    },
    [fetchProjects],
  );

  const setupPassword = useCallback(async (password: string) => {
    const res = await fetch("/api/private/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to set password");
    }
    setHasGlobalPassword(true);
  }, []);

  const setProjectPrivate = useCallback(
    async (id: string, isPrivate: boolean, password: string) => {
      // If no global password yet, set it first
      if (!hasGlobalPassword) {
        await setupPassword(password);
      }

      const res = await fetch(`/api/projects/${id}/private`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ isPrivate, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update privacy");
      }
      await fetchProjects();
    },
    [fetchProjects, hasGlobalPassword, setupPassword],
  );

  const unlock = useCallback(
    async (password: string) => {
      const res = await fetch("/api/private/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Unlock failed");
      }
      const data = await res.json();
      setUnlockToken(data.token);
      setUnlocked(true);
      await fetchProjects();
    },
    [fetchProjects],
  );

  const lock = useCallback(async () => {
    const token = getUnlockToken();
    if (token) {
      await fetch("/api/private/lock", {
        method: "POST",
        headers: { "X-Unlock-Token": token },
      }).catch(() => {});
    }
    clearUnlockToken();
    setUnlocked(false);
    await fetchProjects();
  }, [fetchProjects]);

  const hasPrivateProjects = hasGlobalPassword;

  useEffect(() => {
    fetchProjects();
    fetchPrivateStatus();
  }, [fetchProjects, fetchPrivateStatus]);

  return {
    projects,
    error,
    unlocked,
    hasGlobalPassword,
    hasPrivateProjects,
    addProject,
    removeProject,
    setProjectPrivate,
    unlock,
    lock,
    fetchProjects,
  };
}
