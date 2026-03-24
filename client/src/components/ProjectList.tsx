import type { Project, Session, ActivityStatus } from "../types";

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
  onSelect: (project: Project) => void;
  onRemove: (id: string) => void;
  onSetPrivate: (project: Project) => void;
  onRemovePrivate: (project: Project) => void;
}

export function ProjectList({
  projects,
  sessions,
  selectedProjectId,
  unlocked,
  onSelect,
  onRemove,
  onSetPrivate,
  onRemovePrivate,
}: ProjectListProps) {
  return (
    <div className="project-list">
      <div className="project-list-header">
        <h3>Projects</h3>
      </div>

      {projects.length === 0 && (
        <div className="empty-message">No projects added yet</div>
      )}

      {projects.map((project) => {
        // Find running sessions for this project (match by projectName or path)
        const projectSessions = sessions.filter(
          (s) =>
            s.status === "running" &&
            (s.folderPath === project.path ||
              s.projectName === project.name),
        );
        // Determine best activity status
        let bestActivity: ActivityStatus = "unknown";
        if (projectSessions.length > 0) {
          bestActivity = "unknown"; // default = idle (no hook events yet)
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
            <span className="project-path" title={project.path}>
              {project.path}
            </span>
            <div className="project-actions">
              {!project.isPrivate && (
                <button
                  className="privacy-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetPrivate(project);
                  }}
                  title="Set private"
                >
                  Hide
                </button>
              )}
              {project.isPrivate && unlocked && (
                <button
                  className="privacy-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePrivate(project);
                  }}
                  title="Remove private"
                >
                  Show
                </button>
              )}
              <button
                className="remove-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(project.id);
                }}
                title="Remove project"
              >
                x
              </button>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}
