import { useState } from "react";

interface UnlockModalProps {
  onUnlock: (password: string) => Promise<void>;
  onCancel: () => void;
  title?: string;
  description?: string;
  buttonLabel?: string;
}

export function UnlockModal({
  onUnlock,
  onCancel,
  title = "Unlock Private Projects",
  description = "Enter your password to show hidden projects.",
  buttonLabel = "Unlock",
}: UnlockModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      await onUnlock(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p className="modal-description">{description}</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Enter password"
          className="modal-input"
          autoFocus
        />
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="modal-btn-confirm"
            onClick={handleSubmit}
            disabled={loading || !password}
          >
            {loading ? "..." : buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
