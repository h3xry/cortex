import { useState, useCallback } from "react";
import { AddProject } from "./components/AddProject";
import { ProjectList } from "./components/ProjectList";
import { ProjectPanel } from "./components/ProjectPanel";
import { SessionManager } from "./components/SessionManager";
import { SetPrivateModal } from "./components/SetPrivateModal";
import { UnlockModal } from "./components/UnlockModal";
import { useProjects } from "./hooks/useProjects";
import { useSessions } from "./hooks/useSessions";
import { useGroups } from "./hooks/useGroups";
import type { Project, Session } from "./types";

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
    fetchProjects,
  } = useProjects();
  const { sessions, deleteSession } = useSessions();
  const groupsState = useGroups();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainView, setMainView] = useState<"project" | "sessions">("project");
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [privateTarget, setPrivateTarget] = useState<Project | null>(null);
  const [removePrivateTarget, setRemovePrivateTarget] = useState<Project | null>(null);
  const [showUnlock, setShowUnlock] = useState(false);
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);

  const runningCount = sessions.filter((s) => s.status === "running").length;

  const handleAddProject = async (path: string) => {
    const project = await addProject(path);
    setSelectedProject(project);
    setMainView("project");
    setSidebarOpen(false);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setMainView("project");
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

  const handleSelectSession = useCallback(
    (session: Session) => {
      const matchedProject = projects.find((p) => p.path === session.folderPath);
      if (matchedProject) {
        setSelectedProject(matchedProject);
        setTargetSessionId(session.id);
      }
      setMainView("project");
      setSidebarOpen(false);
    },
    [projects],
  );

  const handleKillSession = useCallback(
    async (id: string) => {
      await deleteSession(id);
    },
    [deleteSession],
  );

  const handleRemoveSession = useCallback(
    async (id: string) => {
      await deleteSession(id);
    },
    [deleteSession],
  );

  return (
    <div className="app">
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-view-toggle">
          <button
            className={`sidebar-toggle-btn ${mainView === "project" ? "active" : ""}`}
            onClick={() => setMainView("project")}
          >
            Projects
          </button>
          <button
            className={`sidebar-toggle-btn ${mainView === "sessions" ? "active" : ""}`}
            onClick={() => setMainView("sessions")}
          >
            Sessions
            {runningCount > 0 && (
              <span className="sidebar-toggle-badge">{runningCount}</span>
            )}
          </button>
        </div>

        <AddProject
          onAdd={handleAddProject}
          existingPaths={new Set(projects.map((p) => p.path))}
        />

        <ProjectList
          projects={projects}
          sessions={sessions}
          selectedProjectId={selectedProject?.id ?? null}
          unlocked={unlocked}
          groups={groupsState.groups}
          groupFilter={groupFilter}
          onSelect={handleSelectProject}
          onRemove={handleRemoveProject}
          onSetPrivate={(p) => setPrivateTarget(p)}
          onRemovePrivate={(p) => setRemovePrivateTarget(p)}
          onCreateGroup={groupsState.createGroup}
          onUpdateGroup={groupsState.updateGroup}
          onDeleteGroup={groupsState.deleteGroup}
          onReorderGroups={groupsState.reorderGroups}
          onAssignProjectGroup={async (pid, gid) => { await groupsState.assignProjectGroup(pid, gid); fetchProjects(); }}
          onSetGroupFilter={setGroupFilter}
        />

        {hasPrivateProjects && (
          <div className="sidebar-unlock">
            {unlocked ? (
              <button className="unlock-button unlocked" onClick={() => {
                // Deselect private project before locking
                if (selectedProject?.isPrivate) {
                  setSelectedProject(null);
                  setTargetSessionId(null);
                }
                lock();
              }}>
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
        {mainView === "sessions" ? (
          <div className="sm-main-view">
            <div className="sm-main-topbar">
              <button
                className="hamburger"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                ☰
              </button>
            </div>
            <SessionManager
              sessions={sessions}
              onSelectSession={handleSelectSession}
              onKillSession={handleKillSession}
              onRemoveSession={handleRemoveSession}
            />
          </div>
        ) : selectedProject ? (
          <ProjectPanel
            key={selectedProject.id}
            project={selectedProject}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            targetSessionId={targetSessionId}
            onSessionActivated={() => setTargetSessionId(null)}
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
