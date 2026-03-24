import type { Plan, PlanTask, SubTask, Milestone, Sprint, TaskStatus } from "../types.js";

const TASK_SECTIONS: Record<string, TaskStatus> = {
  "Backlog": "Backlog",
  "Sprint": "Sprint",
  "In Progress": "InProgress",
  "Review": "Review",
  "Done": "Done",
};

const STATUS_TO_HEADING: Record<TaskStatus, string> = {
  Backlog: "Backlog",
  Sprint: "Sprint",
  InProgress: "In Progress",
  Review: "Review",
  Done: "Done",
};

const CHECKBOX_RE = /^- \[([ xX])\] /;
const BOLD_RE = /\*\*(.+?)\*\*/;
const TAG_RE = /\[([^\]]+)\]/g;
const EFFORT_RE = /[—–-]\s*(.+?\s+\d+\.?\d*\s*manday)/i;
const STRIKETHROUGH_RE = /~~(.+?)~~/;

function extractTags(text: string): string[] {
  const tags: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(TAG_RE.source, "g");
  while ((match = re.exec(text)) !== null) {
    tags.push(match[1]);
  }
  return tags;
}

function extractEffort(text: string): string | null {
  const match = text.match(EFFORT_RE);
  return match ? match[1].trim() : null;
}

function parseTaskLine(line: string, status: TaskStatus): PlanTask | null {
  const checkMatch = line.match(CHECKBOX_RE);
  if (!checkMatch) return null;

  const done = checkMatch[1] !== " ";
  const rest = line.slice(checkMatch[0].length);

  // Extract title from bold or plain text
  let title: string;
  const boldMatch = rest.match(BOLD_RE);
  if (boldMatch) {
    title = boldMatch[1];
    // Remove strikethrough inside title
    const strikeMatch = title.match(STRIKETHROUGH_RE);
    if (strikeMatch) title = strikeMatch[1];
  } else {
    // Plain text — remove strikethrough
    const strikeMatch = rest.match(STRIKETHROUGH_RE);
    title = strikeMatch ? strikeMatch[1] : rest.split("—")[0].split("–")[0].trim();
  }

  const tags = extractTags(rest);
  const effort = extractEffort(rest);

  return {
    id: "",
    title: title.trim(),
    description: null,
    tags,
    status,
    subTasks: [],
    effort,
    milestoneId: null,
    sprintId: null,
    done,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function parseSubTaskLine(line: string): SubTask | null {
  const trimmed = line.trim();
  const checkMatch = trimmed.match(CHECKBOX_RE);
  if (!checkMatch) return null;

  const done = checkMatch[1] !== " ";
  const rest = trimmed.slice(checkMatch[0].length);
  const effort = extractEffort(rest);
  const title = rest.replace(EFFORT_RE, "").trim();

  return { title, done, effort };
}

function parseMilestone(heading: string, lines: string[]): Milestone | null {
  // Format: ## Title - YYYY-MM-DD
  const match = heading.match(/^(.+?)\s*-\s*(\d{4}-\d{2}-\d{2})\s*$/);
  if (!match) return null;

  const taskRefs = lines
    .filter((l) => l.trim().startsWith("- "))
    .map((l) => l.trim().slice(2).trim());

  return {
    id: "",
    title: match[1].trim(),
    deadline: match[2],
    taskRefs,
  };
}

function parseSprint(heading: string, lines: string[]): Sprint | null {
  // Format: ## Title - YYYY-MM-DD to YYYY-MM-DD
  const match = heading.match(
    /^(.+?)\s*-\s*(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})\s*$/,
  );
  if (!match) return null;

  const taskRefs = lines
    .filter((l) => l.trim().startsWith("- "))
    .map((l) => l.trim().slice(2).trim());

  return {
    id: "",
    title: match[1].trim(),
    startDate: match[2],
    endDate: match[3],
    taskRefs,
  };
}

export function parsePlanMd(content: string): Plan {
  const lines = content.split("\n");
  const tasks: PlanTask[] = [];
  const milestones: Milestone[] = [];
  const sprints: Sprint[] = [];

  let topSection: "tasks" | "milestones" | "sprints" | null = null;
  let currentStatus: TaskStatus | null = null;
  let currentTask: PlanTask | null = null;
  let currentH2: string | null = null;
  let h2Lines: string[] = [];
  let taskCounter = 0;
  let msCounter = 0;
  let spCounter = 0;

  const flushH2 = () => {
    if (!currentH2 || !topSection) return;
    if (topSection === "milestones") {
      const ms = parseMilestone(currentH2, h2Lines);
      if (ms) {
        msCounter++;
        ms.id = `MS-${String(msCounter).padStart(3, "0")}`;
        milestones.push(ms);
      }
    } else if (topSection === "sprints") {
      const sp = parseSprint(currentH2, h2Lines);
      if (sp) {
        spCounter++;
        sp.id = `SP-${String(spCounter).padStart(3, "0")}`;
        sprints.push(sp);
      }
    }
    currentH2 = null;
    h2Lines = [];
  };

  const flushTask = () => {
    if (currentTask) {
      tasks.push(currentTask);
      currentTask = null;
    }
  };

  for (const line of lines) {
    // # Top-level section
    if (line.startsWith("# ")) {
      flushTask();
      flushH2();
      const heading = line.slice(2).trim();
      if (heading === "Tasks") topSection = "tasks";
      else if (heading === "Milestones") topSection = "milestones";
      else if (heading === "Sprints") topSection = "sprints";
      else topSection = null;
      currentStatus = null;
      continue;
    }

    // ## Sub-section
    if (line.startsWith("## ")) {
      flushTask();
      flushH2();
      const heading = line.slice(3).trim();

      if (topSection === "tasks") {
        currentStatus = TASK_SECTIONS[heading] ?? null;
      } else if (topSection === "milestones" || topSection === "sprints") {
        currentH2 = heading;
        h2Lines = [];
      }
      continue;
    }

    // --- separator
    if (line.trim() === "---") {
      flushTask();
      flushH2();
      continue;
    }

    // Task items (top-level checkbox under task section)
    if (topSection === "tasks" && currentStatus && line.match(/^- \[/)) {
      flushTask();
      currentTask = parseTaskLine(line, currentStatus);
      if (currentTask) {
        taskCounter++;
        currentTask.id = `TASK-${String(taskCounter).padStart(3, "0")}`;
      }
      continue;
    }

    // Sub-task items (indented checkbox)
    if (topSection === "tasks" && currentTask && line.match(/^\s+- \[/)) {
      const sub = parseSubTaskLine(line);
      if (sub) currentTask.subTasks.push(sub);
      continue;
    }

    // Milestone/Sprint body lines
    if ((topSection === "milestones" || topSection === "sprints") && currentH2) {
      h2Lines.push(line);
      continue;
    }
  }

  flushTask();
  flushH2();

  return { tasks, milestones, sprints };
}

export function serializePlan(plan: Plan): string {
  const lines: string[] = [];

  // # Tasks
  lines.push("# Tasks");
  lines.push("");

  const statuses: TaskStatus[] = ["Backlog", "Sprint", "InProgress", "Review", "Done"];
  for (const status of statuses) {
    const sectionTasks = plan.tasks.filter((t) => t.status === status);
    lines.push(`## ${STATUS_TO_HEADING[status]}`);
    if (sectionTasks.length === 0) {
      lines.push("");
      continue;
    }
    for (const task of sectionTasks) {
      const check = task.done ? "[x]" : "[ ]";
      const tagStr = task.tags.length > 0 ? task.tags.map((t) => `[${t}]`).join(" ") : "";
      // Build title with tags
      let titlePart = task.title;
      // Wrap in bold
      if (task.done) {
        titlePart = `**~~${titlePart}~~**`;
      } else {
        titlePart = `**${titlePart}**`;
      }
      const effortPart = task.effort ? ` — ${task.effort}` : "";
      const tagSuffix = tagStr ? ` - ${tagStr}` : "";
      lines.push(`- ${check} ${titlePart}${tagSuffix}${effortPart}`);

      for (const sub of task.subTasks) {
        const subCheck = sub.done ? "[x]" : "[ ]";
        const subEffort = sub.effort ? ` — ${sub.effort}` : "";
        lines.push(`  - ${subCheck} ${sub.title}${subEffort}`);
      }
    }
    lines.push("");
  }

  // # Milestones
  if (plan.milestones.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("# Milestones");
    lines.push("");
    for (const ms of plan.milestones) {
      lines.push(`## ${ms.title} - ${ms.deadline}`);
      for (const ref of ms.taskRefs) {
        lines.push(`- ${ref}`);
      }
      lines.push("");
    }
  }

  // # Sprints
  if (plan.sprints.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("# Sprints");
    lines.push("");
    for (const sp of plan.sprints) {
      lines.push(`## ${sp.title} - ${sp.startDate} to ${sp.endDate}`);
      for (const ref of sp.taskRefs) {
        lines.push(`- ${ref}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
