import type { ToolConfig, ToolPreset } from "../types";

interface ToolSelectorProps {
  tools: ToolConfig[];
  presets: ToolPreset[];
  enabledTools: Set<string>;
  activePreset: string;
  onToggleTool: (name: string) => void;
  onApplyPreset: (name: string) => void;
  onLaunch: () => void;
  launching: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  file: "File Operations",
  system: "System",
  web: "Web",
  agent: "Agent",
};

export function ToolSelector({
  tools,
  presets,
  enabledTools,
  activePreset,
  onToggleTool,
  onApplyPreset,
  onLaunch,
  launching,
}: ToolSelectorProps) {
  const categories = [...new Set(tools.map((t) => t.category))];
  const hasAnyTool = enabledTools.size > 0;

  return (
    <div className="tool-selector">
      <h3>Tool Permissions</h3>

      <div className="tool-presets">
        {presets.map((preset) => (
          <button
            key={preset.name}
            className={`preset-button ${activePreset === preset.name ? "active" : ""}`}
            onClick={() => onApplyPreset(preset.name)}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="tool-categories">
        {categories.map((cat) => (
          <div key={cat} className="tool-category">
            <div className="category-label">
              {CATEGORY_LABELS[cat] ?? cat}
            </div>
            <div className="tool-list">
              {tools
                .filter((t) => t.category === cat)
                .map((tool) => (
                  <label key={tool.name} className="tool-item">
                    <input
                      type="checkbox"
                      checked={enabledTools.has(tool.name)}
                      onChange={() => onToggleTool(tool.name)}
                    />
                    <span className="tool-name">{tool.displayName}</span>
                  </label>
                ))}
            </div>
          </div>
        ))}
      </div>

      <button
        className="launch-button"
        onClick={onLaunch}
        disabled={!hasAnyTool || launching}
      >
        {launching
          ? "Launching..."
          : !hasAnyTool
            ? "Select at least 1 tool"
            : "Launch Session"}
      </button>
    </div>
  );
}
