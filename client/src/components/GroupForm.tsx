import { useState } from "react";
import type { Group } from "../types";

const COLOR_PALETTE = [
  "#f38ba8", "#fab387", "#f9e2af", "#a6e3a1", "#94e2d5",
  "#89b4fa", "#cba6f7", "#f2cdcd", "#74c7ec", "#eba0ac",
];

const EMOJI_GRID = [
  "🏢", "🏠", "💼", "🚀", "🔧", "📱", "🎮", "🎨",
  "📚", "🧪", "💡", "🔒", "🌐", "⚡", "🛠️", "📦",
  "🤖", "🎯", "📊", "🗂️", "💰", "🏗️", "🔬", "🎵",
];

interface GroupFormProps {
  group?: Group | null;
  onSave: (data: { name: string; icon: string; color: string; isPrivate: boolean }) => void;
  onCancel: () => void;
}

export function GroupForm({ group, onSave, onCancel }: GroupFormProps) {
  const [name, setName] = useState(group?.name ?? "");
  const [icon, setIcon] = useState(group?.icon ?? "📁");
  const [color, setColor] = useState(group?.color ?? COLOR_PALETTE[5]);
  const [isPrivate, setIsPrivate] = useState(group?.isPrivate ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), icon, color, isPrivate });
  };

  return (
    <div className="group-form-overlay" onClick={onCancel}>
      <form className="group-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>{group ? "Edit Group" : "New Group"}</h3>

        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name..."
            autoFocus
          />
        </label>

        <div className="group-form-section">
          <span className="group-form-label">Icon</span>
          <div className="group-emoji-grid">
            {EMOJI_GRID.map((e) => (
              <button
                key={e}
                type="button"
                className={`group-emoji-btn ${icon === e ? "active" : ""}`}
                onClick={() => setIcon(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="group-form-section">
          <span className="group-form-label">Color</span>
          <div className="group-color-grid">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                className={`group-color-btn ${color === c ? "active" : ""}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <label className="group-form-private">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          Private Group (hidden when locked)
        </label>

        <div className="group-form-preview">
          <span style={{ borderLeft: `3px solid ${color}`, paddingLeft: 8 }}>
            {icon} {name || "Group Name"} {isPrivate ? "🔒" : ""}
          </span>
        </div>

        <div className="group-form-actions">
          <button type="button" className="group-form-cancel" onClick={onCancel}>Cancel</button>
          <button type="submit" className="group-form-save">Save</button>
        </div>
      </form>
    </div>
  );
}
