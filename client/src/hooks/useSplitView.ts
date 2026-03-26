import { useState, useCallback } from "react";
import type { Project } from "../types";

export type SplitDirection = "h" | "v";
export type FocusedPanel = "left" | "right";

export function useSplitView() {
  const [splitMode, setSplitMode] = useState(false);
  const [direction, setDirection] = useState<SplitDirection>("h");
  const [ratio, setRatioRaw] = useState(0.5);
  const [rightProject, setRightProject] = useState<Project | null>(null);
  const [focusedPanel, setFocusedPanel] = useState<FocusedPanel>("left");

  const setRatio = useCallback((r: number) => {
    setRatioRaw(Math.min(0.8, Math.max(0.2, r)));
  }, []);

  const openSplit = useCallback(() => {
    setSplitMode(true);
    setRightProject(null);
    setFocusedPanel("left");
    setRatioRaw(0.5);
  }, []);

  const closeSplit = useCallback(() => {
    setSplitMode(false);
    setRightProject(null);
    setFocusedPanel("left");
  }, []);

  const toggleDirection = useCallback(() => {
    setDirection((d) => (d === "h" ? "v" : "h"));
  }, []);

  return {
    splitMode,
    direction,
    ratio,
    rightProject,
    focusedPanel,
    openSplit,
    closeSplit,
    toggleDirection,
    setRatio,
    setRightProject,
    setFocusedPanel,
  };
}
