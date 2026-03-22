import { useState } from "react";

interface LaunchButtonProps {
  selectedPath: string | null;
  onLaunch: () => Promise<void>;
  error: string | null;
}

export function LaunchButton({
  selectedPath,
  onLaunch,
  error,
}: LaunchButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onLaunch();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="launch-section">
      <button
        className="launch-button"
        onClick={handleClick}
        disabled={!selectedPath || loading}
      >
        {loading ? "Launching..." : "Launch Claude Code"}
      </button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
