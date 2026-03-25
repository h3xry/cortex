import type { NotificationType, NotificationEvent, NotificationSettings, ProjectNotificationRules } from "../types";

const SETTINGS_KEY = "cortex-notification-settings";

const DEFAULT_RULES: ProjectNotificationRules = {
  session_completed: true,
  session_error: true,
  waiting_input: true,
  long_running: true,
  git_conflict: true,
};

const DEFAULT_SETTINGS: NotificationSettings = {
  soundEnabled: true,
  longRunningThreshold: 600000, // 10 min
  projectRules: {},
};

// --- Settings ---

export function getSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: NotificationSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function isEventEnabled(projectId: string, type: NotificationType): boolean {
  const settings = getSettings();
  const rules = settings.projectRules[projectId] ?? DEFAULT_RULES;
  return rules[type];
}

// --- Browser Notification ---

export async function requestPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

export function sendBrowserNotification(event: NotificationEvent): void {
  if (document.hasFocus()) return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const n = new Notification(event.title, {
    body: event.message,
    icon: "/icons/icon.svg",
    tag: event.id,
  });
  n.onclick = () => {
    window.focus();
    n.close();
  };
}

// --- Sound (Web Audio API) ---

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.3): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

const SOUND_MAP: Record<NotificationType, () => void> = {
  session_completed: () => {
    // Two rising tones — cheerful
    playTone(523, 0.15); // C5
    setTimeout(() => playTone(659, 0.3), 150); // E5
  },
  session_error: () => {
    // Two falling tones — alert
    playTone(440, 0.2, "square", 0.2); // A4
    setTimeout(() => playTone(330, 0.4, "square", 0.2), 200); // E4
  },
  waiting_input: () => {
    // Three quick pings — attention
    playTone(880, 0.1); // A5
    setTimeout(() => playTone(880, 0.1), 150);
    setTimeout(() => playTone(1047, 0.2), 300); // C6
  },
  long_running: () => {
    // Low gentle tone — reminder
    playTone(392, 0.5, "triangle", 0.2); // G4
  },
  git_conflict: () => {
    // Dissonant warning
    playTone(466, 0.3, "sawtooth", 0.15); // Bb4
    setTimeout(() => playTone(494, 0.3, "sawtooth", 0.15), 100); // B4
  },
};

export function playSound(type: NotificationType): void {
  const settings = getSettings();
  if (!settings.soundEnabled) return;
  SOUND_MAP[type]?.();
}

// --- Notification Colors ---

export const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  session_completed: "#a6e3a1",
  session_error: "#f38ba8",
  waiting_input: "#89b4fa",
  long_running: "#6c7086",
  git_conflict: "#f9e2af",
};

export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  session_completed: "Completed",
  session_error: "Error",
  waiting_input: "Waiting",
  long_running: "Long Running",
  git_conflict: "Git Conflict",
};
