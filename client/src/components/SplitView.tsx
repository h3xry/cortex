import { useRef, useCallback, type ReactNode } from "react";
import type { SplitDirection } from "../hooks/useSplitView";

interface SplitViewProps {
  direction: SplitDirection;
  ratio: number;
  onRatioChange: (ratio: number) => void;
  leftContent: ReactNode;
  rightContent: ReactNode;
  leftFocused: boolean;
  onFocusLeft: () => void;
  onFocusRight: () => void;
}

export function SplitView({
  direction, ratio, onRatioChange,
  leftContent, rightContent,
  leftFocused, onFocusLeft, onFocusRight,
}: SplitViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = direction === "h" ? "col-resize" : "row-resize";

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pos = direction === "h"
        ? (ev.clientX - rect.left) / rect.width
        : (ev.clientY - rect.top) / rect.height;
      onRatioChange(pos);
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [direction, onRatioChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragging.current = true;

    const onTouchMove = (ev: TouchEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const touch = ev.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const pos = direction === "h"
        ? (touch.clientX - rect.left) / rect.width
        : (touch.clientY - rect.top) / rect.height;
      onRatioChange(pos);
    };

    const onTouchEnd = () => {
      dragging.current = false;
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };

    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onTouchEnd);
  }, [direction, onRatioChange]);

  const flexDir = direction === "h" ? "row" : "column";
  const dividerCursor = direction === "h" ? "col-resize" : "row-resize";

  return (
    <div
      ref={containerRef}
      className="split-view"
      style={{ flexDirection: flexDir }}
    >
      <div
        className={`split-panel ${leftFocused ? "focused" : ""}`}
        style={{ flex: `${ratio} 0 0` }}
        onClick={onFocusLeft}
      >
        {leftContent}
      </div>

      <div
        className="split-divider"
        style={{ cursor: dividerCursor }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      />

      <div
        className={`split-panel ${!leftFocused ? "focused" : ""}`}
        style={{ flex: `${1 - ratio} 0 0` }}
        onClick={onFocusRight}
      >
        {rightContent}
      </div>
    </div>
  );
}
