import { useState, useCallback } from "react";
import type { Commit, CommitFile, Branch, GitDiff } from "../types";

export function useGitHistory(projectId: string | null) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [commitFiles, setCommitFiles] = useState<CommitFile[]>([]);
  const [commitDiff, setCommitDiff] = useState<GitDiff | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [diffLoading, setDiffLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchLog = useCallback(async (skip = 0) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/git/log?limit=50&skip=${skip}`);
      if (!res.ok) return;
      const data = await res.json();
      if (skip === 0) {
        setCommits(data.commits);
      } else {
        setCommits((prev) => [...prev, ...data.commits]);
      }
      setHasMore(data.commits.length === 50);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    fetchLog(commits.length);
  }, [fetchLog, commits.length, loading, hasMore]);

  const selectCommit = useCallback(async (commit: Commit) => {
    if (!projectId) return;
    setSelectedCommit(commit);
    setCommitDiff(null);
    setFilesLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/git/commits/${commit.hash}/files`);
      if (!res.ok) return;
      const data = await res.json();
      setCommitFiles(data.files);
      if (data.commit) setSelectedCommit(data.commit);
    } finally {
      setFilesLoading(false);
    }
  }, [projectId]);

  const fetchCommitDiff = useCallback(async (hash: string, filePath: string) => {
    if (!projectId) return;
    setDiffLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/git/commits/${hash}/diff?file=${encodeURIComponent(filePath)}`);
      if (!res.ok) return;
      const data = await res.json();
      setCommitDiff(data);
    } finally {
      setDiffLoading(false);
    }
  }, [projectId]);

  const fetchBranches = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/git/branches`);
      if (!res.ok) return;
      const data = await res.json();
      setBranches(data.branches);
      setCurrentBranch(data.current);
    } catch {
      // ignore
    }
  }, [projectId]);

  const checkoutBranch = useCallback(async (branch: string): Promise<{ success: boolean; error?: string }> => {
    if (!projectId) return { success: false, error: "No project" };
    try {
      const res = await fetch(`/api/projects/${projectId}/git/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentBranch(branch);
        setSelectedCommit(null);
        setCommitFiles([]);
        setCommitDiff(null);
        await fetchLog(0);
      }
      return data;
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }, [projectId, fetchLog]);

  const clearSelection = useCallback(() => {
    setSelectedCommit(null);
    setCommitFiles([]);
    setCommitDiff(null);
  }, []);

  return {
    commits,
    selectedCommit,
    commitFiles,
    commitDiff,
    branches,
    currentBranch,
    loading,
    filesLoading,
    diffLoading,
    hasMore,
    fetchLog,
    loadMore,
    selectCommit,
    fetchCommitDiff,
    fetchBranches,
    checkoutBranch,
    clearSelection,
  };
}
