import { useState, useEffect } from "react";
import { TerminalView } from "./TerminalView";
import { ToolSelector } from "./ToolSelector";
import { GitChanges } from "./GitChanges";
import { DiffViewer } from "./DiffViewer";
import { ProjectFiles } from "./ProjectFiles";
import { FileViewer } from "./FileViewer";
import { SpecBrowser } from "./SpecBrowser";
import { MarkdownViewer } from "./MarkdownViewer";
import { useSessions } from "../hooks/useSessions";
import { useTools } from "../hooks/useTools";
import { useGitStatus } from "../hooks/useGitStatus";
import { useProjectFiles } from "../hooks/useProjectFiles";
import { useSpecs } from "../hooks/useSpecs";
import type { Project, Session } from "../types";

interface ProjectPanelProps {
  project: Project;
}

type Tab = "terminal" | "files" | "changes" | "specs";

export function ProjectPanel({ project }: ProjectPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("terminal");
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [showToolSelector, setShowToolSelector] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [selectedGitFile, setSelectedGitFile] = useState<string | null>(null);

  const { sessions, createSession } = useSessions();
  const toolsState = useTools();
  const gitStatus = useGitStatus(project.id);
  const projectFiles = useProjectFiles(project.id);
  const specs = useSpecs(project.id);

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

  const currentStatus =
    activeSession && sessions.find((s) => s.id === activeSession.id)?.status;
  const sessionEnded = currentStatus === "ended";

  // Check if the currently viewed file has git changes
  const viewedFileChange = projectFiles.fileContent
    ? gitStatus.changes.find(
        (c) => c.filePath === projectFiles.fileContent!.path,
      )
    : null;

  const handleLaunch = () => setShowToolSelector(true);

  const handleConfirmLaunch = async () => {
    setLaunching(true);
    try {
      const allowedTools = toolsState.getAllowedTools();
      const session = await createSession(
        project.path,
        allowedTools.length > 0 ? allowedTools : undefined,
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

  const handleSelectSession = (session: Session) => {
    setActiveSession(session);
    setActiveTab("terminal");
  };

  return (
    <div className="project-panel">
      <div className="panel-header">
        <div className="panel-tabs">
          <button
            className={`panel-tab ${activeTab === "terminal" ? "active" : ""}`}
            onClick={() => { setActiveTab("terminal"); setShowToolSelector(false); }}
          >
            Terminal
          </button>
          <button
            className={`panel-tab ${activeTab === "files" ? "active" : ""}`}
            onClick={() => { setActiveTab("files"); setShowToolSelector(false); }}
          >
            Files
            {gitStatus.changes.length > 0 && (
              <span className="tab-badge">{gitStatus.changes.length}</span>
            )}
          </button>
          <button
            className={`panel-tab ${activeTab === "changes" ? "active" : ""}`}
            onClick={() => { setActiveTab("changes"); setShowToolSelector(false); }}
          >
            Changes
          </button>
          <button
            className={`panel-tab ${activeTab === "specs" ? "active" : ""}`}
            onClick={() => { setActiveTab("specs"); setShowToolSelector(false); specs.fetchFeatures(); }}
          >
            Specs
          </button>
        </div>
        <div className="panel-actions">
          <button className="launch-button-small" onClick={handleLaunch}>
            Launch
          </button>
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
                    <span className={`status-badge status-${s.status}`} />
                    {s.id}
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
          <div className="files-tab">
            <ProjectFiles
              projectId={project.id}
              entries={projectFiles.entries}
              loading={projectFiles.loading}
              gitChanges={gitStatus.changes}
              selectedFile={projectFiles.fileContent?.path ?? null}
              onNavigate={projectFiles.fetchEntries}
              onOpenFile={(path) => {
                projectFiles.fetchFileContent(path);
                // Auto-fetch diff if file has git changes
                const change = gitStatus.changes.find((c) => c.filePath === path);
                if (change) {
                  gitStatus.fetchDiff(path);
                } else {
                  gitStatus.clearDiff();
                }
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
                onRequestDiff={() =>
                  gitStatus.fetchDiff(projectFiles.fileContent!.path)
                }
                onClose={() => {
                  projectFiles.clearFileContent();
                  gitStatus.clearDiff();
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
          <div className="changes-tab">
            <GitChanges
              changes={gitStatus.changes}
              branch={gitStatus.branch}
              loading={gitStatus.loading}
              isGitRepo={gitStatus.isGitRepo}
              selectedFile={selectedGitFile}
              onSelectFile={(f) => {
                setSelectedGitFile(f);
                gitStatus.fetchDiff(f);
              }}
              onRefresh={gitStatus.fetchStatus}
            />
            {gitStatus.selectedDiff && (
              <DiffViewer
                diff={gitStatus.selectedDiff}
                loading={gitStatus.diffLoading}
                onClose={() => {
                  setSelectedGitFile(null);
                  gitStatus.clearDiff();
                }}
              />
            )}
          </div>
        )}

        {!showToolSelector && activeTab === "specs" && (
          <div className="specs-tab">
            <SpecBrowser
              features={specs.features}
              featureFiles={specs.featureFiles}
              selectedFeature={specs.selectedFeature}
              selectedFile={specs.selectedFile}
              loading={specs.loading}
              hasSpecs={specs.hasSpecs}
              onSelectFeature={specs.selectFeature}
              onSelectFile={specs.selectFile}
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
      </div>
    </div>
  );
}
