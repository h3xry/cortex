import { useState, useRef, useCallback, useImperativeHandle, forwardRef, type KeyboardEvent } from "react";

// Web Speech API types (not in all TS libs)
type SpeechRecognitionType = any;

export interface TerminalInputHandle {
  focus: () => void;
  appendText: (text: string) => void;
}

interface TerminalInputProps {
  onSendInput: (text: string) => void;
  onSendControl: (key: string) => void;
  disabled: boolean;
  sessionId?: string;
}

// Alt+Arrow and Alt+Tab send control keys to tmux
const ALT_KEYS: Record<string, string> = {
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  Tab: "Tab",
  Escape: "Escape",
};

function getDraftKey(sessionId?: string): string {
  return sessionId ? `cortex-draft-${sessionId}` : "";
}

function loadDraft(sessionId?: string): string {
  if (!sessionId) return "";
  try { return sessionStorage.getItem(getDraftKey(sessionId)) ?? ""; } catch { return ""; }
}

function saveDraft(sessionId: string | undefined, value: string): void {
  if (!sessionId) return;
  try {
    if (value) sessionStorage.setItem(getDraftKey(sessionId), value);
    else sessionStorage.removeItem(getDraftKey(sessionId));
  } catch { /* ignore */ }
}

export const TerminalInput = forwardRef<TerminalInputHandle, TerminalInputProps>(function TerminalInput({
  onSendInput,
  onSendControl,
  disabled,
  sessionId,
}, ref) {
  const nativeRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(() => loadDraft(sessionId));

  useImperativeHandle(ref, () => ({
    focus: () => nativeRef.current?.focus(),
    appendText: (text: string) => {
      setInput((prev) => {
        const next = prev + text;
        saveDraft(sessionId, next);
        return next;
      });
      nativeRef.current?.focus();
    },
  }));

  // --- Voice Input (Web Speech API) ---
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const [listening, setListening] = useState(false);

  const hasSpeechAPI = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const toggleVoice = useCallback(() => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = ""; // auto-detect

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim = transcript;
        }
      }
      const voiceText = finalTranscript + interim;
      setInput((prev) => {
        // Append voice text after existing text
        const base = prev.replace(/\n?🎤.*$/, ""); // remove previous interim
        const next = base + (base && !base.endsWith("\n") && voiceText ? " " : "") + voiceText;
        saveDraft(sessionId, next);
        return next;
      });
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, sessionId]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+C
    if (e.ctrlKey && e.key === "c") {
      e.preventDefault();
      onSendControl("C-c");
      return;
    }

    // Alt+key sends control keys to tmux
    if (e.altKey) {
      const tmuxKey = ALT_KEYS[e.key];
      if (tmuxKey) {
        e.preventDefault();
        onSendControl(tmuxKey);
        return;
      }
    }

    // Enter: send text + Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        onSendInput(input);
        onSendControl("Enter");
        setInput("");
        saveDraft(sessionId, "");
      } else {
        onSendControl("Enter");
      }
    }
  };

  return (
    <div className="terminal-input">
      <textarea
        ref={nativeRef}
        value={input}
        onChange={(e) => { setInput(e.target.value); saveDraft(sessionId, e.target.value); }}
        onKeyDown={handleKeyDown}
        placeholder={
          disabled ? "Session ended" : "Type input... (Enter to send, Shift+Enter for newline)"
        }
        disabled={disabled}
        className="terminal-input-field"
        autoFocus
        rows={2}
      />
      <div className="terminal-input-buttons">
        {hasSpeechAPI && (
          <button
            className={`terminal-key-button ${listening ? "voice-active" : ""}`}
            onClick={toggleVoice}
            disabled={disabled}
            title={listening ? "Stop recording" : "Voice input"}
          >
            {listening ? "⏹" : "🎤"}
          </button>
        )}
        <button
          className="terminal-key-button"
          onClick={() => onSendControl("Up")}
          disabled={disabled}
          title="Arrow Up"
        >
          ↑
        </button>
        <button
          className="terminal-key-button"
          onClick={() => onSendControl("Down")}
          disabled={disabled}
          title="Arrow Down"
        >
          ↓
        </button>
        <button
          className="terminal-key-button"
          onClick={() => onSendControl("BTab")}
          disabled={disabled}
          title="Shift+Tab (toggle mode)"
        >
          ⇧Tab
        </button>
        <button
          className="terminal-ctrl-c-button"
          onClick={() => onSendControl("C-c")}
          disabled={disabled}
          title="Send Ctrl+C (interrupt)"
        >
          Ctrl+C
        </button>
        <button
          className="terminal-enter-button"
          onClick={() => onSendControl("Enter")}
          disabled={disabled}
          title="Send Enter"
        >
          Enter ⏎
        </button>
      </div>
    </div>
  );
});
