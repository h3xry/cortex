import { useEffect, useRef, useState, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Highlight, themes } from "prism-react-renderer";
import mermaid from "mermaid";

// Initialize mermaid once with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    primaryColor: "#89b4fa",
    primaryTextColor: "#cdd6f4",
    primaryBorderColor: "#313244",
    lineColor: "#6c7086",
    secondaryColor: "#45475a",
    tertiaryColor: "#181825",
    background: "#1e1e2e",
    mainBkg: "#1e1e2e",
    nodeBorder: "#89b4fa",
    clusterBkg: "#181825",
    titleColor: "#cdd6f4",
    edgeLabelBackground: "#1e1e2e",
  },
});

let mermaidCounter = 0;

const MermaidBlock = memo(function MermaidBlock({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    const id = `mermaid-${++mermaidCounter}`;

    mermaid
      .render(id, code)
      .then((result) => {
        setSvg(result.svg);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Mermaid render error");
      });
  }, [code]);

  if (error) {
    return (
      <div className="mermaid-error">
        <div className="mermaid-error-label">Mermaid Error</div>
        <pre>{error}</pre>
        <pre className="mermaid-source">{code}</pre>
      </div>
    );
  }

  if (!svg) {
    return <div className="mermaid-container"><div className="loading">Rendering diagram...</div></div>;
  }

  return <div className="mermaid-container" dangerouslySetInnerHTML={{ __html: svg }} />;
});

interface MarkdownViewerProps {
  content: string;
  filePath: string;
  showHeader?: boolean;
}

export const MarkdownViewer = memo(function MarkdownViewer({ content, filePath, showHeader = true }: MarkdownViewerProps) {
  return (
    <div className="markdown-viewer">
      {showHeader && (
        <div className="markdown-header">
          <span className="markdown-path">{filePath}</span>
        </div>
      )}
      <div className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const language = match?.[1] ?? "";
              const codeString = String(children).replace(/\n$/, "");

              // Mermaid block
              if (language === "mermaid") {
                return <MermaidBlock code={codeString} />;
              }

              // Inline code (no language)
              if (!match) {
                return (
                  <code className="inline-code" {...props}>
                    {children}
                  </code>
                );
              }

              // Syntax highlighted code block
              return (
                <Highlight
                  theme={themes.vsDark}
                  code={codeString}
                  language={language}
                >
                  {({ style, tokens, getLineProps, getTokenProps }) => (
                    <pre
                      style={{ ...style, margin: 0, padding: "12px" }}
                      className="code-block"
                    >
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })}>
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token })} />
                          ))}
                        </div>
                      ))}
                    </pre>
                  )}
                </Highlight>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
});
