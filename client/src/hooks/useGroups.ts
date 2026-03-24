import { useState, useEffect, useCallback } from "react";
import type { Group } from "../types";
import { getAuthHeaders } from "../unlock-token";

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/groups", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const createGroup = useCallback(async (data: { name: string; icon: string; color: string }) => {
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? "Failed to create group"); }
    await fetchGroups();
  }, [fetchGroups]);

  const updateGroup = useCallback(async (id: string, data: Partial<Pick<Group, "name" | "icon" | "color">>) => {
    const res = await fetch(`/api/groups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? "Failed to update group"); }
    await fetchGroups();
  }, [fetchGroups]);

  const deleteGroup = useCallback(async (id: string) => {
    const res = await fetch(`/api/groups/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? "Failed to delete group"); }
    await fetchGroups();
  }, [fetchGroups]);

  const reorderGroups = useCallback(async (order: string[]) => {
    const res = await fetch("/api/groups/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ order }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? "Failed to reorder"); }
    await fetchGroups();
  }, [fetchGroups]);

  const assignProjectGroup = useCallback(async (projectId: string, groupId: string | null) => {
    const res = await fetch(`/api/projects/${projectId}/group`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ groupId }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? "Failed to assign group"); }
  }, []);

  return { groups, fetchGroups, createGroup, updateGroup, deleteGroup, reorderGroups, assignProjectGroup };
}
