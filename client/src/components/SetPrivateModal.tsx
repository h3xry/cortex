import { useState } from "react";

interface SetPrivateModalProps {
  projectName: string;
  hasGlobalPassword: boolean;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
}

export function SetPrivateModal({
  projectName,
  hasGlobalPassword,
  onConfirm,
  onCancel,
}: SetPrivateModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConfirm(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Set Private: {projectName}</h3>
        <p className="modal-description">
          {hasGlobalPassword
            ? "Enter your private password to hide this project."
            : "Set a password to hide projects. This password will be used for all private projects."}
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={hasGlobalPassword ? "Enter password" : "Set new password (min 4 chars)"}
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
            disabled={loading}
          >
            {loading ? "..." : "Set Private"}
          </button>
        </div>
      </div>
    </div>
  );
}
