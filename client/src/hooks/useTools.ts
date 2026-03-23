import { useState, useEffect, useCallback } from "react";
import type { ToolConfig, ToolPreset } from "../types";

export function useTools() {
  const [tools, setTools] = useState<ToolConfig[]>([]);
  const [presets, setPresets] = useState<ToolPreset[]>([]);
  const [enabledTools, setEnabledTools] = useState<Set<string>>(new Set());
  const [activePreset, setActivePreset] = useState<string>("Full Access");

  useEffect(() => {
    fetch("/api/tools")
      .then((res) => res.json())
      .then((data) => {
        setTools(data.tools);
        setPresets(data.presets);
        // Default: all tools enabled (Full Access)
        setEnabledTools(new Set(data.tools.map((t: ToolConfig) => t.name)));
      })
      .catch(() => {});
  }, []);

  const toggleTool = useCallback(
    (name: string) => {
      setEnabledTools((prev) => {
        const next = new Set(prev);
        if (next.has(name)) {
          next.delete(name);
        } else {
          next.add(name);
        }
        return next;
      });
      setActivePreset("Custom");
    },
    [],
  );

  const applyPreset = useCallback(
    (presetName: string) => {
      const preset = presets.find((p) => p.name === presetName);
      if (!preset) return;

      if (preset.tools.length === 0) {
        // Full Access = all tools
        setEnabledTools(new Set(tools.map((t) => t.name)));
      } else {
        setEnabledTools(new Set(preset.tools));
      }
      setActivePreset(presetName);
    },
    [presets, tools],
  );

  const getAllowedTools = useCallback((): string[] => {
    if (activePreset === "Full Access") return [];
    return Array.from(enabledTools);
  }, [enabledTools, activePreset]);

  return {
    tools,
    presets,
    enabledTools,
    activePreset,
    toggleTool,
    applyPreset,
    getAllowedTools,
  };
}
