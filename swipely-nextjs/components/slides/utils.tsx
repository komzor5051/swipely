import React from "react";

/**
 * Parse title with <hl>keyword</hl> tags and render highlighted spans.
 * highlightStyle is applied to the <hl> content.
 */
export function renderTitle(
  title: string,
  highlightStyle: React.CSSProperties
): React.ReactNode {
  const parts = title.split(/(<hl>.*?<\/hl>)/g);
  return parts.map((part, i) => {
    const match = part.match(/^<hl>(.*?)<\/hl>$/);
    if (match) {
      // inline-block ensures html2canvas correctly positions the background
      // (inline spans with background get displaced at large font sizes)
      return (
        <span
          key={i}
          style={{
            ...highlightStyle,
            display: "inline-block",
            verticalAlign: "baseline",
          }}
        >
          {match[1]}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/**
 * Get slide dimensions based on format.
 */
export function getSlideDimensions(format: "square" | "portrait") {
  return format === "square"
    ? { width: 1080, height: 1080 }
    : { width: 1080, height: 1350 };
}
