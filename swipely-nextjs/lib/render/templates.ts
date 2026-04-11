/**
 * Server-side HTML generators for each carousel template.
 * Each function returns a fully self-contained HTML page
 * that Puppeteer can screenshot at the correct slide dimensions.
 */

export interface SlideRenderInput {
  slide: { type: string; title: string; content: string };
  slideNumber: number;
  totalSlides: number;
  template: string;
  format: "square" | "portrait" | "story";
}

const SIZES = {
  square: { w: 1080, h: 1080 },
  portrait: { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
} as const;

/** Convert <hl>word</hl> tags to inline-styled spans */
function hlToSpan(title: string, style: string): string {
  return title.replace(/<hl>(.*?)<\/hl>/g, `<span style="${style}">$1</span>`);
}

function numPad(n: number): string {
  return String(n).padStart(2, "0");
}

function baseHtml(w: number, h: number, extraCss: string, body: string): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:${w}px;height:${h}px;overflow:hidden;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;}
${extraCss}
</style>
</head><body>${body}</body></html>`;
}

// ─── client_custom_v1 ───────────────────────────────────────────────────────

function clientCustomV1(opts: SlideRenderInput): string {
  const { slide, slideNumber, totalSlides, format } = opts;
  const { w, h } = SIZES[format];
  const isLast = slideNumber === totalSlides;
  const titleHtml = hlToSpan(
    slide.title,
    "background:#FF6B35;color:#fff;padding:2px 12px;margin:0 -4px;-webkit-box-decoration-break:clone;box-decoration-break:clone;"
  );
  const dots = Array.from({ length: totalSlides }, (_, i) =>
    `<div style="width:${i === slideNumber - 1 ? 16 : 6}px;height:6px;border-radius:3px;background:${i === slideNumber - 1 ? "#FF6B35" : "rgba(255,255,255,0.2)"}"></div>`
  ).join("");

  const body = `
<div style="display:flex;flex-direction:column;width:${w}px;height:${h}px;background:#1A1A2E;">
  <div style="height:6px;background:#FF6B35;flex-shrink:0;"></div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:60px 72px;">
    <div style="font-size:14px;font-weight:600;letter-spacing:0.12em;color:#FF6B35;text-transform:uppercase;margin-bottom:32px;">
      ${numPad(slideNumber)} / ${numPad(totalSlides)}
    </div>
    <h2 style="font-size:${format === "portrait" ? 62 : 56}px;font-weight:800;line-height:1.1;color:#fff;margin-bottom:32px;letter-spacing:-0.02em;">
      ${titleHtml}
    </h2>
    <div style="width:48px;height:3px;background:#FF6B35;margin-bottom:32px;border-radius:2px;"></div>
    <p style="font-size:${isLast ? 28 : 26}px;line-height:1.6;color:${isLast ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.75)"};font-weight:${isLast ? 500 : 400};">
      ${slide.content}
    </p>
  </div>
  <div style="height:60px;flex-shrink:0;padding:0 72px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.08);">
    <span style="font-size:16px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:0.06em;text-transform:uppercase;">Client</span>
    <div style="display:flex;gap:6px;">${dots}</div>
  </div>
</div>`;

  return baseHtml(w, h, "", body);
}

// ─── swipely ────────────────────────────────────────────────────────────────

function swipely(opts: SlideRenderInput): string {
  const { slide, slideNumber, totalSlides, format } = opts;
  const { w, h } = SIZES[format];
  const isLast = slideNumber === totalSlides;
  const titleHtml = hlToSpan(
    slide.title,
    "color:#D4F542;"
  );
  const progress = Math.round((slideNumber / totalSlides) * 100);

  const body = `
<div style="display:flex;flex-direction:column;width:${w}px;height:${h}px;background:linear-gradient(135deg,#0D0D14 0%,#1a1a3a 100%);">
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:72px 80px;">
    <div style="font-size:13px;font-weight:600;letter-spacing:0.15em;color:rgba(212,245,66,0.6);text-transform:uppercase;margin-bottom:40px;">
      ${numPad(slideNumber)} ─ ${numPad(totalSlides)}
    </div>
    <h2 style="font-size:${format === "portrait" ? 66 : 58}px;font-weight:900;line-height:1.05;color:#fff;margin-bottom:36px;letter-spacing:-0.03em;">
      ${titleHtml}
    </h2>
    ${!isLast ? `<p style="font-size:26px;line-height:1.65;color:rgba(255,255,255,0.65);max-width:${w - 160}px;">${slide.content}</p>` : ""}
    ${isLast ? `<div style="display:inline-block;background:#D4F542;color:#0D0D14;font-size:26px;font-weight:700;padding:16px 40px;border-radius:100px;margin-top:8px;">${slide.content}</div>` : ""}
  </div>
  <div style="height:56px;flex-shrink:0;padding:0 80px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.07);">
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="width:24px;height:24px;background:#D4F542;border-radius:6px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:14px;">⚡</span>
      </div>
      <span style="font-size:15px;font-weight:700;color:rgba(255,255,255,0.5);">swipely.ru</span>
    </div>
    <div style="height:3px;width:120px;background:rgba(255,255,255,0.1);border-radius:2px;">
      <div style="height:100%;width:${progress}%;background:#D4F542;border-radius:2px;"></div>
    </div>
  </div>
</div>`;

  return baseHtml(w, h, "", body);
}

// ─── Generic dark fallback ───────────────────────────────────────────────────

function genericDark(opts: SlideRenderInput): string {
  const { slide, slideNumber, totalSlides, format } = opts;
  const { w, h } = SIZES[format];
  const isLast = slideNumber === totalSlides;
  const titleHtml = hlToSpan(slide.title, "color:#D4F542;");

  const body = `
<div style="display:flex;flex-direction:column;width:${w}px;height:${h}px;background:#0D0D14;">
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:72px 80px;">
    <div style="font-size:13px;font-weight:600;letter-spacing:0.14em;color:rgba(255,255,255,0.3);text-transform:uppercase;margin-bottom:40px;">
      ${slideNumber} / ${totalSlides}
    </div>
    <h2 style="font-size:${format === "portrait" ? 62 : 54}px;font-weight:800;line-height:1.1;color:#fff;margin-bottom:28px;letter-spacing:-0.02em;">
      ${titleHtml}
    </h2>
    <div style="width:40px;height:2px;background:#D4F542;margin-bottom:28px;"></div>
    <p style="font-size:${isLast ? 28 : 25}px;line-height:1.65;color:rgba(255,255,255,0.65);">
      ${slide.content}
    </p>
  </div>
  <div style="height:52px;flex-shrink:0;padding:0 80px;display:flex;align-items:center;justify-content:flex-end;">
    <span style="font-size:14px;color:rgba(255,255,255,0.2);font-weight:500;">swipely.ru</span>
  </div>
</div>`;

  return baseHtml(w, h, "", body);
}

// ─── announcement (broadcast newsletter) ────────────────────────────────────

function announcement(opts: SlideRenderInput): string {
  const { slide, slideNumber, totalSlides, format } = opts;
  const { w, h } = SIZES[format];
  const isFirst = slideNumber === 1;
  const isLast = slideNumber === totalSlides;
  const titleHtml = hlToSpan(
    slide.title,
    "background:linear-gradient(135deg,#D4F542,#a8e000);color:#0D0D14;padding:2px 14px;border-radius:6px;-webkit-box-decoration-break:clone;box-decoration-break:clone;"
  );

  // Split content by newlines into bullet items
  const lines = slide.content.split("\n").filter((l) => l.trim());
  const contentHtml =
    lines.length > 1
      ? lines
          .map(
            (line) =>
              `<div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:16px;">
                <div style="width:8px;height:8px;border-radius:50%;background:#D4F542;flex-shrink:0;margin-top:12px;"></div>
                <span style="font-size:24px;line-height:1.6;color:#3a3a4a;">${line.trim()}</span>
              </div>`
          )
          .join("")
      : `<p style="font-size:${isLast ? 28 : 26}px;line-height:1.65;color:#3a3a4a;">${slide.content}</p>`;

  const body = `
<div style="display:flex;flex-direction:column;width:${w}px;height:${h}px;background:#F8F7F4;">
  <!-- Top accent line -->
  <div style="height:5px;background:linear-gradient(90deg,#D4F542 0%,#a8e000 50%,transparent 100%);flex-shrink:0;"></div>

  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:${format === "portrait" ? "72px 80px" : "60px 80px"};">
    ${isFirst ? `
    <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:36px;">
      <div style="width:36px;height:36px;background:#0D0D14;border-radius:10px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:18px;color:#D4F542;font-weight:900;">S</span>
      </div>
      <span style="font-size:16px;font-weight:700;color:#9a9a9a;letter-spacing:0.08em;text-transform:uppercase;">Swipely</span>
    </div>
    ` : `
    <div style="font-size:13px;font-weight:600;letter-spacing:0.14em;color:#b0b0b0;text-transform:uppercase;margin-bottom:36px;">
      ${numPad(slideNumber)} / ${numPad(totalSlides)}
    </div>
    `}

    <h2 style="font-size:${format === "portrait" ? 58 : 50}px;font-weight:800;line-height:1.12;color:#0D0D14;margin-bottom:${lines.length > 1 ? 36 : 28}px;letter-spacing:-0.025em;">
      ${titleHtml}
    </h2>

    ${!isFirst ? `<div style="width:40px;height:3px;background:#D4F542;margin-bottom:28px;border-radius:2px;"></div>` : ""}

    ${contentHtml}
  </div>

  <!-- Footer -->
  <div style="height:56px;flex-shrink:0;padding:0 80px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #e8e8e4;">
    <span style="font-size:14px;font-weight:600;color:#c0c0c0;">swipely.ru</span>
    <div style="display:flex;gap:6px;">
      ${Array.from({ length: totalSlides }, (_, i) =>
        `<div style="width:${i === slideNumber - 1 ? 20 : 6}px;height:5px;border-radius:3px;background:${i === slideNumber - 1 ? "#D4F542" : "#e0e0dc"};transition:width .2s;"></div>`
      ).join("")}
    </div>
  </div>
</div>`;

  return baseHtml(w, h, "", body);
}

// ─── Public registry ────────────────────────────────────────────────────────

const TEMPLATE_RENDERERS: Record<string, (opts: SlideRenderInput) => string> = {
  client_custom_v1: clientCustomV1,
  swipely: swipely,
  announcement: announcement,
};

export function generateSlideHTML(opts: SlideRenderInput): string {
  const renderer = TEMPLATE_RENDERERS[opts.template] ?? genericDark;
  return renderer(opts);
}
