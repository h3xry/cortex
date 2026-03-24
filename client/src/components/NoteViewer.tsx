import { useState, useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";
import type { Note } from "../types";
import { getTagStyle } from "./NoteList";

interface NoteViewerProps {
  noteId: string;
  fetchNote: (noteId: string) => Promise<Note | null>;
  onEdit: () => void;
  onBack: () => void;
  onDelete: () => void;
}

export function NoteViewer({ noteId, fetchNote, onEdit, onBack, onDelete }: NoteViewerProps) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchNote(noteId).then((n) => {
      setNote(n);
      setLoading(false);
    });
  }, [noteId, fetchNote]);

  if (loading) return <div className="note-viewer"><div className="note-loading">Loading...</div></div>;
  if (!note) return <div className="note-viewer"><div className="note-empty">Note not found</div></div>;

  return (
    <div className="note-viewer" data-color-mode="dark">
      <div className="note-viewer-header">
        <button className="note-back-btn" onClick={onBack}>Back</button>
        <div className="note-viewer-actions">
          <button className="note-edit-btn" onClick={onEdit}>Edit</button>
          <button className="note-delete-btn" onClick={onDelete}>Delete</button>
        </div>
      </div>

      <h2 className="note-viewer-title">{note.title}</h2>

      {note.tags.length > 0 && (
        <div className="note-viewer-tags">
          {note.tags.map((tag) => (
            <span key={tag} className="note-tag" style={getTagStyle(tag)}>{tag}</span>
          ))}
        </div>
      )}

      <div className="note-viewer-meta">
        Created: {new Date(note.createdAt).toLocaleString()} | Updated: {new Date(note.updatedAt).toLocaleString()}
      </div>

      <div className="note-viewer-content">
        <MDEditor.Markdown source={note.content} />
      </div>
    </div>
  );
}
