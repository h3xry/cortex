import { useState } from "react";
import type { Branch } from "../types";

interface BranchSelectorProps {
  currentBranch: string | null;
  branches: Branch[];
  onFetchBranches: () => void;
  onCheckout: (branch: string) => Promise<{ success: boolean; error?: string }>;
}

export function BranchSelector({ currentBranch, branches, onFetchBranches, onCheckout }: BranchSelectorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    if (!open) onFetchBranches();
    setOpen(!open);
    setError(null);
  };

  const handleCheckout = async (branch: string) => {
    if (branch === currentBranch) { setOpen(false); return; }
    setLoading(true);
    setError(null);
    const result = await onCheckout(branch);
    setLoading(false);
    if (result.success) {
      setOpen(false);
    } else {
      setError(result.error || "Checkout failed");
    }
  };

  const localBranches = branches.filter((b) => !b.isRemote);
  const remoteBranches = branches.filter((b) => b.isRemote);

  return (
    <div className="branch-selector">
      <button className="branch-selector-btn" onClick={handleOpen} disabled={loading}>
        <span className="branch-icon">⑂</span>
        <span className="branch-name">{currentBranch ?? "(detached)"}</span>
        <span className="branch-arrow">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="branch-dropdown">
          {error && <div className="branch-error">{error}</div>}
          {branches.length === 0 ? (
            <div className="branch-empty">Loading...</div>
          ) : (
            <>
              {localBranches.length > 0 && (
                <div className="branch-group">
                  <div className="branch-group-label">Local</div>
                  {localBranches.map((b) => (
                    <button
                      key={b.name}
                      className={`branch-item ${b.isCurrent ? "current" : ""}`}
                      onClick={() => handleCheckout(b.name)}
                      disabled={loading}
                    >
                      {b.isCurrent && <span className="branch-current-dot">●</span>}
                      <span>{b.name}</span>
                      <span className="branch-item-hash">{b.shortHash}</span>
                    </button>
                  ))}
                </div>
              )}
              {remoteBranches.length > 0 && (
                <div className="branch-group">
                  <div className="branch-group-label">Remote</div>
                  {remoteBranches.map((b) => (
                    <button
                      key={b.name}
                      className={`branch-item remote`}
                      onClick={() => handleCheckout(b.name)}
                      disabled={loading}
                    >
                      <span>{b.name}</span>
                      <span className="branch-item-hash">{b.shortHash}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
