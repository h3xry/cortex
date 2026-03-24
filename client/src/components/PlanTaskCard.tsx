import type { PlanTask, TaskStatus } from "../types";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "Backlog", label: "Backlog" },
  { value: "Sprint", label: "Sprint" },
  { value: "InProgress", label: "In Progress" },
  { value: "Review", label: "Review" },
  { value: "Done", label: "Done" },
];

interface PlanTaskCardProps {
  task: PlanTask;
  onEdit: () => void;
  onMove: (newStatus: TaskStatus) => void;
  onToggleDone: (done: boolean) => void;
  onDelete: () => void;
}

export function PlanTaskCard({ task, onEdit, onMove, onToggleDone, onDelete }: PlanTaskCardProps) {
  const subDone = task.subTasks.filter((s) => s.done).length;
  const subTotal = task.subTasks.length;

  return (
    <div className={`plan-task-card ${task.done ? "done" : ""}`}>
      <div className="plan-task-card-header">
        <label className="plan-task-checkbox">
          <input
            type="checkbox"
            checked={task.done}
            onChange={(e) => onToggleDone(e.target.checked)}
          />
        </label>
        <span className="plan-task-title" onClick={onEdit}>
          {task.done ? <s>{task.title}</s> : task.title}
        </span>
      </div>

      {task.tags.length > 0 && (
        <div className="plan-task-tags">
          {task.tags.map((tag) => (
            <span key={tag} className={`plan-tag ${tag === "High" ? "tag-high" : tag === "Feature" ? "tag-feature" : ""}`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {subTotal > 0 && (
        <div className="plan-task-subtasks">
          <div className="plan-subtask-bar">
            <div className="plan-subtask-fill" style={{ width: `${(subDone / subTotal) * 100}%` }} />
          </div>
          <span className="plan-subtask-count">{subDone}/{subTotal}</span>
        </div>
      )}

      {task.effort && (
        <div className="plan-task-effort">{task.effort}</div>
      )}

      <div className="plan-task-actions">
        <select
          className="plan-task-move"
          value={task.status}
          onChange={(e) => onMove(e.target.value as TaskStatus)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button className="plan-task-delete" onClick={onDelete} title="Delete">x</button>
      </div>
    </div>
  );
}
