import { useState } from "react";
import { AddProject } from "./components/AddProject";
import { ProjectList } from "./components/ProjectList";
import { ProjectPanel } from "./components/ProjectPanel";
import { useProjects } from "./hooks/useProjects";
import type { Project } from "./types";

export function App() {
  const { projects, addProject, removeProject } = useProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleAddProject = async (path: string) => {
    const project = await addProject(path);
    setSelectedProject(project);
  };

  const handleRemoveProject = async (id: string) => {
    await removeProject(id);
    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <AddProject onAdd={handleAddProject} />

        <ProjectList
          projects={projects}
          selectedProjectId={selectedProject?.id ?? null}
          onSelect={setSelectedProject}
          onRemove={handleRemoveProject}
        />
      </aside>

      <main className="main-content">
        {selectedProject ? (
          <ProjectPanel key={selectedProject.id} project={selectedProject} />
        ) : (
          <div className="placeholder">
            Add a project to get started.
          </div>
        )}
      </main>
    </div>
  );
}
