import { useState, useRef, useImperativeHandle, forwardRef, type KeyboardEvent } from "react";

export interface TerminalInputHandle {
  focus: () => void;
  appendText: (text: string) => void;
}

interface TerminalInputProps {
  onSendInput: (text: string) => void;
  onSendControl: (key: string) => void;
  disabled: boolean;
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

export const TerminalInput = forwardRef<TerminalInputHandle, TerminalInputProps>(function TerminalInput({
  onSendInput,
  onSendControl,
  disabled,
}, ref) {
  const nativeRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => nativeRef.current?.focus(),
    appendText: (text: string) => {
      setInput((prev) => prev + text);
      nativeRef.current?.focus();
    },
  }));
  const [input, setInput] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
      } else {
        onSendControl("Enter");
      }
    }
  };

  return (
    <div className="terminal-input">
      <input
        ref={nativeRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          disabled ? "Session ended" : "Type input... (Alt+Arrow to navigate, Ctrl+C to interrupt)"
        }
        disabled={disabled}
        className="terminal-input-field"
        autoFocus
      />
      <div className="terminal-input-buttons">
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
