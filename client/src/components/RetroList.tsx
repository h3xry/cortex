import type { RetroEntry, LessonEntry } from "../types";

interface RetroListProps {
  retros?: RetroEntry[];
  lessons?: LessonEntry[];
  selectedId: string | null;
  onSelectRetro?: (r: RetroEntry) => void;
  onSelectLesson?: (l: LessonEntry) => void;
  loading: boolean;
  emptyMessage: string;
  isStarred?: (id: string) => boolean;
  onToggleStar?: (id: string) => void;
}

const PROJECT_COLORS = [
  "#89b4fa", "#a6e3a1", "#f9e2af", "#f38ba8", "#cba6f7",
  "#94e2d5", "#fab387", "#74c7ec", "#b4befe", "#f2cdcd",
];

function getProjectColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
}

function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function makeRetroId(r: RetroEntry): string {
  return `${r.projectId}-${r.date}-${r.filename}`;
}

function makeLessonId(l: LessonEntry): string {
  return `${l.projectId}-${l.date}-${l.filename}`;
}

export function RetroList({
  retros, lessons, selectedId, onSelectRetro, onSelectLesson, loading, emptyMessage, isStarred, onToggleStar,
}: RetroListProps) {
  if (loading) {
    return <div className="retro-list"><div className="retro-list-empty">Loading...</div></div>;
  }

  if (retros && retros.length === 0) {
    return <div className="retro-list"><div className="retro-list-empty">{emptyMessage}</div></div>;
  }

  if (lessons && lessons.length === 0) {
    return <div className="retro-list"><div className="retro-list-empty">{emptyMessage}</div></div>;
  }

  return (
    <div className="retro-list">
      {retros?.map((r) => {
        const id = makeRetroId(r);
        const starred = isStarred?.(id) ?? false;
        return (
          <div
            key={id}
            className={`retro-list-item ${selectedId === id ? "selected" : ""}`}
            onClick={() => onSelectRetro?.(r)}
          >
            <div className="retro-list-item-top">
              <span className="retro-project-badge" style={{ background: getProjectColor(r.projectName) }}>
                {r.projectName}
              </span>
              <span className="retro-list-date">{formatDate(r.date)}</span>
              {onToggleStar && (
                <button
                  className={`retro-star-btn ${starred ? "active" : ""}`}
                  onClick={(e) => { e.stopPropagation(); onToggleStar(id); }}
                >
                  {starred ? "★" : "☆"}
                </button>
              )}
            </div>
            <div className="retro-list-title">{r.title}</div>
          </div>
        );
      })}

      {lessons?.map((l) => {
        const id = makeLessonId(l);
        const starred = isStarred?.(id) ?? false;
        return (
          <div
            key={id}
            className={`retro-list-item ${selectedId === id ? "selected" : ""}`}
            onClick={() => onSelectLesson?.(l)}
          >
            <div className="retro-list-item-top">
              <span className="retro-project-badge" style={{ background: getProjectColor(l.projectName) }}>
                {l.projectName}
              </span>
              <span className="retro-list-date">{formatDate(l.date)}</span>
              {onToggleStar && (
                <button
                  className={`retro-star-btn ${starred ? "active" : ""}`}
                  onClick={(e) => { e.stopPropagation(); onToggleStar(id); }}
                >
                  {starred ? "★" : "☆"}
                </button>
              )}
            </div>
            <div className="retro-list-title">Lesson — {l.date}</div>
          </div>
        );
      })}
    </div>
  );
}
