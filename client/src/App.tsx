import { useState } from "react";
import { AddProject } from "./components/AddProject";
import { ProjectList } from "./components/ProjectList";
import { ProjectPanel } from "./components/ProjectPanel";
import { SetPrivateModal } from "./components/SetPrivateModal";
import { UnlockModal } from "./components/UnlockModal";
import { useProjects } from "./hooks/useProjects";
import type { Project } from "./types";

export function App() {
  const {
    projects,
    addProject,
    removeProject,
    setProjectPrivate,
    unlock,
    lock,
    unlocked,
    hasGlobalPassword,
    hasPrivateProjects,
  } = useProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [privateTarget, setPrivateTarget] = useState<Project | null>(null);
  const [removePrivateTarget, setRemovePrivateTarget] = useState<Project | null>(null);
  const [showUnlock, setShowUnlock] = useState(false);

  const handleAddProject = async (path: string) => {
    const project = await addProject(path);
    setSelectedProject(project);
    setSidebarOpen(false);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setSidebarOpen(false);
  };

  const handleRemoveProject = async (id: string) => {
    await removeProject(id);
    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }
  };

  const handleSetPrivate = async (password: string) => {
    if (!privateTarget) return;
    await setProjectPrivate(privateTarget.id, true, password);
    if (selectedProject?.id === privateTarget.id) {
      setSelectedProject(null);
    }
    setPrivateTarget(null);
  };

  const handleRemovePrivate = async (password: string) => {
    if (!removePrivateTarget) return;
    await setProjectPrivate(removePrivateTarget.id, false, password);
    setRemovePrivateTarget(null);
  };

  const handleUnlock = async (password: string) => {
    await unlock(password);
    setShowUnlock(false);
  };

  return (
    <div className="app">
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <AddProject
          onAdd={handleAddProject}
          existingPaths={new Set(projects.map((p) => p.path))}
        />

        <ProjectList
          projects={projects}
          selectedProjectId={selectedProject?.id ?? null}
          unlocked={unlocked}
          onSelect={handleSelectProject}
          onRemove={handleRemoveProject}
          onSetPrivate={(p) => setPrivateTarget(p)}
          onRemovePrivate={(p) => setRemovePrivateTarget(p)}
        />

        {hasPrivateProjects && (
          <div className="sidebar-unlock">
            {unlocked ? (
              <button className="unlock-button unlocked" onClick={lock}>
                Unlocked
              </button>
            ) : (
              <button className="unlock-button" onClick={() => setShowUnlock(true)}>
                Unlock Private
              </button>
            )}
          </div>
        )}
      </aside>

      <main className="main-content">
        {selectedProject ? (
          <ProjectPanel
            key={selectedProject.id}
            project={selectedProject}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        ) : (
          <div className="placeholder">
            <button
              className="hamburger"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            Add a project to get started.
          </div>
        )}
      </main>

      {privateTarget && (
        <SetPrivateModal
          projectName={privateTarget.name}
          hasGlobalPassword={hasGlobalPassword}
          onConfirm={handleSetPrivate}
          onCancel={() => setPrivateTarget(null)}
        />
      )}

      {removePrivateTarget && (
        <UnlockModal
          onUnlock={handleRemovePrivate}
          onCancel={() => setRemovePrivateTarget(null)}
          title="Remove Private"
          description={`Enter password to make "${removePrivateTarget.name}" public again.`}
          buttonLabel="Remove Private"
        />
      )}

      {showUnlock && (
        <UnlockModal
          onUnlock={handleUnlock}
          onCancel={() => setShowUnlock(false)}
        />
      )}
    </div>
  );
}
