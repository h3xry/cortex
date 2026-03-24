import { useState } from "react";

interface PlanMilestonesProps {
  planState: ReturnType<typeof import("../hooks/usePlan").usePlan>;
}

export function PlanMilestones({ planState }: PlanMilestonesProps) {
  const { plan, addMilestone, updateMilestone, deleteMilestone } = planState;
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [taskRefs, setTaskRefs] = useState("");

  const handleAdd = async () => {
    if (!title.trim() || !deadline) return;
    await addMilestone({
      title: title.trim(),
      deadline,
      taskRefs: taskRefs.split("\n").map((r) => r.trim()).filter(Boolean),
    });
    setTitle(""); setDeadline(""); setTaskRefs(""); setShowAdd(false);
  };

  const sorted = [...plan.milestones].sort((a, b) => a.deadline.localeCompare(b.deadline));

  return (
    <div className="plan-milestones">
      <div className="plan-section-header">
        <h3>Milestones</h3>
        <button className="plan-add-btn" onClick={() => setShowAdd(!showAdd)}>+ Add</button>
      </div>

      {showAdd && (
        <div className="plan-inline-form">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Milestone title" />
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <textarea value={taskRefs} onChange={(e) => setTaskRefs(e.target.value)} placeholder="Task references (one per line)" rows={3} />
          <div className="plan-form-actions">
            <button onClick={() => setShowAdd(false)}>Cancel</button>
            <button onClick={handleAdd}>Save</button>
          </div>
        </div>
      )}

      {sorted.length === 0 && !showAdd && (
        <div className="plan-empty">No milestones yet</div>
      )}

      {sorted.map((ms) => (
        <div key={ms.id} className={`plan-milestone-card ${ms.isOverdue ? "overdue" : ms.isUrgent ? "urgent" : ""}`}>
          <div className="plan-milestone-header">
            <span className="plan-milestone-title">{ms.title}</span>
            {ms.isOverdue && <span className="plan-badge overdue">Overdue</span>}
            {ms.isUrgent && !ms.isOverdue && <span className="plan-badge urgent">Urgent</span>}
            <button className="plan-task-delete" onClick={() => deleteMilestone(ms.id)}>x</button>
          </div>
          <div className="plan-milestone-deadline">Deadline: {ms.deadline}</div>
          <div className="plan-progress">
            <div className="plan-progress-bar">
              <div className="plan-progress-fill" style={{ width: `${ms.progress * 100}%` }} />
            </div>
            <span className="plan-progress-text">{Math.round(ms.progress * 100)}%</span>
          </div>
          {ms.taskRefs.length > 0 && (
            <ul className="plan-milestone-refs">
              {ms.taskRefs.map((ref, i) => <li key={i}>{ref}</li>)}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
