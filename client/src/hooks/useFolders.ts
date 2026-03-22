import { useState, useEffect, useCallback } from "react";
import type { FolderEntry, FolderListResponse } from "../types";

export function useFolders() {
  const [currentPath, setCurrentPath] = useState<string>("");
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [entries, setEntries] = useState<FolderEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = useCallback(async (path?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = path
        ? `/api/folders?path=${encodeURIComponent(path)}`
        : "/api/folders";
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to load folders");
      }
      const data: FolderListResponse = await res.json();
      setCurrentPath(data.current);
      setParentPath(data.parent);
      setEntries(data.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const navigateTo = useCallback(
    (path: string) => {
      fetchFolders(path);
    },
    [fetchFolders],
  );

  const goUp = useCallback(() => {
    if (parentPath) fetchFolders(parentPath);
  }, [parentPath, fetchFolders]);

  const selectFolder = useCallback((path: string) => {
    setSelectedPath(path);
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  return {
    currentPath,
    parentPath,
    entries,
    selectedPath,
    loading,
    error,
    navigateTo,
    goUp,
    selectFolder,
  };
}
