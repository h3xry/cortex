import { useState } from "react";
import type { Project } from "../types";

interface PanelSelectorProps {
  projects: Project[];
  onSelect: (project: Project) => void;
}

export function PanelSelector({ projects, onSelect }: PanelSelectorProps) {
  const [selectedId, setSelectedId] = useState<string>("");

  const handleOpen = () => {
    const project = projects.find((p) => p.id === selectedId);
    if (project) onSelect(project);
  };

  return (
    <div className="panel-selector">
      <h3>Select Project</h3>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        <option value="">-- Choose project --</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <button
        className="panel-selector-open"
        onClick={handleOpen}
        disabled={!selectedId}
      >
        Open
      </button>
    </div>
  );
}
