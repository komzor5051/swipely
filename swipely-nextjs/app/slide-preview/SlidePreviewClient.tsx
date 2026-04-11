"use client";

import { useSearchParams } from "next/navigation";
import SlideRenderer from "@/components/slides/SlideRenderer";

const PREVIEW_SLIDE = {
  type: "hook" as const,
  title: "Как вырасти в <hl>2 раза</hl> за 3 месяца",
  content: "Разбираем стратегию которая работает даже в конкурентных нишах",
};

export default function SlidePreviewClient() {
  const params = useSearchParams();
  const template = params.get("template") ?? "swipely";

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        width: 1080,
        height: 1350,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <SlideRenderer
        template={template}
        slide={PREVIEW_SLIDE}
        slideNumber={1}
        totalSlides={5}
        format="portrait"
        scale={1}
        username="swipely.ru"
      />
    </div>
  );
}
