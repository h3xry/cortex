import { useState } from "react";
import { FolderBrowser } from "./components/FolderBrowser";
import { SessionList } from "./components/SessionList";
import { TerminalView } from "./components/TerminalView";
import { ToolSelector } from "./components/ToolSelector";
import { useFolders } from "./hooks/useFolders";
import { useSessions } from "./hooks/useSessions";
import { useTools } from "./hooks/useTools";
import type { Session } from "./types";

export function App() {
  const folders = useFolders();
  const { sessions, createSession, deleteSession, refreshSessions } =
    useSessions();
  const toolsState = useTools();
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [showToolSelector, setShowToolSelector] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const handleLaunchClick = () => {
    if (!folders.selectedPath) return;
    setShowToolSelector(true);
  };

  const handleLaunch = async () => {
    if (!folders.selectedPath) return;
    setLaunchError(null);
    setLaunching(true);
    try {
      const allowedTools = toolsState.getAllowedTools();
      const session = await createSession(
        folders.selectedPath,
        allowedTools.length > 0 ? allowedTools : undefined,
      );
      setActiveSession(session);
      setShowToolSelector(false);
    } catch (err) {
      setLaunchError(
        err instanceof Error ? err.message : "Failed to launch session",
      );
    } finally {
      setLaunching(false);
    }
  };

  const handleSelectSession = (session: Session) => {
    setActiveSession(session);
    setShowToolSelector(false);
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id);
    if (activeSession?.id === id) {
      setActiveSession(null);
    }
  };

  // Update active session status from session list polling
  const currentStatus =
    activeSession &&
    sessions.find((s) => s.id === activeSession.id)?.status;
  const sessionEnded = currentStatus === "ended";

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

        <div className="launch-section">
          <button
            className="launch-button"
            onClick={handleLaunchClick}
            disabled={!folders.selectedPath}
          >
            Launch Claude Code
          </button>
          {launchError && <div className="error-message">{launchError}</div>}
        </div>

        <SessionList
          sessions={sessions}
          activeSessionId={activeSession?.id ?? null}
          onSelect={handleSelectSession}
          onDelete={handleDeleteSession}
          onRefresh={refreshSessions}
        />
      </aside>

      <main className="main-content">
        {showToolSelector && !activeSession ? (
          <ToolSelector
            tools={toolsState.tools}
            presets={toolsState.presets}
            enabledTools={toolsState.enabledTools}
            activePreset={toolsState.activePreset}
            onToggleTool={toolsState.toggleTool}
            onApplyPreset={toolsState.applyPreset}
            onLaunch={handleLaunch}
            launching={launching}
          />
        ) : activeSession ? (
          <TerminalView
            key={activeSession.id}
            sessionId={activeSession.id}
            folderPath={activeSession.folderPath}
            sessionEnded={sessionEnded}
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
