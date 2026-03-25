import { useState, useEffect } from "react";
import type { Project, NotificationSettings, NotificationType } from "../types";
import { getSettings, saveSettings } from "../services/notification";

interface NotificationSettingsProps {
  projects: Project[];
}

const EVENT_TYPES: { type: NotificationType; label: string }[] = [
  { type: "session_completed", label: "Completed" },
  { type: "session_error", label: "Error" },
  { type: "waiting_input", label: "Waiting Input" },
  { type: "long_running", label: "Long Running" },
  { type: "git_conflict", label: "Git Conflict" },
];

const THRESHOLD_OPTIONS = [
  { value: 300000, label: "5 min" },
  { value: 600000, label: "10 min" },
  { value: 900000, label: "15 min" },
  { value: 1800000, label: "30 min" },
];

export function NotificationSettings({ projects }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettings>(getSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const toggleSound = () => {
    setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }));
  };

  const setThreshold = (value: number) => {
    setSettings((s) => ({ ...s, longRunningThreshold: value }));
  };

  const toggleProjectEvent = (projectId: string, type: NotificationType) => {
    setSettings((s) => {
      const rules = s.projectRules[projectId] ?? {
        session_completed: true,
        session_error: true,
        waiting_input: true,
        long_running: true,
        git_conflict: true,
      };
      return {
        ...s,
        projectRules: {
          ...s.projectRules,
          [projectId]: { ...rules, [type]: !rules[type] },
        },
      };
    });
  };

  const isEnabled = (projectId: string, type: NotificationType): boolean => {
    const rules = settings.projectRules[projectId];
    if (!rules) return true;
    return rules[type];
  };

  return (
    <div className="notification-settings">
      <h3>Notification Settings</h3>

      <div className="notification-settings-row">
        <span>Sound</span>
        <button
          onClick={toggleSound}
          style={{
            background: settings.soundEnabled ? "#a6e3a1" : "#313244",
            color: settings.soundEnabled ? "#1e1e2e" : "#6c7086",
            border: "none",
            borderRadius: 4,
            padding: "2px 10px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {settings.soundEnabled ? "ON" : "OFF"}
        </button>
      </div>

      <div className="notification-settings-row">
        <span>Long-running threshold</span>
        <select
          value={settings.longRunningThreshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
        >
          {THRESHOLD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {projects.length > 0 && (
        <>
          <h3 style={{ marginTop: 16 }}>Per-Project Rules</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "4px 6px", color: "#6c7086" }}>Project</th>
                  {EVENT_TYPES.map((e) => (
                    <th key={e.type} style={{ padding: "4px 4px", color: "#6c7086", fontSize: 10 }}>
                      {e.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td style={{ padding: "4px 6px", color: "#cdd6f4", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
                      {p.name}
                    </td>
                    {EVENT_TYPES.map((e) => (
                      <td key={e.type} style={{ textAlign: "center", padding: "4px" }}>
                        <input
                          type="checkbox"
                          checked={isEnabled(p.path, e.type)}
                          onChange={() => toggleProjectEvent(p.path, e.type)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
