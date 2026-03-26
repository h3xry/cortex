import { useState, useEffect, useCallback } from "react";
import type { Note, NoteMeta } from "../types";
import { getAuthHeaders } from "../unlock-token";

export function useNotes(projectId: string) {
  const [notes, setNotes] = useState<NoteMeta[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/notes`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
      }
    } catch {
      // silent on poll
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const fetchNote = useCallback(async (noteId: string): Promise<Note | null> => {
    const res = await fetch(`/api/projects/${projectId}/notes/${noteId}`, { headers: getAuthHeaders() });
    if (!res.ok) return null;
    return res.json();
  }, [projectId]);

  const createNote = useCallback(async (data: { title?: string; content?: string; tags?: string[] }): Promise<Note> => {
    const res = await fetch(`/api/projects/${projectId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error ?? "Failed to create note");
    }
    const note = await res.json();
    await fetchNotes();
    return note;
  }, [projectId, fetchNotes]);

  const updateNote = useCallback(async (noteId: string, data: Partial<Pick<Note, "title" | "content" | "tags" | "category" | "pinned">>) => {
    const res = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error ?? "Failed to update note");
    }
    await fetchNotes();
  }, [projectId, fetchNotes]);

  const deleteNote = useCallback(async (noteId: string) => {
    const res = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error ?? "Failed to delete note");
    }
    await fetchNotes();
  }, [projectId, fetchNotes]);

  return { notes, loading, fetchNotes, fetchNote, createNote, updateNote, deleteNote };
}
