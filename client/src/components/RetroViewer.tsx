import { useEffect, useState, useMemo } from "react";
import MDEditor from "@uiw/react-md-editor";
import rehypeRaw from "rehype-raw";
import { MermaidBlock } from "./MermaidBlock";

const codeRenderer = {
  code: ({ children, className, ...props }: any) => {
    if (/language-mermaid/.exec(className || "")) {
      return <MermaidBlock code={String(children).replace(/\n$/, "")} />;
    }
    return <code className={className} {...props}>{children}</code>;
  },
};
import { RetroList } from "./RetroList";
import { useRetros } from "../hooks/useRetros";
import type { Project } from "../types";

interface RetroViewerProps {
  projects: Project[];
  onToggleSidebar: () => void;
  unlocked: boolean;
}

export function RetroViewer({ projects, onToggleSidebar, unlocked }: RetroViewerProps) {
  const retros = useRetros();
  const [mobileShowContent, setMobileShowContent] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    retros.fetchRetros(retros.projectFilter);
    retros.fetchLessons(retros.projectFilter);
  }, [retros.projectFilter, unlocked]);

  const q = search.toLowerCase();
  const filteredRetros = useMemo(() => {
    if (!q) return retros.retros;
    return retros.retros.filter((r) =>
      r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q) || r.projectName.toLowerCase().includes(q)
    );
  }, [retros.retros, q]);

  const filteredLessons = useMemo(() => {
    if (!q) return retros.lessons;
    return retros.lessons.filter((l) =>
      l.content.toLowerCase().includes(q) || l.projectName.toLowerCase().includes(q) || l.date.includes(q)
    );
  }, [retros.lessons, q]);

  const selectedContent = retros.selectedRetro?.content ?? retros.selectedLesson?.content ?? null;

  const selectedId = retros.selectedRetro
    ? `${retros.selectedRetro.projectId}-${retros.selectedRetro.date}-${retros.selectedRetro.filename}`
    : retros.selectedLesson
      ? `${retros.selectedLesson.projectId}-${retros.selectedLesson.date}-${retros.selectedLesson.filename}`
      : null;

  return (
    <div className={`retro-viewer ${mobileShowContent ? "mobile-show-content" : ""}`}>
      <div className="retro-viewer-sidebar">
        <div className="retro-viewer-header">
          <button className="hamburger" onClick={onToggleSidebar}>☰</button>
          <h2 className="retro-viewer-title">Retrospectives</h2>
        </div>

        {/* Search + Filter */}
        <div className="retro-filter">
          <input
            type="text"
            className="retro-search"
            placeholder="Search retros & lessons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={retros.projectFilter ?? ""}
            onChange={(e) => retros.filterByProject(e.target.value || null)}
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="retro-tabs">
          <button
            className={`retro-tab ${retros.activeTab === "retros" ? "active" : ""}`}
            onClick={() => retros.switchTab("retros")}
          >
            Retros ({retros.retros.length})
          </button>
          <button
            className={`retro-tab ${retros.activeTab === "lessons" ? "active" : ""}`}
            onClick={() => retros.switchTab("lessons")}
          >
            Lessons ({retros.lessons.length})
          </button>
          <button
            className={`retro-tab ${retros.activeTab === "starred" ? "active" : ""}`}
            onClick={() => retros.switchTab("starred")}
          >
            ★ Starred ({retros.starred.size})
          </button>
        </div>

        {/* List */}
        {retros.activeTab === "retros" ? (
          <RetroList
            retros={filteredRetros}
            selectedId={selectedId}
            onSelectRetro={(r) => { retros.setSelectedRetro(r); retros.setSelectedLesson(null); setMobileShowContent(true); }}
            loading={retros.loading}
            emptyMessage="No retrospectives yet"
            isStarred={retros.isStarred}
            onToggleStar={retros.toggleStar}
          />
        ) : retros.activeTab === "lessons" ? (
          <RetroList
            lessons={filteredLessons}
            selectedId={selectedId}
            onSelectLesson={(l) => { retros.setSelectedLesson(l); retros.setSelectedRetro(null); setMobileShowContent(true); }}
            loading={retros.loading}
            emptyMessage="No lessons yet"
            isStarred={retros.isStarred}
            onToggleStar={retros.toggleStar}
          />
        ) : (
          <RetroList
            retros={filteredRetros.filter((r) => retros.isStarred(`${r.projectId}-${r.date}-${r.filename}`))}
            lessons={filteredLessons.filter((l) => retros.isStarred(`${l.projectId}-${l.date}-${l.filename}`))}
            selectedId={selectedId}
            onSelectRetro={(r) => { retros.setSelectedRetro(r); retros.setSelectedLesson(null); setMobileShowContent(true); }}
            onSelectLesson={(l) => { retros.setSelectedLesson(l); retros.setSelectedRetro(null); setMobileShowContent(true); }}
            loading={retros.loading}
            emptyMessage="No starred items yet"
            isStarred={retros.isStarred}
            onToggleStar={retros.toggleStar}
          />
        )}
      </div>

      {/* Content */}
      <div className="retro-viewer-content" data-color-mode="dark">
        {selectedContent ? (
          <>
            <div className="retro-content-header">
              <button
                className="retro-back-btn"
                onClick={() => {
                  retros.setSelectedRetro(null);
                  retros.setSelectedLesson(null);
                  setMobileShowContent(false);
                }}
              >
                ← Back
              </button>
            </div>
            <div className="retro-content-body">
              <MDEditor.Markdown source={selectedContent} rehypePlugins={[rehypeRaw]} components={codeRenderer} />
            </div>
          </>
        ) : (
          <div className="retro-content-empty">
            Select a retrospective or lesson to read
          </div>
        )}
      </div>
    </div>
  );
}
