import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    darkMode: true,
    background: "#1e1e2e",
    primaryColor: "#89b4fa",
    primaryTextColor: "#cdd6f4",
    primaryBorderColor: "#313244",
    lineColor: "#6c7086",
    secondaryColor: "#313244",
    tertiaryColor: "#181825",
  },
});

let idCounter = 0;

interface MermaidBlockProps {
  code: string;
}

export function MermaidBlock({ code }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(`mermaid-${++idCounter}`);

  useEffect(() => {
    if (!containerRef.current || !code.trim()) return;

    setError(null);
    const id = idRef.current;

    mermaid.render(id, code.trim()).then(({ svg }) => {
      if (containerRef.current) {
        containerRef.current.innerHTML = svg;
      }
    }).catch((err) => {
      setError(err?.message || "Failed to render diagram");
    });
  }, [code]);

  if (error) {
    return (
      <div className="mermaid-error">
        <pre>{code}</pre>
        <div className="mermaid-error-msg">{error}</div>
      </div>
    );
  }

  return <div ref={containerRef} className="mermaid-container" />;
}
