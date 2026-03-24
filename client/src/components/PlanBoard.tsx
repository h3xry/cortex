import { useState } from "react";
import { PlanColumn } from "./PlanColumn";
import { PlanMilestones } from "./PlanMilestones";
import { PlanSprints } from "./PlanSprints";
import { PlanDashboard } from "./PlanDashboard";
import { PlanTaskForm } from "./PlanTaskForm";
import type { TaskStatus } from "../types";

type PlanTab = "board" | "milestones" | "sprints" | "dashboard";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "Backlog", label: "Backlog" },
  { status: "Sprint", label: "Sprint" },
  { status: "InProgress", label: "In Progress" },
  { status: "Review", label: "Review" },
  { status: "Done", label: "Done" },
];

interface PlanBoardProps {
  projectId: string;
  planState: ReturnType<typeof import("../hooks/usePlan").usePlan>;
}

export function PlanBoard({ projectId, planState }: PlanBoardProps) {
  const [activeTab, setActiveTab] = useState<PlanTab>("board");
  const [showAddTask, setShowAddTask] = useState(false);
  const [addToStatus, setAddToStatus] = useState<TaskStatus>("Backlog");
  const [editTaskId, setEditTaskId] = useState<string | null>(null);

  const { plan, loading, addTask, updateTask, deleteTask } = planState;

  const handleAddTask = (status: TaskStatus) => {
    setAddToStatus(status);
    setEditTaskId(null);
    setShowAddTask(true);
  };

  const handleEditTask = (taskId: string) => {
    setEditTaskId(taskId);
    setShowAddTask(true);
  };

  const handleSaveTask = async (data: Parameters<typeof addTask>[0]) => {
    if (editTaskId) {
      await updateTask(editTaskId, {
        title: data.title,
        tags: data.tags,
        effort: data.effort ?? null,
        subTasks: data.subTasks?.map((s) => ({ title: s.title, done: s.done, effort: s.effort ?? null })),
      });
    } else {
      await addTask({ ...data, status: addToStatus });
    }
    setShowAddTask(false);
    setEditTaskId(null);
  };

  const editingTask = editTaskId ? plan.tasks.find((t) => t.id === editTaskId) : null;

  return (
    <div className="plan-board">
      <div className="plan-tabs">
        {(["board", "milestones", "sprints", "dashboard"] as PlanTab[]).map((tab) => (
          <button
            key={tab}
            className={`plan-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div className="plan-loading">Loading...</div>}

      {activeTab === "board" && (
        <div className="plan-kanban">
          {COLUMNS.map((col) => (
            <PlanColumn
              key={col.status}
              status={col.status}
              label={col.label}
              tasks={plan.tasks.filter((t) => t.status === col.status)}
              onAddTask={() => handleAddTask(col.status)}
              onEditTask={handleEditTask}
              onMoveTask={(taskId, newStatus) => updateTask(taskId, { status: newStatus })}
              onToggleDone={(taskId, done) => updateTask(taskId, { done })}
              onDeleteTask={deleteTask}
            />
          ))}
        </div>
      )}

      {activeTab === "milestones" && (
        <PlanMilestones planState={planState} />
      )}

      {activeTab === "sprints" && (
        <PlanSprints planState={planState} />
      )}

      {activeTab === "dashboard" && (
        <PlanDashboard plan={plan} />
      )}

      {showAddTask && (
        <PlanTaskForm
          task={editingTask}
          defaultStatus={addToStatus}
          onSave={handleSaveTask}
          onCancel={() => { setShowAddTask(false); setEditTaskId(null); }}
        />
      )}
    </div>
  );
}
