import type { Plan } from "../types";

interface PlanDashboardProps {
  plan: Plan;
}

export function PlanDashboard({ plan }: PlanDashboardProps) {
  const { tasks, milestones, sprints } = plan;

  if (tasks.length === 0 && milestones.length === 0 && sprints.length === 0) {
    return (
      <div className="plan-dashboard plan-empty">
        <p>No plan data yet.</p>
        <p>Switch to the Board tab to create your first task.</p>
      </div>
    );
  }

  // Tasks by status
  const byStatus = {
    Backlog: tasks.filter((t) => t.status === "Backlog").length,
    Sprint: tasks.filter((t) => t.status === "Sprint").length,
    InProgress: tasks.filter((t) => t.status === "InProgress").length,
    Review: tasks.filter((t) => t.status === "Review").length,
    Done: tasks.filter((t) => t.status === "Done").length,
  };

  // Tasks by priority (from tags)
  const p1 = tasks.filter((t) => t.tags.some((tag) => tag === "High" || tag === "P1")).length;
  const p2 = tasks.filter((t) => t.tags.some((tag) => tag === "Medium" || tag === "P2")).length;
  const p3 = tasks.filter((t) => !t.tags.some((tag) => ["High", "P1", "Medium", "P2"].includes(tag))).length;

  // Overdue milestones
  const overdue = milestones.filter((m) => m.isOverdue);
  const upcoming = milestones
    .filter((m) => !m.isOverdue)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 5);

  // Active sprint
  const activeSprint = sprints.find((s) => s.isActive);
  const completedSprints = sprints.filter((s) => s.velocity !== null);

  return (
    <div className="plan-dashboard">
      {overdue.length > 0 && (
        <div className="plan-dash-section plan-dash-overdue">
          <h4>Overdue</h4>
          {overdue.map((m) => (
            <div key={m.id} className="plan-dash-overdue-item">
              <span>{m.title}</span>
              <span className="plan-badge overdue">{m.deadline}</span>
              <span>{Math.round(m.progress * 100)}%</span>
            </div>
          ))}
        </div>
      )}

      <div className="plan-dash-section">
        <h4>Tasks ({tasks.length})</h4>
        <div className="plan-dash-stats">
          <div className="plan-dash-stat"><span className="stat-num">{byStatus.Backlog}</span><span className="stat-label">Backlog</span></div>
          <div className="plan-dash-stat"><span className="stat-num">{byStatus.Sprint}</span><span className="stat-label">Sprint</span></div>
          <div className="plan-dash-stat"><span className="stat-num">{byStatus.InProgress}</span><span className="stat-label">In Progress</span></div>
          <div className="plan-dash-stat"><span className="stat-num">{byStatus.Review}</span><span className="stat-label">Review</span></div>
          <div className="plan-dash-stat"><span className="stat-num">{byStatus.Done}</span><span className="stat-label">Done</span></div>
        </div>
      </div>

      <div className="plan-dash-section">
        <h4>Priority</h4>
        <div className="plan-dash-stats">
          <div className="plan-dash-stat"><span className="stat-num stat-high">{p1}</span><span className="stat-label">High/P1</span></div>
          <div className="plan-dash-stat"><span className="stat-num">{p2}</span><span className="stat-label">Medium/P2</span></div>
          <div className="plan-dash-stat"><span className="stat-num">{p3}</span><span className="stat-label">Other</span></div>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="plan-dash-section">
          <h4>Upcoming Deadlines</h4>
          {upcoming.map((m) => (
            <div key={m.id} className="plan-dash-deadline">
              <span>{m.title}</span>
              <span className={m.isUrgent ? "plan-badge urgent" : ""}>{m.deadline}</span>
              <span>{Math.round(m.progress * 100)}%</span>
            </div>
          ))}
        </div>
      )}

      {activeSprint && (
        <div className="plan-dash-section">
          <h4>Active Sprint: {activeSprint.title}</h4>
          <div className="plan-dash-sprint-info">
            {activeSprint.remainingDays !== null && <span>{activeSprint.remainingDays} days remaining</span>}
            <span>{activeSprint.taskRefs.length} tasks</span>
          </div>
        </div>
      )}

      {completedSprints.length > 0 && (
        <div className="plan-dash-section">
          <h4>Velocity</h4>
          <div className="plan-dash-velocity">
            {completedSprints.map((sp) => (
              <div key={sp.id} className="plan-dash-velocity-item">
                <span>{sp.title}</span>
                <span className="stat-num">{sp.velocity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
