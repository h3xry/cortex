import { useState, useCallback, useEffect } from "react";
import type { GitChange, GitDiff } from "../types";

interface GitStatusState {
  isGitRepo: boolean;
  branch: string | null;
  changes: GitChange[];
  loading: boolean;
}

export function useGitStatus(projectId: string) {
  const [status, setStatus] = useState<GitStatusState>({
    isGitRepo: false,
    branch: null,
    changes: [],
    loading: false,
  });
  const [selectedDiff, setSelectedDiff] = useState<GitDiff | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    setStatus((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch(`/api/projects/${projectId}/git/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus({
          isGitRepo: data.isGitRepo,
          branch: data.branch,
          changes: data.changes,
          loading: false,
        });
      }
    } catch {
      setStatus((s) => ({ ...s, loading: false }));
    }
  }, [projectId]);

  const fetchDiff = useCallback(
    async (filePath: string) => {
      setDiffLoading(true);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/git/diff?file=${encodeURIComponent(filePath)}`,
        );
        if (res.ok) {
          const data: GitDiff = await res.json();
          setSelectedDiff(data);
        }
      } catch {
        setSelectedDiff(null);
      } finally {
        setDiffLoading(false);
      }
    },
    [projectId],
  );

  const clearDiff = useCallback(() => {
    setSelectedDiff(null);
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    ...status,
    selectedDiff,
    diffLoading,
    fetchStatus,
    fetchDiff,
    clearDiff,
  };
}
