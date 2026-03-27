import { useEffect, useRef, useState, useId } from "react";
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

interface MermaidBlockProps {
  code: string;
}

export function MermaidBlock({ code }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reactId = useId();
  const renderCount = useRef(0);

  useEffect(() => {
    if (!code.trim()) return;

    setError(null);
    setSvg(null);
    renderCount.current++;
    const currentRender = renderCount.current;

    // Unique id per render to avoid DOM id collisions
    const id = `mmd-${reactId.replace(/:/g, "")}-${currentRender}`;

    // Clean up any leftover temp elements from previous failed renders
    document.querySelectorAll(`[id^="dmmd-"]`).forEach((el) => el.remove());

    mermaid.render(id, code.trim()).then(({ svg: rendered }) => {
      if (currentRender === renderCount.current) {
        setSvg(rendered);
      }
    }).catch((err) => {
      if (currentRender === renderCount.current) {
        setError(err?.message || "Failed to render diagram");
      }
    });
  }, [code, reactId]);

  if (error) {
    return (
      <div className="mermaid-error">
        <pre>{code}</pre>
        <div className="mermaid-error-msg">{error}</div>
      </div>
    );
  }

  if (svg) {
    return <div className="mermaid-container" dangerouslySetInnerHTML={{ __html: svg }} />;
  }

  return <div ref={containerRef} className="mermaid-container">Loading diagram...</div>;
}
