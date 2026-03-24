export type ActivityStatus =
  | "unknown"
  | "idle"
  | "thinking"
  | "working"
  | "done"
  | "help"
  | "error";

interface ActivityEntry {
  status: ActivityStatus;
  toolName: string | null;
  lastEvent: string;
  lastEventAt: string;
  sessionId: string | null;
}

// Map by cwd (working directory) — primary key for matching with our sessions
const activityByCwd = new Map<string, ActivityEntry>();

// Also track by session_id for more reliable matching
const activityBySessionId = new Map<string, ActivityEntry>();

function setActivity(
  cwd: string,
  sessionId: string | null,
  status: ActivityStatus,
  eventName: string,
  toolName: string | null = null,
): void {
  const entry: ActivityEntry = {
    status,
    toolName,
    lastEvent: eventName,
    lastEventAt: new Date().toISOString(),
    sessionId,
  };
  activityByCwd.set(cwd, entry);
  if (sessionId) {
    activityBySessionId.set(sessionId, entry);
  }
}

/**
 * Process a raw Claude Code hook event.
 * Based on pixel-agent-desk hookProcessor logic.
 */
export function processHookEvent(data: Record<string, unknown>): void {
  const eventName = data.hook_event_name as string;
  const cwd = data.cwd as string | undefined;
  const sessionId = data.session_id as string | undefined;
  const toolName = data.tool_name as string | undefined;

  if (!cwd) return;

  console.log(`[hook] ${eventName} cwd=${cwd} tool=${toolName ?? "-"}`);

  switch (eventName) {
    case "SessionStart":
      setActivity(cwd, sessionId ?? null, "idle", eventName);
      break;

    case "SessionEnd":
      // Session ended — mark as done then remove after a delay
      setActivity(cwd, sessionId ?? null, "done", eventName);
      break;

    case "UserPromptSubmit":
      setActivity(cwd, sessionId ?? null, "thinking", eventName);
      break;

    case "PreToolUse":
      setActivity(cwd, sessionId ?? null, "working", eventName, toolName ?? null);
      break;

    case "PostToolUse":
      // Back to thinking after tool completes
      setActivity(cwd, sessionId ?? null, "thinking", eventName);
      break;

    case "PostToolUseFailure":
      setActivity(cwd, sessionId ?? null, "error", eventName, toolName ?? null);
      break;

    case "Stop":
    case "TaskCompleted":
      setActivity(cwd, sessionId ?? null, "done", eventName);
      break;

    case "PermissionRequest":
      setActivity(cwd, sessionId ?? null, "help", eventName);
      break;

    case "Notification": {
      // Like pixel-agent-desk: permission_prompt/elicitation_dialog → help
      const notifType = data.notification_type as string | undefined;
      if (
        notifType === "permission_prompt" ||
        notifType === "elicitation_dialog"
      ) {
        setActivity(cwd, sessionId ?? null, "help", eventName);
      }
      break;
    }

    case "PreCompact":
      // Compacting context — still thinking
      setActivity(cwd, sessionId ?? null, "thinking", eventName);
      break;

    default:
      // Unknown events — log but don't change state
      break;
  }
}

export function getActivityByCwd(cwd: string): ActivityEntry {
  return (
    activityByCwd.get(cwd) ?? {
      status: "unknown",
      toolName: null,
      lastEvent: "",
      lastEventAt: "",
      sessionId: null,
    }
  );
}

export function getActivityByFolderPath(folderPath: string): ActivityEntry {
  const exact = activityByCwd.get(folderPath);
  if (exact) return exact;

  // Check for subdirectory matches
  for (const [cwd, entry] of activityByCwd) {
    if (cwd.startsWith(folderPath) || folderPath.startsWith(cwd)) return entry;
  }

  return {
    status: "unknown",
    toolName: null,
    lastEvent: "",
    lastEventAt: "",
    sessionId: null,
  };
}
