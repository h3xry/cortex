import { useState, useCallback } from "react";
import type { RetroEntry, LessonEntry } from "../types";
import { getAuthHeaders } from "../unlock-token";

type ActiveTab = "retros" | "lessons" | "starred";

const STARRED_KEY = "cortex-starred-retros";

function loadStarred(): Set<string> {
  try {
    const raw = localStorage.getItem(STARRED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveStarred(set: Set<string>): void {
  localStorage.setItem(STARRED_KEY, JSON.stringify([...set]));
}

export function useRetros() {
  const [retros, setRetros] = useState<RetroEntry[]>([]);
  const [lessons, setLessons] = useState<LessonEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("retros");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [selectedRetro, setSelectedRetro] = useState<RetroEntry | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LessonEntry | null>(null);
  const [starred, setStarred] = useState<Set<string>>(loadStarred);

  const fetchRetros = useCallback(async (projectId?: string | null) => {
    setLoading(true);
    try {
      const params = projectId ? `?project=${projectId}` : "";
      const res = await fetch(`/api/retros${params}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRetros(data.retros);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLessons = useCallback(async (projectId?: string | null) => {
    setLoading(true);
    try {
      const params = projectId ? `?project=${projectId}` : "";
      const res = await fetch(`/api/lessons${params}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setLessons(data.lessons);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const switchTab = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    setSelectedRetro(null);
    setSelectedLesson(null);
  }, []);

  const filterByProject = useCallback((projectId: string | null) => {
    setProjectFilter(projectId);
    setSelectedRetro(null);
    setSelectedLesson(null);
  }, []);

  const toggleStar = useCallback((id: string) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveStarred(next);
      return next;
    });
  }, []);

  const isStarred = useCallback((id: string) => starred.has(id), [starred]);

  return {
    retros,
    lessons,
    loading,
    activeTab,
    projectFilter,
    selectedRetro,
    selectedLesson,
    fetchRetros,
    fetchLessons,
    switchTab,
    filterByProject,
    setSelectedRetro,
    setSelectedLesson,
    starred,
    toggleStar,
    isStarred,
  };
}
