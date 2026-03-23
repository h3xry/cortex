import type { Project } from "../types";

interface ProjectListProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelect: (project: Project) => void;
  onRemove: (id: string) => void;
}

export function ProjectList({
  projects,
  selectedProjectId,
  onSelect,
  onRemove,
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
            <span className="project-name">{project.name}</span>
            {project.isGitRepo && <span className="git-badge">git</span>}
          </div>
          <div className="project-meta">
            <span className="project-path" title={project.path}>
              {project.path}
            </span>
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
      ))}
    </div>
  );
}
