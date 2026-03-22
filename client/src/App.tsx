import { useState } from "react";
import { FolderBrowser } from "./components/FolderBrowser";
import { LaunchButton } from "./components/LaunchButton";
import { SessionList } from "./components/SessionList";
import { TerminalView } from "./components/TerminalView";
import { useFolders } from "./hooks/useFolders";
import { useSessions } from "./hooks/useSessions";
import type { Session } from "./types";

export function App() {
  const folders = useFolders();
  const { sessions, createSession, deleteSession, refreshSessions } =
    useSessions();
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const handleLaunch = async () => {
    if (!folders.selectedPath) return;
    setLaunchError(null);
    try {
      const session = await createSession(folders.selectedPath);
      setActiveSession(session);
    } catch (err) {
      setLaunchError(
        err instanceof Error ? err.message : "Failed to launch session",
      );
    }
  };

  const handleSelectSession = (session: Session) => {
    setActiveSession(session);
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id);
    if (activeSession?.id === id) {
      setActiveSession(null);
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <FolderBrowser
          currentPath={folders.currentPath}
          parentPath={folders.parentPath}
          entries={folders.entries}
          selectedPath={folders.selectedPath}
          loading={folders.loading}
          error={folders.error}
          onNavigate={folders.navigateTo}
          onGoUp={folders.goUp}
          onSelect={folders.selectFolder}
        />

        <LaunchButton
          selectedPath={folders.selectedPath}
          onLaunch={handleLaunch}
          error={launchError}
        />

        <SessionList
          sessions={sessions}
          activeSessionId={activeSession?.id ?? null}
          onSelect={handleSelectSession}
          onDelete={handleDeleteSession}
          onRefresh={refreshSessions}
        />
      </aside>

      <main className="main-content">
        {activeSession ? (
          <TerminalView
            key={activeSession.id}
            sessionId={activeSession.id}
            folderPath={activeSession.folderPath}
          />
        ) : (
          <div className="placeholder">
            Select a folder and launch a session to get started.
          </div>
        )}
      </main>
    </div>
  );
}
