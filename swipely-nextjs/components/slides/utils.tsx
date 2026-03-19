import React from "react";

/**
 * Parse title with <hl>keyword</hl> tags and render highlighted spans.
 * highlightStyle is applied to the <hl> content.
 */
export function renderTitle(
  title: string,
  highlightStyle: React.CSSProperties
): React.ReactNode {
  const lines = title.split("\n");
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(<hl>.*?<\/hl>)/g);
    const rendered = parts.map((part, i) => {
      const match = part.match(/^<hl>(.*?)<\/hl>$/);
      if (match) {
        return (
          <span key={i} style={highlightStyle}>
            {match[1]}
          </span>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
    return (
      <React.Fragment key={lineIdx}>
        {rendered}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

/**
 * Render content text with \n → <br> support.
 */
export function renderContent(content: string): React.ReactNode {
  if (!content) return null;
  const lines = content.split("\n");
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {line}
      {i < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}

/**
 * Get slide dimensions based on format.
 */
export function getSlideDimensions(format: "square" | "portrait") {
  return format === "square"
    ? { width: 1080, height: 1080 }
    : { width: 1080, height: 1350 };
}
