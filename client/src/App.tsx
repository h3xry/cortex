import { useState, useCallback, useEffect } from "react";
import { AddProject } from "./components/AddProject";
import { ProjectList } from "./components/ProjectList";
import { ProjectPanel } from "./components/ProjectPanel";
import { SessionManager } from "./components/SessionManager";
import { UnlockModal } from "./components/UnlockModal";
import { NotificationPanel } from "./components/NotificationPanel";
import { SplitView } from "./components/SplitView";
import { PanelSelector } from "./components/PanelSelector";
import { RetroViewer } from "./components/RetroViewer";
import { useProjects } from "./hooks/useProjects";
import { useSessions } from "./hooks/useSessions";
import { useGroups } from "./hooks/useGroups";
import { useNotifications } from "./hooks/useNotifications";
import { useSplitView } from "./hooks/useSplitView";
import { useTheme } from "./hooks/useTheme";
import { requestPermission } from "./services/notification";
import type { Project, Session, NotificationEvent } from "./types";

export function App() {
  const {
    projects,
    addProject,
    removeProject,
    unlock,
    lock,
    unlocked,
    hasGlobalPassword,
    fetchProjects,
  } = useProjects();
  const { sessions, deleteSession } = useSessions();
  const groupsState = useGroups();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const notifications = useNotifications(sessions, selectedProject?.id ?? null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainView, setMainView] = useState<"project" | "sessions" | "retros">("project");
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [showUnlock, setShowUnlock] = useState(false);
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const split = useSplitView();
  const { theme, toggle: toggleTheme } = useTheme();
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(false);

  const runningCount = sessions.filter((s) => s.status === "running").length;

  // Request notification permission on first session launch
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default" && sessions.length > 0) {
      setShowNotifBanner(true);
    }
  }, [sessions.length]);

  const handleNotifNavigate = useCallback(
    (event: NotificationEvent) => {
      const matchedProject = projects.find((p) => p.path === event.projectId);
      if (matchedProject) {
        setSelectedProject(matchedProject);
        if (event.sessionId) {
          setTargetSessionId(event.sessionId);
        }
        setMainView("project");
        setSidebarOpen(false);
      }
    },
    [projects],
  );

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

  const handleUnlock = async (password: string) => {
    await unlock(password);
    setShowUnlock(false);
    groupsState.fetchGroups();
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
          <button
            className={`sidebar-toggle-btn ${mainView === "retros" ? "active" : ""}`}
            onClick={() => setMainView("retros")}
          >
            Retros
          </button>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button
              className="notification-bell"
              onClick={() => { setShowNotifPanel(!showNotifPanel); if (!showNotifPanel) notifications.markAllRead(); }}
              title="Notifications"
            >
              🔔
              {notifications.unreadCount > 0 && (
                <span className="notification-badge">{notifications.unreadCount}</span>
              )}
            </button>
            {showNotifPanel && (
              <NotificationPanel
                history={notifications.history}
                onClear={() => { notifications.clearHistory(); setShowNotifPanel(false); }}
                onNavigate={(e) => { handleNotifNavigate(e); setShowNotifPanel(false); }}
                onMarkAllRead={notifications.markAllRead}
              />
            )}
          </div>
        </div>

        <AddProject
          onAdd={handleAddProject}
          existingPaths={new Set(projects.map((p) => p.path))}
        />

        <ProjectList
          projects={projects}
          sessions={sessions}
          selectedProjectId={selectedProject?.id ?? null}
          groups={groupsState.groups}
          groupFilter={groupFilter}
          onSelect={handleSelectProject}
          onRemove={handleRemoveProject}
          onCreateGroup={groupsState.createGroup}
          onUpdateGroup={groupsState.updateGroup}
          onDeleteGroup={groupsState.deleteGroup}
          onReorderGroups={groupsState.reorderGroups}
          onAssignProjectGroup={async (pid, gid) => { await groupsState.assignProjectGroup(pid, gid); fetchProjects(); }}
          onSetGroupFilter={setGroupFilter}
        />

        {(hasGlobalPassword || groupsState.groups.some((g) => g.isPrivate)) && (
          <div className="sidebar-unlock">
            {unlocked ? (
              <button className="unlock-button unlocked" onClick={async () => {
                // Deselect project if in a private group
                if (selectedProject?.groupId) {
                  const inPrivateGroup = groupsState.groups.some(
                    (g) => g.id === selectedProject.groupId && g.isPrivate,
                  );
                  if (inPrivateGroup) {
                    setSelectedProject(null);
                    setTargetSessionId(null);
                  }
                }
                await lock();
                await groupsState.fetchGroups();
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
        ) : mainView === "retros" ? (
          <RetroViewer
            projects={projects}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            unlocked={unlocked}
          />
        ) : selectedProject ? (
          <>
            {split.splitMode ? (
              <SplitView
                direction={split.direction}
                ratio={split.ratio}
                onRatioChange={split.setRatio}
                leftFocused={split.focusedPanel === "left"}
                onFocusLeft={() => split.setFocusedPanel("left")}
                onFocusRight={() => split.setFocusedPanel("right")}
                leftContent={
                  <ProjectPanel
                    key={selectedProject.id}
                    project={selectedProject}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    targetSessionId={targetSessionId}
                    onSessionActivated={() => setTargetSessionId(null)}
                    splitControls={{
                      splitMode: true,
                      direction: split.direction,
                      onOpenSplit: split.openSplit,
                      onCloseSplit: split.closeSplit,
                      onToggleDirection: split.toggleDirection,
                    }}
                  />
                }
                rightContent={
                  split.rightProject ? (
                    <ProjectPanel
                      key={`right-${split.rightProject.id}`}
                      project={split.rightProject}
                      onToggleSidebar={() => {}}
                      splitControls={{
                        splitMode: true,
                        direction: split.direction,
                        onOpenSplit: split.openSplit,
                        onCloseSplit: split.closeSplit,
                        onToggleDirection: split.toggleDirection,
                        onChangeRight: () => split.setRightProject(null),
                      }}
                    />
                  ) : (
                    <PanelSelector
                      projects={projects}
                      onSelect={split.setRightProject}
                    />
                  )
                }
              />
            ) : (
              <ProjectPanel
                key={selectedProject.id}
                project={selectedProject}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                targetSessionId={targetSessionId}
                onSessionActivated={() => setTargetSessionId(null)}
                splitControls={{
                  splitMode: false,
                  direction: split.direction,
                  onOpenSplit: split.openSplit,
                  onCloseSplit: split.closeSplit,
                  onToggleDirection: split.toggleDirection,
                }}
              />
            )}
          </>
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

      {showUnlock && (
        <UnlockModal
          onUnlock={handleUnlock}
          onCancel={() => setShowUnlock(false)}
        />
      )}


      {showNotifBanner && (
        <div className="notification-banner" style={{ position: "fixed", bottom: 16, left: 16, right: 16, zIndex: 9998 }}>
          <span className="notification-banner-text">
            Enable notifications to get alerts when sessions complete or need input.
          </span>
          <div className="notification-banner-actions">
            <button
              className="notification-banner-enable"
              onClick={async () => { await requestPermission(); setShowNotifBanner(false); }}
            >
              Enable
            </button>
            <button
              className="notification-banner-later"
              onClick={() => setShowNotifBanner(false)}
            >
              Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
