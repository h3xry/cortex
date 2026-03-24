import { useState, useMemo } from "react";
import { ProjectGroup } from "./ProjectGroup";
import { GroupForm } from "./GroupForm";
import type { Project, Session, Group, ActivityStatus } from "../types";

const ACTIVITY_LABELS: Record<ActivityStatus, { label: string; color: string }> = {
  unknown: { label: "", color: "" },
  idle: { label: "idle", color: "#6c7086" },
  thinking: { label: "thinking...", color: "#89b4fa" },
  working: { label: "working...", color: "#f9e2af" },
  done: { label: "done", color: "#a6e3a1" },
  help: { label: "need help!", color: "#f38ba8" },
  error: { label: "error", color: "#f38ba8" },
};

interface ProjectListProps {
  projects: Project[];
  sessions: Session[];
  selectedProjectId: string | null;
  unlocked: boolean;
  groups: Group[];
  groupFilter: string | null;
  onSelect: (project: Project) => void;
  onRemove: (id: string) => void;
  onSetPrivate: (project: Project) => void;
  onRemovePrivate: (project: Project) => void;
  onCreateGroup: (data: { name: string; icon: string; color: string }) => void;
  onUpdateGroup: (id: string, data: Partial<Pick<Group, "name" | "icon" | "color">>) => void;
  onDeleteGroup: (id: string) => void;
  onReorderGroups: (order: string[]) => void;
  onAssignProjectGroup: (projectId: string, groupId: string | null) => void;
  onSetGroupFilter: (groupId: string | null) => void;
}

export function ProjectList({
  projects,
  sessions,
  selectedProjectId,
  unlocked,
  groups,
  groupFilter,
  onSelect,
  onRemove,
  onSetPrivate,
  onRemovePrivate,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onReorderGroups,
  onAssignProjectGroup,
  onSetGroupFilter,
}: ProjectListProps) {
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [dragGroupId, setDragGroupId] = useState<string | null>(null);
  const [moveProjectId, setMoveProjectId] = useState<string | null>(null);

  // Filter projects by group
  const filteredProjects = useMemo(() => {
    if (!groupFilter) return projects;
    return projects.filter((p) => p.groupId === groupFilter);
  }, [projects, groupFilter]);

  const groupedProjects = useMemo(() => {
    const byGroup: Record<string, Project[]> = {};
    const ungrouped: Project[] = [];
    for (const p of filteredProjects) {
      if (p.groupId && groups.some((g) => g.id === p.groupId)) {
        (byGroup[p.groupId] ??= []).push(p);
      } else {
        ungrouped.push(p);
      }
    }
    return { byGroup, ungrouped };
  }, [filteredProjects, groups]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (targetGroupId: string) => {
    if (!dragGroupId || dragGroupId === targetGroupId) return;
    const currentOrder = groups.map((g) => g.id);
    const fromIdx = currentOrder.indexOf(dragGroupId);
    const toIdx = currentOrder.indexOf(targetGroupId);
    if (fromIdx === -1 || toIdx === -1) return;
    currentOrder.splice(fromIdx, 1);
    currentOrder.splice(toIdx, 0, dragGroupId);
    onReorderGroups(currentOrder);
    setDragGroupId(null);
  };

  const renderProjectItem = (project: Project) => {
    const projectSessions = sessions.filter(
      (s) => s.status === "running" && (s.folderPath === project.path || s.projectName === project.name),
    );
    let bestActivity: ActivityStatus = "unknown";
    if (projectSessions.length > 0) {
      for (const s of projectSessions) {
        const act = s.activity?.status;
        if (act === "help") { bestActivity = "help"; break; }
        if (act === "working") bestActivity = "working";
        if (act === "thinking" && bestActivity !== "working") bestActivity = "thinking";
      }
    }
    const activityInfo = ACTIVITY_LABELS[bestActivity];
    const runningCount = projectSessions.length;

    return (
      <div
        key={project.id}
        className={`project-item ${selectedProjectId === project.id ? "active" : ""}`}
        onClick={() => onSelect(project)}
      >
        <div className="project-info">
          <span className="project-name">
            {project.isPrivate && <span className="private-badge">P</span>}
            {project.name}
          </span>
          {project.isGitRepo && <span className="git-badge">git</span>}
          {runningCount > 0 && activityInfo.label && (
            <span className={`activity-badge-pill activity-pill-${bestActivity}`}>
              {activityInfo.label}
            </span>
          )}
        </div>
        <div className="project-meta">
          <span className="project-path" title={project.path}>{project.path}</span>
          <div className="project-actions">
            <button
              className="move-group-button"
              onClick={(e) => { e.stopPropagation(); setMoveProjectId(moveProjectId === project.id ? null : project.id); }}
              title="Move to group"
            >
              ⇄
            </button>
            {!project.isPrivate && (
              <button className="privacy-button" onClick={(e) => { e.stopPropagation(); onSetPrivate(project); }} title="Set private">Hide</button>
            )}
            {project.isPrivate && unlocked && (
              <button className="privacy-button" onClick={(e) => { e.stopPropagation(); onRemovePrivate(project); }} title="Remove private">Show</button>
            )}
            <button className="remove-button" onClick={(e) => { e.stopPropagation(); onRemove(project.id); }} title="Remove project">x</button>
          </div>
        </div>
        {moveProjectId === project.id && (
          <div className="move-group-dropdown" onClick={(e) => e.stopPropagation()}>
            {groups.map((g) => (
              <button
                key={g.id}
                className={`move-group-option ${project.groupId === g.id ? "active" : ""}`}
                onClick={() => { onAssignProjectGroup(project.id, g.id); setMoveProjectId(null); }}
              >
                {g.icon} {g.name}
              </button>
            ))}
            {project.groupId && (
              <button
                className="move-group-option remove"
                onClick={() => { onAssignProjectGroup(project.id, null); setMoveProjectId(null); }}
              >
                Remove from group
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="project-list">
      <div className="project-list-header">
        <h3>Projects</h3>
        <button className="add-group-btn" onClick={() => { setEditGroup(null); setShowGroupForm(true); }} title="Add Group">
          + Group
        </button>
      </div>

      {groups.length > 0 && (
        <div className="group-filter-bar">
          <button
            className={`group-filter-btn ${!groupFilter ? "active" : ""}`}
            onClick={() => onSetGroupFilter(null)}
          >
            All
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              className={`group-filter-btn ${groupFilter === g.id ? "active" : ""}`}
              style={groupFilter === g.id ? { background: g.color, color: "#1e1e2e" } : { borderColor: g.color }}
              onClick={() => onSetGroupFilter(groupFilter === g.id ? null : g.id)}
            >
              {g.icon} {g.name}
            </button>
          ))}
        </div>
      )}

      {projects.length === 0 && <div className="empty-message">No projects added yet</div>}

      {groups.map((group) => {
        const groupProjects = groupedProjects.byGroup[group.id] ?? [];
        if (groupFilter && groupFilter !== group.id) return null;
        return (
          <ProjectGroup
            key={group.id}
            group={group}
            projects={groupProjects}
            sessions={sessions}
            selectedProjectId={selectedProjectId}
            unlocked={unlocked}
            onSelectProject={onSelect}
            onRemoveProject={onRemove}
            onSetPrivate={onSetPrivate}
            onRemovePrivate={onRemovePrivate}
            onEditGroup={() => { setEditGroup(group); setShowGroupForm(true); }}
            onDeleteGroup={() => {
              if (groupProjects.length > 0 && !confirm(`Delete "${group.name}"? ${groupProjects.length} projects will be ungrouped.`)) return;
              onDeleteGroup(group.id);
            }}
            onMoveProject={onAssignProjectGroup}
            groups={groups}
            onDragStart={setDragGroupId}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            renderProjectItem={renderProjectItem}
          />
        );
      })}

      {/* Ungrouped section: only show when groups exist */}
      {groups.length > 0 && groupedProjects.ungrouped.length > 0 && !groupFilter && (
        <div className="project-group ungrouped">
          <div className="project-group-header ungrouped-header">
            <span className="project-group-name">Ungrouped</span>
            <span className="project-group-count">{groupedProjects.ungrouped.length}</span>
          </div>
          <div className="project-group-body">
            {groupedProjects.ungrouped.map((p) => renderProjectItem(p))}
          </div>
        </div>
      )}

      {/* Flat list when no groups exist */}
      {groups.length === 0 && filteredProjects.map((p) => renderProjectItem(p))}

      {showGroupForm && (
        <GroupForm
          group={editGroup}
          onSave={(data) => {
            if (editGroup) {
              onUpdateGroup(editGroup.id, data);
            } else {
              onCreateGroup(data);
            }
            setShowGroupForm(false);
            setEditGroup(null);
          }}
          onCancel={() => { setShowGroupForm(false); setEditGroup(null); }}
        />
      )}
    </div>
  );
}
