import { PlanTaskCard } from "./PlanTaskCard";
import type { PlanTask, TaskStatus } from "../types";

interface PlanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: PlanTask[];
  onAddTask: () => void;
  onEditTask: (taskId: string) => void;
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  onToggleDone: (taskId: string, done: boolean) => void;
  onDeleteTask: (taskId: string) => void;
}

export function PlanColumn({
  status,
  label,
  tasks,
  onAddTask,
  onEditTask,
  onMoveTask,
  onToggleDone,
  onDeleteTask,
}: PlanColumnProps) {
  return (
    <div className="plan-column">
      <div className="plan-column-header">
        <span className="plan-column-title">{label}</span>
        <span className="plan-column-count">{tasks.length}</span>
      </div>
      <div className="plan-column-tasks">
        {tasks.map((task) => (
          <PlanTaskCard
            key={task.id}
            task={task}
            onEdit={() => onEditTask(task.id)}
            onMove={(newStatus) => onMoveTask(task.id, newStatus)}
            onToggleDone={(done) => onToggleDone(task.id, done)}
            onDelete={() => onDeleteTask(task.id)}
          />
        ))}
      </div>
      <button className="plan-column-add" onClick={onAddTask}>+ Add</button>
    </div>
  );
}
