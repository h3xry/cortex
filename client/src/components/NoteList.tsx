import { useState, useMemo } from "react";
import { NoteEditor } from "./NoteEditor";
import { NoteViewer } from "./NoteViewer";
import type { NoteMeta, NoteCategory } from "../types";

const CATEGORIES: { value: NoteCategory; label: string; color: string }[] = [
  { value: "idea", label: "Idea", color: "#89b4fa" },
  { value: "meeting", label: "Meeting", color: "#cba6f7" },
  { value: "requirement", label: "Requirement", color: "#94e2d5" },
  { value: "planned", label: "Planned", color: "#f9e2af" },
  { value: "in-progress", label: "In Progress", color: "#fab387" },
  { value: "done", label: "Done", color: "#a6e3a1" },
  { value: "archived", label: "Archived", color: "#6c7086" },
];

const TAG_COLORS: Record<string, { bg: string; fg: string }> = {
  bug:      { bg: "#f38ba8", fg: "#1e1e2e" },
  feature:  { bg: "#89b4fa", fg: "#1e1e2e" },
  todo:     { bg: "#a6e3a1", fg: "#1e1e2e" },
  idea:     { bg: "#cba6f7", fg: "#1e1e2e" },
  meeting:  { bg: "#74c7ec", fg: "#1e1e2e" },
  urgent:   { bg: "#fab387", fg: "#1e1e2e" },
  blocked:  { bg: "#eba0ac", fg: "#1e1e2e" },
  docs:     { bg: "#94e2d5", fg: "#1e1e2e" },
};

// Hash-based color for custom tags
const PALETTE = ["#f9e2af", "#89dceb", "#b4befe", "#f2cdcd", "#cba6f7", "#a6e3a1", "#fab387", "#74c7ec"];
export function getTagStyle(tag: string): { background: string; color: string } {
  const known = TAG_COLORS[tag.toLowerCase()];
  if (known) return { background: known.bg, color: known.fg };
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return { background: PALETTE[Math.abs(hash) % PALETTE.length], color: "#1e1e2e" };
}

type View = "list" | "view" | "edit" | "create";

interface NoteListProps {
  projectId: string;
  notesState: ReturnType<typeof import("../hooks/useNotes").useNotes>;
}

export function NoteList({ projectId, notesState }: NoteListProps) {
  const { notes, loading, fetchNote, createNote, updateNote, deleteNote } = notesState;
  const [view, setView] = useState<View>("list");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<NoteCategory | null>(null);

  // Default tags + collected from notes
  const allTags = useMemo(() => {
    const defaults = ["bug", "feature", "todo", "idea", "meeting", "urgent", "blocked", "docs"];
    const set = new Set<string>(defaults);
    notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [notes]);

  // Filter notes
  const filtered = useMemo(() => {
    let result = notes;
    if (categoryFilter) {
      result = result.filter((n) => n.category === categoryFilter);
    }
    if (tagFilter) {
      result = result.filter((n) => n.tags.includes(tagFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) => n.title.toLowerCase().includes(q) || n.snippet.toLowerCase().includes(q),
      );
    }
    return result;
  }, [notes, categoryFilter, tagFilter, search]);

  const handleOpenNote = (noteId: string) => {
    setActiveNoteId(noteId);
    setView("view");
  };

  const handleEditNote = (noteId: string) => {
    setActiveNoteId(noteId);
    setView("edit");
  };

  const handleNewNote = () => {
    setActiveNoteId(null);
    setView("create");
  };

  const handleBack = () => {
    setView("list");
    setActiveNoteId(null);
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm("Delete this note?")) return;
    await deleteNote(noteId);
    if (activeNoteId === noteId) handleBack();
  };

  const handleTogglePin = async (note: NoteMeta) => {
    await updateNote(note.id, { pinned: !note.pinned });
  };

  if (view === "create") {
    return (
      <NoteEditor
        projectId={projectId}
        allTags={allTags}
        onSave={async (data) => {
          await createNote(data);
          handleBack();
        }}
        onCancel={handleBack}
        onAutoSave={async (data) => {
          // For new notes, create first then switch to edit mode
          const note = await createNote(data);
          setActiveNoteId(note.id);
          setView("edit");
        }}
      />
    );
  }

  if (view === "edit" && activeNoteId) {
    return (
      <NoteEditor
        projectId={projectId}
        noteId={activeNoteId}
        fetchNote={fetchNote}
        allTags={allTags}
        onSave={async (data) => {
          await updateNote(activeNoteId, data);
          handleBack();
        }}
        onCancel={handleBack}
        onAutoSave={async (data) => {
          await updateNote(activeNoteId, data);
        }}
      />
    );
  }

  if (view === "view" && activeNoteId) {
    return (
      <NoteViewer
        noteId={activeNoteId}
        fetchNote={fetchNote}
        onEdit={() => handleEditNote(activeNoteId)}
        onBack={handleBack}
        onDelete={() => handleDelete(activeNoteId)}
      />
    );
  }

  // List view
  return (
    <div className="note-list">
      <div className="note-list-header">
        <input
          type="text"
          className="note-search"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="note-new-btn" onClick={handleNewNote}>+ New</button>
      </div>

      <div className="note-filter-section">
        <span className="note-filter-label">Category</span>
        <div className="note-category-filter">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`note-category-btn ${categoryFilter === cat.value ? "active" : ""}`}
              style={categoryFilter === cat.value
                ? { background: cat.color, color: "#1e1e2e" }
                : { borderColor: cat.color, color: cat.color }
              }
              onClick={() => setCategoryFilter(categoryFilter === cat.value ? null : cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="note-filter-section">
          <span className="note-filter-label">Tags</span>
          <div className="note-tag-filter">
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`note-tag-btn ${tagFilter === tag ? "active" : ""}`}
                style={tagFilter === tag ? getTagStyle(tag) : { borderColor: getTagStyle(tag).background, color: getTagStyle(tag).background }}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              >
                {tag}
              </button>
            ))}
            {tagFilter && (
              <button className="note-tag-clear" onClick={() => setTagFilter(null)}>Clear</button>
            )}
          </div>
        </div>
      )}

      {loading && <div className="note-loading">Loading...</div>}

      {!loading && filtered.length === 0 && (
        <div className="note-empty">
          {search || tagFilter || categoryFilter ? (
            <>No notes found. <button className="note-clear-btn" onClick={() => { setSearch(""); setTagFilter(null); setCategoryFilter(null); }}>Clear filters</button></>
          ) : (
            <>No notes yet. Click "+ New" to create one.</>
          )}
        </div>
      )}

      {filtered.map((note) => (
        <div key={note.id} className={`note-card ${note.pinned ? "pinned" : ""}`} onClick={() => handleOpenNote(note.id)}>
          <div className="note-card-header">
            <button
              className={`note-pin-btn ${note.pinned ? "active" : ""}`}
              onClick={(e) => { e.stopPropagation(); handleTogglePin(note); }}
              title={note.pinned ? "Unpin" : "Pin"}
            >
              {note.pinned ? "📌" : "📍"}
            </button>
            <span className="note-card-id">#{note.id}</span>
            <span
              className="note-card-category"
              style={{ color: CATEGORIES.find((c) => c.value === note.category)?.color ?? "#6c7086" }}
            >
              {CATEGORIES.find((c) => c.value === note.category)?.label ?? note.category}
            </span>
            <span className="note-card-title">{note.title}</span>
            <button
              className="note-delete-btn"
              onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
              title="Delete"
            >
              x
            </button>
          </div>
          {note.tags.length > 0 && (
            <div className="note-card-tags">
              {note.tags.map((tag) => (
                <span key={tag} className="note-tag" style={getTagStyle(tag)}>{tag}</span>
              ))}
            </div>
          )}
          {note.snippet && <p className="note-card-snippet">{note.snippet}</p>}
          <span className="note-card-date">{new Date(note.updatedAt).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}
