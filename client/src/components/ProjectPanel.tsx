import { useState, useEffect } from "react";
import { TerminalView } from "./TerminalView";
import { ToolSelector } from "./ToolSelector";
import { GitChanges } from "./GitChanges";
import { DiffViewer } from "./DiffViewer";
import { ProjectFiles } from "./ProjectFiles";
import { FileViewer } from "./FileViewer";
import { SpecBrowser } from "./SpecBrowser";
import { MarkdownViewer } from "./MarkdownViewer";
import { NoteList } from "./NoteList";
import { useSessions } from "../hooks/useSessions";
import { useTools } from "../hooks/useTools";
import { useGitStatus } from "../hooks/useGitStatus";
import { useProjectFiles } from "../hooks/useProjectFiles";
import { useSpecs } from "../hooks/useSpecs";
import { useNotes } from "../hooks/useNotes";
import { useGitHistory } from "../hooks/useGitHistory";
import type { Project, Session } from "../types";

interface SplitControls {
  splitMode: boolean;
  direction: "h" | "v";
  onOpenSplit: () => void;
  onCloseSplit: () => void;
  onToggleDirection: () => void;
  onChangeRight?: () => void;
}

interface ProjectPanelProps {
  project: Project;
  onToggleSidebar: () => void;
  targetSessionId?: string | null;
  onSessionActivated?: () => void;
  splitControls?: SplitControls;
}

type Tab = "terminal" | "files" | "changes" | "specs" | "notes";

export function ProjectPanel({ project, onToggleSidebar, targetSessionId, onSessionActivated, splitControls }: ProjectPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("terminal");
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [showToolSelector, setShowToolSelector] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [selectedGitFile, setSelectedGitFile] = useState<string | null>(null);
  const [mobileShowContent, setMobileShowContent] = useState(false);

  const { sessions, createSession } = useSessions();
  const toolsState = useTools();
  const gitStatus = useGitStatus(project.id);
  const projectFiles = useProjectFiles(project.id);
  const specs = useSpecs(project.id);
  const notesState = useNotes(project.id);
  const gitHistory = useGitHistory(project.id);

  // Fetch git status when switching to files or changes tab
  useEffect(() => {
    if (activeTab === "files" || activeTab === "changes") {
      gitStatus.fetchStatus();
    }
  }, [activeTab]);

  const projectSessions = sessions.filter(
    (s) => s.folderPath === project.path,
  );

  // Auto-select latest running session on mount or when sessions change
  useEffect(() => {
    if (activeSession) return;
    const running = projectSessions.filter((s) => s.status === "running");
    if (running.length > 0) {
      setActiveSession(running[running.length - 1]);
    }
  }, [sessions]);

  // Switch to target session when requested from Session Manager
  useEffect(() => {
    if (!targetSessionId) return;
    const target = projectSessions.find((s) => s.id === targetSessionId);
    if (target) {
      setActiveSession(target);
      setActiveTab("terminal");
      setShowToolSelector(false);
      onSessionActivated?.();
    }
  }, [targetSessionId]);

  const currentStatus =
    activeSession && sessions.find((s) => s.id === activeSession.id)?.status;
  const sessionEnded = currentStatus === "ended";

  // Check if the currently viewed file has git changes
  const viewedFileChange = projectFiles.fileContent
    ? gitStatus.changes.find(
        (c) => c.filePath === projectFiles.fileContent!.path,
      )
    : null;

  const [launchMode, setLaunchMode] = useState<"new" | "continue">("new");

  const handleLaunch = () => {
    setLaunchMode("new");
    setShowToolSelector(true);
  };

  const handleContinue = () => {
    setLaunchMode("continue");
    setShowToolSelector(true);
  };

  const handleConfirmLaunch = async () => {
    setLaunching(true);
    try {
      const allowedTools = toolsState.getAllowedTools();
      const session = await createSession(
        project.path,
        allowedTools.length > 0 ? allowedTools : undefined,
        launchMode === "continue",
      );
      setActiveSession(session);
      setShowToolSelector(false);
      setActiveTab("terminal");
    } catch (err) {
      console.error("Launch failed:", err);
    } finally {
      setLaunching(false);
    }
  };

  const handleShell = async () => {
    setLaunching(true);
    try {
      const session = await createSession(project.path, undefined, false, "shell");
      setActiveSession(session);
      setActiveTab("terminal");
    } catch (err) {
      console.error("Shell launch failed:", err);
    } finally {
      setLaunching(false);
    }
  };

  const handleSelectSession = (session: Session) => {
    setActiveSession(session);
    setActiveTab("terminal");
  };

  return (
    <div className="project-panel">
      <div className="panel-header">
        <div className="panel-tabs">
          <button className="hamburger" onClick={onToggleSidebar}>☰</button>
          <button
            className={`panel-tab ${activeTab === "terminal" ? "active" : ""}`}
            onClick={() => { setActiveTab("terminal"); setShowToolSelector(false); setMobileShowContent(false); }}
          >
            Terminal
          </button>
          <button
            className={`panel-tab ${activeTab === "files" ? "active" : ""}`}
            onClick={() => { setActiveTab("files"); setShowToolSelector(false); setMobileShowContent(false); }}
          >
            Files
            {gitStatus.changes.length > 0 && (
              <span className="tab-badge">{gitStatus.changes.length}</span>
            )}
          </button>
          <button
            className={`panel-tab ${activeTab === "changes" ? "active" : ""}`}
            onClick={() => { setActiveTab("changes"); setShowToolSelector(false); setMobileShowContent(false); }}
          >
            Changes
          </button>
          <button
            className={`panel-tab ${activeTab === "specs" ? "active" : ""}`}
            onClick={() => { setActiveTab("specs"); setShowToolSelector(false); specs.fetchFeatures(); }}
          >
            Specs
          </button>
          <button
            className={`panel-tab ${activeTab === "notes" ? "active" : ""}`}
            onClick={() => { setActiveTab("notes"); setShowToolSelector(false); notesState.fetchNotes(); }}
          >
            Notes
          </button>
        </div>
        <div className="panel-actions">
          <button className="continue-button-small" onClick={handleContinue}>
            Continue
          </button>
          <button className="launch-button-small" onClick={handleLaunch}>
            New
          </button>
          <button className="shell-button-small" onClick={handleShell} disabled={launching}>
            Shell
          </button>
          {splitControls && (
            <div className="split-toolbar">
              {!splitControls.splitMode ? (
                <button className="split-btn" onClick={splitControls.onOpenSplit}>Split</button>
              ) : (
                <>
                  {splitControls.onChangeRight && (
                    <button className="split-btn" onClick={splitControls.onChangeRight}>Change</button>
                  )}
                  <button className="split-btn" onClick={splitControls.onToggleDirection}>
                    {splitControls.direction === "h" ? "Vertical" : "Horizontal"}
                  </button>
                  <button className="split-btn" onClick={splitControls.onCloseSplit}>Close</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="panel-content">
        {showToolSelector && (
          <ToolSelector
            tools={toolsState.tools}
            presets={toolsState.presets}
            enabledTools={toolsState.enabledTools}
            activePreset={toolsState.activePreset}
            onToggleTool={toolsState.toggleTool}
            onApplyPreset={toolsState.applyPreset}
            onLaunch={handleConfirmLaunch}
            launching={launching}
          />
        )}

        {!showToolSelector && activeTab === "terminal" && (
          <div className="terminal-tab">
            {projectSessions.length > 0 && (
              <div className="session-tabs">
                {projectSessions.map((s) => (
                  <button
                    key={s.id}
                    className={`session-tab ${activeSession?.id === s.id ? "active" : ""}`}
                    onClick={() => handleSelectSession(s)}
                  >
                    <span className={`activity-badge activity-${s.activity?.status ?? "unknown"}`} />
                    {s.id}
                    {s.activity?.status === "working" && s.activity.toolName && (
                      <span className="activity-tool">{s.activity.toolName}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {activeSession ? (
              <TerminalView
                key={activeSession.id}
                sessionId={activeSession.id}
                folderPath={activeSession.folderPath}
                sessionEnded={sessionEnded}
              />
            ) : (
              <div className="placeholder">
                Click "Launch" to start a Claude Code session.
              </div>
            )}
          </div>
        )}

        {!showToolSelector && activeTab === "files" && (
          <div className={`files-tab ${mobileShowContent ? "mobile-show-content" : ""}`}>
            <ProjectFiles
              projectId={project.id}
              entries={projectFiles.entries}
              loading={projectFiles.loading}
              gitChanges={gitStatus.changes}
              selectedFile={projectFiles.fileContent?.path ?? null}
              onNavigate={projectFiles.fetchEntries}
              onOpenFile={(path) => {
                projectFiles.fetchFileContent(path);
                const change = gitStatus.changes.find((c) => c.filePath === path);
                if (change) {
                  gitStatus.fetchDiff(path);
                } else {
                  gitStatus.clearDiff();
                }
                setMobileShowContent(true);
              }}
            />
            {projectFiles.fileContent ? (
              <FileViewer
                path={projectFiles.fileContent.path}
                content={projectFiles.fileContent.content}
                language={projectFiles.fileContent.language}
                loading={projectFiles.contentLoading}
                hasChanges={!!viewedFileChange}
                diff={gitStatus.selectedDiff}
                diffLoading={gitStatus.diffLoading}
                onClose={() => {
                  projectFiles.clearFileContent();
                  gitStatus.clearDiff();
                  setMobileShowContent(false);
                }}
              />
            ) : (
              <div className="file-viewer">
                <div className="placeholder">
                  Select a file to view its content
                </div>
              </div>
            )}
          </div>
        )}

        {!showToolSelector && activeTab === "changes" && (
          <div className={`changes-tab ${mobileShowContent ? "mobile-show-content" : ""}`}>
            <GitChanges
              changes={gitStatus.changes}
              branch={gitStatus.branch}
              loading={gitStatus.loading}
              isGitRepo={gitStatus.isGitRepo}
              selectedFile={selectedGitFile}
              onSelectFile={(f) => {
                setSelectedGitFile(f);
                projectFiles.fetchFileContent(f);
                const change = gitStatus.changes.find((c) => c.filePath === f);
                if (change) {
                  gitStatus.fetchDiff(f);
                }
                setMobileShowContent(true);
              }}
              onRefresh={gitStatus.fetchStatus}
              commits={gitHistory.commits}
              selectedCommit={gitHistory.selectedCommit}
              commitFiles={gitHistory.commitFiles}
              historyLoading={gitHistory.loading}
              filesLoading={gitHistory.filesLoading}
              hasMore={gitHistory.hasMore}
              onSelectCommit={gitHistory.selectCommit}
              onLoadMore={gitHistory.loadMore}
              onSelectCommitFile={(hash, filePath) => {
                gitHistory.fetchCommitDiff(hash, filePath);
                setMobileShowContent(true);
              }}
              onClearSelection={gitHistory.clearSelection}
              branches={gitHistory.branches}
              currentBranch={gitHistory.currentBranch}
              onFetchBranches={gitHistory.fetchBranches}
              onCheckout={gitHistory.checkoutBranch}
              onFetchLog={() => gitHistory.fetchLog(0)}
              onSearchCommits={(q) => gitHistory.fetchLog(0, q)}
            />
            {gitHistory.commitDiff ? (
              <DiffViewer
                diff={gitHistory.commitDiff}
                loading={gitHistory.diffLoading}
                onClose={() => {
                  gitHistory.clearSelection();
                  setMobileShowContent(false);
                }}
              />
            ) : projectFiles.fileContent && selectedGitFile ? (
              <FileViewer
                path={projectFiles.fileContent.path}
                content={projectFiles.fileContent.content}
                language={projectFiles.fileContent.language}
                loading={projectFiles.contentLoading}
                hasChanges={true}
                diff={gitStatus.selectedDiff}
                diffLoading={gitStatus.diffLoading}
                onClose={() => {
                  setSelectedGitFile(null);
                  projectFiles.clearFileContent();
                  gitStatus.clearDiff();
                  setMobileShowContent(false);
                }}
              />
            ) : (
              <div className="file-viewer">
                <div className="placeholder">
                  Select a file to view
                </div>
              </div>
            )}
          </div>
        )}

        {!showToolSelector && activeTab === "specs" && (
          <div className={`specs-tab ${mobileShowContent ? "mobile-show-content" : ""}`}>
            <SpecBrowser
              features={specs.features}
              featureFiles={specs.featureFiles}
              selectedFeature={specs.selectedFeature}
              selectedFile={specs.selectedFile}
              loading={specs.loading}
              hasSpecs={specs.hasSpecs}
              onSelectFeature={specs.selectFeature}
              onSelectFile={(path) => {
                specs.selectFile(path);
                setMobileShowContent(true);
              }}
              onRefresh={specs.fetchFeatures}
            />
            {specs.content ? (
              <MarkdownViewer
                content={specs.content.content}
                filePath={specs.content.path}
              />
            ) : (
              <div className="markdown-viewer">
                <div className="placeholder">
                  Select a spec file to view
                </div>
              </div>
            )}
          </div>
        )}

        {!showToolSelector && activeTab === "notes" && (
          <NoteList
            projectId={project.id}
            notesState={notesState}
          />
        )}
      </div>
    </div>
  );
}
