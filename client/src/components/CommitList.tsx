import type { Commit } from "../types";

interface CommitListProps {
  commits: Commit[];
  selectedHash: string | null;
  loading: boolean;
  hasMore: boolean;
  onSelect: (commit: Commit) => void;
  onLoadMore: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function CommitList({ commits, selectedHash, loading, hasMore, onSelect, onLoadMore }: CommitListProps) {
  if (loading && commits.length === 0) {
    return <div className="commit-list"><div className="commit-list-empty">Loading...</div></div>;
  }

  if (commits.length === 0) {
    return <div className="commit-list"><div className="commit-list-empty">No commits yet</div></div>;
  }

  return (
    <div className="commit-list">
      {commits.map((c) => (
        <div
          key={c.hash}
          className={`commit-item ${selectedHash === c.hash ? "selected" : ""}`}
          onClick={() => onSelect(c)}
        >
          <div className="commit-item-top">
            <span className="commit-hash">{c.shortHash}</span>
            <span className="commit-date">{timeAgo(c.date)}</span>
          </div>
          <div className="commit-message">{c.message}</div>
          <div className="commit-author">{c.authorName}</div>
        </div>
      ))}
      {hasMore && (
        <button className="commit-load-more" onClick={onLoadMore} disabled={loading}>
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
