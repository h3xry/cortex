import { useState, useCallback } from "react";
import type { FileEntry } from "../types";

interface SpecContent {
  path: string;
  content: string;
}

export function useSpecs(projectId: string) {
  const [features, setFeatures] = useState<FileEntry[]>([]);
  const [featureFiles, setFeatureFiles] = useState<FileEntry[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState<SpecContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [hasSpecs, setHasSpecs] = useState(true);

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/files?path=.claude/specs`,
      );
      if (res.ok) {
        const data = await res.json();
        const dirs = data.entries.filter(
          (e: FileEntry) => e.type === "directory",
        );
        setFeatures(dirs);
        setHasSpecs(true);
      } else {
        setFeatures([]);
        setHasSpecs(false);
      }
    } catch {
      setFeatures([]);
      setHasSpecs(false);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const selectFeature = useCallback(
    async (featurePath: string) => {
      setSelectedFeature(featurePath);
      setSelectedFile(null);
      setContent(null);
      setFeatureFiles([]);

      try {
        const res = await fetch(
          `/api/projects/${projectId}/files?path=${encodeURIComponent(featurePath)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setFeatureFiles(data.entries);
        }
      } catch {
        // silent
      }
    },
    [projectId],
  );

  const selectFile = useCallback(
    async (filePath: string) => {
      setSelectedFile(filePath);
      setContentLoading(true);

      try {
        const res = await fetch(
          `/api/projects/${projectId}/files/content?path=${encodeURIComponent(filePath)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setContent({ path: data.path, content: data.content });
        }
      } catch {
        setContent(null);
      } finally {
        setContentLoading(false);
      }
    },
    [projectId],
  );

  return {
    features,
    featureFiles,
    selectedFeature,
    selectedFile,
    content,
    loading,
    contentLoading,
    hasSpecs,
    fetchFeatures,
    selectFeature,
    selectFile,
  };
}
