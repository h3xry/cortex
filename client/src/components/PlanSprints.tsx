import { useState } from "react";

interface PlanSprintsProps {
  planState: ReturnType<typeof import("../hooks/usePlan").usePlan>;
}

export function PlanSprints({ planState }: PlanSprintsProps) {
  const { plan, addSprint, deleteSprint } = planState;
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [taskRefs, setTaskRefs] = useState("");

  const handleAdd = async () => {
    if (!title.trim() || !startDate || !endDate) return;
    await addSprint({
      title: title.trim(),
      startDate,
      endDate,
      taskRefs: taskRefs.split("\n").map((r) => r.trim()).filter(Boolean),
    });
    setTitle(""); setStartDate(""); setEndDate(""); setTaskRefs(""); setShowAdd(false);
  };

  // Active sprints first, then by start date
  const sorted = [...plan.sprints].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return b.startDate.localeCompare(a.startDate);
  });

  return (
    <div className="plan-sprints">
      <div className="plan-section-header">
        <h3>Sprints</h3>
        <button className="plan-add-btn" onClick={() => setShowAdd(!showAdd)}>+ Add</button>
      </div>

      {showAdd && (
        <div className="plan-inline-form">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sprint title" />
          <div className="plan-date-row">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span>to</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <textarea value={taskRefs} onChange={(e) => setTaskRefs(e.target.value)} placeholder="Task references (one per line)" rows={3} />
          <div className="plan-form-actions">
            <button onClick={() => setShowAdd(false)}>Cancel</button>
            <button onClick={handleAdd}>Save</button>
          </div>
        </div>
      )}

      {sorted.length === 0 && !showAdd && (
        <div className="plan-empty">No sprints yet</div>
      )}

      {sorted.map((sp) => (
        <div key={sp.id} className={`plan-sprint-card ${sp.isActive ? "active" : ""}`}>
          <div className="plan-sprint-header">
            <span className="plan-sprint-title">{sp.title}</span>
            {sp.isActive && <span className="plan-badge active">Active</span>}
            {sp.velocity !== null && <span className="plan-sprint-velocity">Velocity: {sp.velocity}</span>}
            <button className="plan-task-delete" onClick={() => deleteSprint(sp.id)}>x</button>
          </div>
          <div className="plan-sprint-dates">
            {sp.startDate} to {sp.endDate}
            {sp.remainingDays !== null && <span> ({sp.remainingDays}d remaining)</span>}
          </div>
          {sp.taskRefs.length > 0 && (
            <ul className="plan-sprint-refs">
              {sp.taskRefs.map((ref, i) => <li key={i}>{ref}</li>)}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
