import { useState, useEffect, useCallback } from "react";
import type { Plan, PlanTask, PlanMilestone, PlanSprint, TaskStatus } from "../types";
import { getAuthHeaders } from "../unlock-token";

const EMPTY_PLAN: Plan = { tasks: [], milestones: [], sprints: [] };

export function usePlan(projectId: string | null) {
  const [plan, setPlan] = useState<Plan>(EMPTY_PLAN);
  const [loading, setLoading] = useState(false);

  const fetchPlan = useCallback(async () => {
    if (!projectId) { setPlan(EMPTY_PLAN); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/plan`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const addTask = useCallback(async (data: {
    title: string; tags?: string[]; status?: TaskStatus; effort?: string;
    subTasks?: { title: string; done: boolean; effort?: string | null }[];
  }) => {
    if (!projectId) return;
    const res = await fetch(`/api/projects/${projectId}/plan/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error ?? "Failed to add task");
    }
    await fetchPlan();
  }, [projectId, fetchPlan]);

  const updateTask = useCallback(async (taskId: string, data: Partial<PlanTask>) => {
    if (!projectId) return;
    const res = await fetch(`/api/projects/${projectId}/plan/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error ?? "Failed to update task");
    }
    await fetchPlan();
  }, [projectId, fetchPlan]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!projectId) return;
    const res = await fetch(`/api/projects/${projectId}/plan/tasks/${taskId}`, {
      method: "DELETE", headers: getAuthHeaders(),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? "Failed to delete task"); }
    await fetchPlan();
  }, [projectId, fetchPlan]);

  const addMilestone = useCallback(async (data: { title: string; deadline: string; taskRefs?: string[] }) => {
    if (!projectId) return;
    const res = await fetch(`/api/projects/${projectId}/plan/milestones`, {
      method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? "Failed to add milestone"); }
    await fetchPlan();
  }, [projectId, fetchPlan]);

  const updateMilestone = useCallback(async (msId: string, data: Partial<PlanMilestone>) => {
    if (!projectId) return;
    const res = await fetch(`/api/projects/${projectId}/plan/milestones/${msId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? "Failed to update milestone"); }
    await fetchPlan();
  }, [projectId, fetchPlan]);

  const deleteMilestone = useCallback(async (msId: string) => {
    if (!projectId) return;
    const res = await fetch(`/api/projects/${projectId}/plan/milestones/${msId}`, {
      method: "DELETE", headers: getAuthHeaders(),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? "Failed to delete milestone"); }
    await fetchPlan();
  }, [projectId, fetchPlan]);

  const addSprint = useCallback(async (data: { title: string; startDate: string; endDate: string; taskRefs?: string[] }) => {
    if (!projectId) return;
    const res = await fetch(`/api/projects/${projectId}/plan/sprints`, {
      method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? "Failed to add sprint"); }
    await fetchPlan();
  }, [projectId, fetchPlan]);

  const updateSprint = useCallback(async (spId: string, data: Partial<PlanSprint>) => {
    if (!projectId) return;
    const res = await fetch(`/api/projects/${projectId}/plan/sprints/${spId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? "Failed to update sprint"); }
    await fetchPlan();
  }, [projectId, fetchPlan]);

  const deleteSprint = useCallback(async (spId: string) => {
    if (!projectId) return;
    const res = await fetch(`/api/projects/${projectId}/plan/sprints/${spId}`, {
      method: "DELETE", headers: getAuthHeaders(),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? "Failed to delete sprint"); }
    await fetchPlan();
  }, [projectId, fetchPlan]);

  return {
    plan, loading, fetchPlan,
    addTask, updateTask, deleteTask,
    addMilestone, updateMilestone, deleteMilestone,
    addSprint, updateSprint, deleteSprint,
  };
}
