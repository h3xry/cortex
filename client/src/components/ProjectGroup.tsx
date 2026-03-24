import { useState, useEffect } from "react";
import type { Group, Project, Session } from "../types";

const LS_KEY = "cc-monitor-group-collapse";

function loadCollapseState(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}"); } catch { return {}; }
}

function saveCollapseState(state: Record<string, boolean>): void {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

interface ProjectGroupProps {
  group: Group;
  projects: Project[];
  sessions: Session[];
  selectedProjectId: string | null;
  onSelectProject: (project: Project) => void;
  onRemoveProject: (id: string) => void;
  onEditGroup: () => void;
  onDeleteGroup: () => void;
  onMoveProject: (projectId: string, groupId: string | null) => void;
  groups: Group[];
  // Drag-and-drop
  onDragStart: (groupId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (targetGroupId: string) => void;
  renderProjectItem: (project: Project) => React.ReactNode;
}

export function ProjectGroup({
  group,
  projects,
  selectedProjectId,
  onEditGroup,
  onDeleteGroup,
  onDragStart,
  onDragOver,
  onDrop,
  renderProjectItem,
}: ProjectGroupProps) {
  const [collapsed, setCollapsed] = useState(() => loadCollapseState()[group.id] ?? false);

  useEffect(() => {
    const state = loadCollapseState();
    state[group.id] = collapsed;
    saveCollapseState(state);
  }, [collapsed, group.id]);

  return (
    <div
      className="project-group"
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(group.id); }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e); }}
      onDrop={() => onDrop(group.id)}
    >
      <div
        className="project-group-header"
        style={{ borderLeftColor: group.color }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="project-group-arrow">{collapsed ? "▶" : "▼"}</span>
        <span className="project-group-icon">{group.icon}</span>
        <span className="project-group-name">{group.name}</span>
        <span className="project-group-count" style={{ background: group.color }}>
          {projects.length}
        </span>
        <div className="project-group-actions" onClick={(e) => e.stopPropagation()}>
          <button className="project-group-btn" onClick={onEditGroup} title="Edit">✎</button>
          <button className="project-group-btn" onClick={onDeleteGroup} title="Delete">x</button>
        </div>
      </div>

      {!collapsed && (
        <div className="project-group-body">
          {projects.length === 0 && (
            <div className="project-group-empty">No projects in this group</div>
          )}
          {projects.map((p) => renderProjectItem(p))}
        </div>
      )}
    </div>
  );
}
