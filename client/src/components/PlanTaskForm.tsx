import { useState } from "react";
import type { PlanTask, TaskStatus } from "../types";

interface PlanTaskFormProps {
  task?: PlanTask | null;
  defaultStatus: TaskStatus;
  onSave: (data: {
    title: string;
    tags?: string[];
    status?: TaskStatus;
    effort?: string;
    subTasks?: { title: string; done: boolean; effort?: string | null }[];
  }) => void;
  onCancel: () => void;
}

export function PlanTaskForm({ task, defaultStatus, onSave, onCancel }: PlanTaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [tags, setTags] = useState(task?.tags.join(", ") ?? "");
  const [effort, setEffort] = useState(task?.effort ?? "");
  const [subTasks, setSubTasks] = useState(
    task?.subTasks.map((s) => ({ ...s })) ?? [],
  );
  const [newSub, setNewSub] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      status: task?.status ?? defaultStatus,
      effort: effort.trim() || undefined,
      subTasks: subTasks.length > 0 ? subTasks : undefined,
    });
  };

  const addSubTask = () => {
    if (!newSub.trim()) return;
    setSubTasks([...subTasks, { title: newSub.trim(), done: false, effort: null }]);
    setNewSub("");
  };

  const removeSubTask = (idx: number) => {
    setSubTasks(subTasks.filter((_, i) => i !== idx));
  };

  return (
    <div className="plan-modal-overlay" onClick={onCancel}>
      <form className="plan-task-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>{task ? "Edit Task" : "Add Task"}</h3>

        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="[Feature] Task title"
            autoFocus
          />
        </label>

        <label>
          Tags (comma-separated)
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Feature, High, Project-name"
          />
        </label>

        <label>
          Effort
          <input
            type="text"
            value={effort}
            onChange={(e) => setEffort(e.target.value)}
            placeholder="Back 1.5 manday"
          />
        </label>

        <div className="plan-form-subtasks">
          <label>Sub-tasks</label>
          {subTasks.map((sub, idx) => (
            <div key={idx} className="plan-form-subtask-row">
              <input
                type="checkbox"
                checked={sub.done}
                onChange={(e) => {
                  const updated = [...subTasks];
                  updated[idx] = { ...updated[idx], done: e.target.checked };
                  setSubTasks(updated);
                }}
              />
              <span>{sub.title}</span>
              <button type="button" onClick={() => removeSubTask(idx)}>x</button>
            </div>
          ))}
          <div className="plan-form-subtask-add">
            <input
              type="text"
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              placeholder="Add sub-task"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubTask(); } }}
            />
            <button type="button" onClick={addSubTask}>+</button>
          </div>
        </div>

        <div className="plan-form-actions">
          <button type="button" className="plan-form-cancel" onClick={onCancel}>Cancel</button>
          <button type="submit" className="plan-form-save">Save</button>
        </div>
      </form>
    </div>
  );
}
