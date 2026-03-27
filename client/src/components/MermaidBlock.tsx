import { useEffect, useState, useId } from "react";
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

// Serialize mermaid.render() — it's not safe to call concurrently
let renderQueue: Promise<void> = Promise.resolve();

function renderMermaid(id: string, code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    renderQueue = renderQueue.then(async () => {
      try {
        // Clean up any leftover temp elements
        document.getElementById("d" + id)?.remove();
        const { svg } = await mermaid.render(id, code);
        resolve(svg);
      } catch (err) {
        reject(err);
      }
    });
  });
}

interface MermaidBlockProps {
  code: string;
}

export function MermaidBlock({ code }: MermaidBlockProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reactId = useId().replace(/:/g, "");

  useEffect(() => {
    if (!code.trim()) return;

    let cancelled = false;
    setSvg(null);
    setError(null);

    const id = `mmd${reactId}${Date.now()}`;

    renderMermaid(id, code.trim())
      .then((rendered) => { if (!cancelled) setSvg(rendered); })
      .catch((err) => { if (!cancelled) setError(err?.message || "Failed to render"); });

    return () => { cancelled = true; };
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

  return <div className="mermaid-container" style={{ padding: 12, color: "#6c7086", fontSize: 13 }}>Loading diagram...</div>;
}
