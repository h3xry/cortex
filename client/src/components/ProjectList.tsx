import type { Project } from "../types";

interface ProjectListProps {
  projects: Project[];
  selectedProjectId: string | null;
  unlocked: boolean;
  onSelect: (project: Project) => void;
  onRemove: (id: string) => void;
  onSetPrivate: (project: Project) => void;
  onRemovePrivate: (project: Project) => void;
}

export function ProjectList({
  projects,
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

      {projects.map((project) => (
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
      ))}
    </div>
  );
}
