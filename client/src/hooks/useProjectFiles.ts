import { useState, useCallback } from "react";
import type { FileEntry } from "../types";

interface FileContent {
  path: string;
  content: string;
  language: string;
  size: number;
}

export function useProjectFiles(projectId: string) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  const fetchEntries = useCallback(
    async (relativePath = "") => {
      setLoading(true);
      try {
        const url = `/api/projects/${projectId}/files?path=${encodeURIComponent(relativePath)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    },
    [projectId],
  );

  const fetchFileContent = useCallback(
    async (relativePath: string) => {
      setContentLoading(true);
      try {
        const url = `/api/projects/${projectId}/files/content?path=${encodeURIComponent(relativePath)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data: FileContent = await res.json();
          setFileContent(data);
        } else {
          const err = await res.json().catch(() => ({}));
          setFileContent({
            path: relativePath,
            content: err.error ?? "Failed to load file",
            language: "text",
            size: 0,
          });
        }
      } catch {
        setFileContent(null);
      } finally {
        setContentLoading(false);
      }
    },
    [projectId],
  );

  const clearFileContent = useCallback(() => {
    setFileContent(null);
  }, []);

  return {
    entries,
    loading,
    fileContent,
    contentLoading,
    fetchEntries,
    fetchFileContent,
    clearFileContent,
  };
}
