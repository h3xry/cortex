import type { FileEntry } from "../types";

interface SpecBrowserProps {
  features: FileEntry[];
  featureFiles: FileEntry[];
  selectedFeature: string | null;
  selectedFile: string | null;
  loading: boolean;
  hasSpecs: boolean;
  onSelectFeature: (path: string) => void;
  onSelectFile: (path: string) => void;
  onRefresh: () => void;
}

export function SpecBrowser({
  features,
  featureFiles,
  selectedFeature,
  selectedFile,
  loading,
  hasSpecs,
  onSelectFeature,
  onSelectFile,
  onRefresh,
}: SpecBrowserProps) {
  if (!hasSpecs) {
    return (
      <div className="spec-browser">
        <div className="spec-browser-header">
          <h4>Specs</h4>
        </div>
        <div className="empty-message">No specs found</div>
      </div>
    );
  }

  return (
    <div className="spec-browser">
      <div className="spec-browser-header">
        <h4>Specs</h4>
        <button className="refresh-button" onClick={onRefresh}>
          {loading ? "..." : "↻"}
        </button>
      </div>

      <div className="spec-feature-list">
        {features.map((feature) => (
          <div key={feature.path}>
            <button
              className={`spec-feature-item ${selectedFeature === feature.path ? "active" : ""}`}
              onClick={() => onSelectFeature(feature.path)}
            >
              {selectedFeature === feature.path ? "▼" : "▶"}{" "}
              {feature.name}
            </button>

            {selectedFeature === feature.path && (
              <div className="spec-file-list">
                {featureFiles.map((file) => (
                  <button
                    key={file.path}
                    className={`spec-file-item ${selectedFile === file.path ? "active" : ""}`}
                    onClick={() => onSelectFile(file.path)}
                  >
                    {file.type === "directory" ? "📁" : "📄"} {file.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
