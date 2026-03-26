import type { DiffHunk, DiffLine } from "../types";

interface SideBySideDiffProps {
  hunks: DiffHunk[];
}

interface SideBySideRow {
  left: DiffLine | null;
  right: DiffLine | null;
}

function pairLines(hunks: DiffHunk[]): SideBySideRow[] {
  const rows: SideBySideRow[] = [];

  for (const hunk of hunks) {
    // Hunk separator
    rows.push({ left: null, right: null });

    let i = 0;
    while (i < hunk.lines.length) {
      const line = hunk.lines[i];

      if (line.type === "context") {
        rows.push({ left: line, right: line });
        i++;
      } else if (line.type === "delete") {
        // Collect consecutive deletes
        const deletes: DiffLine[] = [];
        while (i < hunk.lines.length && hunk.lines[i].type === "delete") {
          deletes.push(hunk.lines[i]);
          i++;
        }
        // Collect consecutive adds
        const adds: DiffLine[] = [];
        while (i < hunk.lines.length && hunk.lines[i].type === "add") {
          adds.push(hunk.lines[i]);
          i++;
        }
        // Pair them
        const max = Math.max(deletes.length, adds.length);
        for (let j = 0; j < max; j++) {
          rows.push({
            left: j < deletes.length ? deletes[j] : null,
            right: j < adds.length ? adds[j] : null,
          });
        }
      } else if (line.type === "add") {
        rows.push({ left: null, right: line });
        i++;
      }
    }
  }

  return rows;
}

export function SideBySideDiff({ hunks }: SideBySideDiffProps) {
  const rows = pairLines(hunks);

  return (
    <div className="sbs-diff">
      <table className="sbs-table">
        <tbody>
          {rows.map((row, i) => {
            // Hunk separator
            if (row.left === null && row.right === null) {
              return (
                <tr key={i} className="sbs-separator">
                  <td colSpan={4} className="sbs-separator-cell">···</td>
                </tr>
              );
            }

            return (
              <tr key={i} className="sbs-row">
                {/* Left (old) */}
                <td className="sbs-linenum">
                  {row.left?.oldLineNumber ?? ""}
                </td>
                <td className={`sbs-content ${row.left?.type === "delete" ? "sbs-delete" : row.left?.type === "context" ? "" : "sbs-empty"}`}>
                  {row.left?.content ?? ""}
                </td>
                {/* Right (new) */}
                <td className="sbs-linenum">
                  {row.right?.newLineNumber ?? ""}
                </td>
                <td className={`sbs-content ${row.right?.type === "add" ? "sbs-add" : row.right?.type === "context" ? "" : "sbs-empty"}`}>
                  {row.right?.content ?? ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
