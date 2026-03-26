import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import MDEditor from "@uiw/react-md-editor";
import type { Note, NoteCategory } from "../types";

const CATEGORIES: { value: NoteCategory; label: string; color: string }[] = [
  { value: "idea", label: "Idea", color: "#89b4fa" },
  { value: "meeting", label: "Meeting", color: "#cba6f7" },
  { value: "requirement", label: "Requirement", color: "#94e2d5" },
  { value: "planned", label: "Planned", color: "#f9e2af" },
  { value: "in-progress", label: "In Progress", color: "#fab387" },
  { value: "done", label: "Done", color: "#a6e3a1" },
  { value: "archived", label: "Archived", color: "#6c7086" },
];

interface NoteEditorProps {
  projectId: string;
  noteId?: string;
  fetchNote?: (noteId: string) => Promise<Note | null>;
  onSave: (data: { title?: string; content?: string; tags?: string[]; category?: NoteCategory }) => Promise<void>;
  onCancel: () => void;
  onAutoSave?: (data: { title?: string; content?: string; tags?: string[]; category?: NoteCategory }) => Promise<void>;
  allTags?: string[];
}

export function NoteEditor({ noteId, fetchNote, onSave, onCancel, onAutoSave, allTags = [] }: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState<NoteCategory>("idea");
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasChanges = useRef(false);

  // Load existing note
  useEffect(() => {
    if (!noteId || !fetchNote) return;
    setLoading(true);
    fetchNote(noteId).then((note) => {
      if (note) {
        setTitle(note.title === "Untitled" ? "" : note.title);
        setContent(note.content);
        setTags(note.tags);
        setCategory(note.category ?? "idea");
      }
      setLoading(false);
    });
  }, [noteId, fetchNote]);

  // Auto-save debounce
  const scheduleAutoSave = useCallback(() => {
    if (!onAutoSave || !hasChanges.current) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await onAutoSave({ title: title.trim() || undefined, content, tags, category });
      } catch {
        // silent
      }
      setSaving(false);
      hasChanges.current = false;
    }, 5000);
  }, [onAutoSave, title, content, tags]);

  // Trigger auto-save on changes
  useEffect(() => {
    if (noteId) scheduleAutoSave();
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [title, content, tags, noteId, scheduleAutoSave]);

  // Auto-save on blur
  useEffect(() => {
    const handleBlur = () => {
      if (onAutoSave && hasChanges.current && noteId) {
        onAutoSave({ title: title.trim() || undefined, content, tags });
        hasChanges.current = false;
      }
    };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [onAutoSave, noteId, title, content, tags]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    hasChanges.current = true;
  };

  const handleContentChange = (val: string | undefined) => {
    setContent(val ?? "");
    hasChanges.current = true;
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      hasChanges.current = true;
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    hasChanges.current = true;
  };

  // Tag suggestions: filter allTags that match input and aren't already added
  const suggestions = useMemo(() => {
    if (!tagInput.trim()) return allTags.filter((t) => !tags.includes(t));
    const q = tagInput.toLowerCase();
    return allTags.filter((t) => t.toLowerCase().includes(q) && !tags.includes(t));
  }, [tagInput, allTags, tags]);

  const handleSelectSuggestion = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
      hasChanges.current = true;
    }
    setTagInput("");
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    await onSave({ title: title.trim() || undefined, content, tags, category });
  };

  if (loading) return <div className="note-editor"><div className="note-loading">Loading...</div></div>;

  return (
    <div className="note-editor" data-color-mode="dark">
      <div className="note-editor-header">
        <button className="note-back-btn" onClick={onCancel}>Back</button>
        {noteId && <span className="note-editor-id">#{noteId}</span>}
        <span className="note-editor-status">{saving ? "Saving..." : ""}</span>
        <button className="note-save-btn" onClick={handleSave}>Save</button>
      </div>

      <input
        type="text"
        className="note-title-input"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="Note title..."
        autoFocus
      />

      <div className="note-category-selector">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            className={`note-category-opt ${category === cat.value ? "active" : ""}`}
            style={category === cat.value
              ? { background: cat.color, color: "#1e1e2e" }
              : { borderColor: cat.color, color: cat.color }
            }
            onClick={() => { setCategory(cat.value); hasChanges.current = true; scheduleAutoSave(); }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="note-tags-editor">
        {tags.map((tag) => (
          <span key={tag} className="note-tag">
            {tag}
            <button className="note-tag-remove" onClick={() => handleRemoveTag(tag)}>x</button>
          </span>
        ))}
        <div className="note-tag-input-wrap">
          <input
            type="text"
            className="note-tag-input"
            value={tagInput}
            onChange={(e) => { setTagInput(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleAddTag(); }
              if (e.key === "Escape") setShowSuggestions(false);
            }}
            placeholder="Add tag..."
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="note-tag-suggestions">
              {suggestions.map((s) => (
                <button key={s} className="note-tag-suggestion" onMouseDown={() => handleSelectSuggestion(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="note-md-editor">
        <MDEditor
          value={content}
          onChange={handleContentChange}
          height="100%"
          preview="edit"
          visibleDragbar={false}
        />
      </div>
    </div>
  );
}
