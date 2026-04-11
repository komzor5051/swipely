"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import SlideRenderer from "@/components/slides/SlideRenderer";
import type { SlideData } from "@/components/slides/types";

interface ViewerClientProps {
  generationId: string;
  template: string;
  format: "square" | "portrait";
  slides: SlideData[];
  postCaption: string;
  createdAt: string;
}

export default function ViewerClient({
  generationId,
  template,
  format,
  slides,
  postCaption,
}: ViewerClientProps) {
  const [current, setCurrent] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [slideWidth, setSlideWidth] = useState(320);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const totalSlides = slides.length;

  // Compute slide width from container
  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      // On mobile: 88vw, cap at 420px for desktop
      setSlideWidth(Math.min(Math.floor(vw * 0.88), 420));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  // Track current slide via IntersectionObserver
  useEffect(() => {
    const els = slideRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting && e.intersectionRatio >= 0.5);
        if (visible) {
          const idx = Number(visible.target.getAttribute("data-idx"));
          if (!isNaN(idx)) setCurrent(idx);
        }
      },
      { root: containerRef.current, threshold: 0.5 }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [slideWidth, slides.length]);

  const scrollTo = useCallback((idx: number) => {
    const container = containerRef.current;
    if (!container) return;
    const el = slideRefs.current[idx];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, []);

  // Download all slides — tries Web Share API first (saves to Photos on iOS)
  const downloadAll = useCallback(async () => {
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      await document.fonts.ready;

      const dataUrls: string[] = [];
      for (let i = 0; i < totalSlides; i++) {
        const wrapper = slideRefs.current[i];
        if (!wrapper) continue;
        const inner = wrapper.firstElementChild as HTMLElement | null;
        if (!inner) continue;

        const url = await toPng(inner, {
          width: inner.offsetWidth,
          height: inner.offsetHeight,
          pixelRatio: window.devicePixelRatio || 2,
          skipAutoScale: true,
        });
        dataUrls.push(url);
      }

      // Try Web Share API with files (iOS → saves to Photos)
      if (navigator.canShare) {
        const files = await Promise.all(
          dataUrls.map(async (url, i) => {
            const res = await fetch(url);
            const blob = await res.blob();
            return new File([blob], `slide-${i + 1}.png`, { type: "image/png" });
          })
        );
        if (navigator.canShare({ files })) {
          await navigator.share({ files, title: "Карусель Swipely" });
          return;
        }
      }

      // Fallback: sequential anchor downloads
      for (let i = 0; i < dataUrls.length; i++) {
        const a = document.createElement("a");
        a.href = dataUrls[i];
        a.download = `swipely-slide-${i + 1}.png`;
        a.click();
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch (e) {
      console.error("Download error:", e);
    } finally {
      setDownloading(false);
    }
  }, [totalSlides]);

  const aspectRatio = format === "portrait" ? 1080 / 1350 : 1;
  const slideHeight = Math.round(slideWidth / aspectRatio);

  return (
    <div className="min-h-[100dvh] bg-[#1E1E1E] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <a
          href="https://swipely.ru"
          className="flex items-center gap-1.5 text-[#D4F542] font-bold text-base tracking-tight"
        >
          ⚡ swipely.ru
        </a>
        <span className="text-white/40 text-sm tabular-nums">
          {current + 1} / {totalSlides}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/10 mx-5 rounded-full shrink-0">
        <div
          className="h-full bg-[#D4F542] rounded-full transition-all duration-300"
          style={{ width: `${((current + 1) / totalSlides) * 100}%` }}
        />
      </div>

      {/* Slider */}
      <div
        ref={containerRef}
        className="flex overflow-x-scroll gap-4 px-6 py-5 shrink-0"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <style>{`.viewer-scroller::-webkit-scrollbar { display: none; }`}</style>
        {slides.map((slide, i) => (
          <div
            key={i}
            data-idx={i}
            ref={(el) => { slideRefs.current[i] = el; }}
            className="shrink-0"
            style={{
              scrollSnapAlign: "center",
              width: slideWidth,
              height: slideHeight,
            }}
          >
            <SlideRenderer
              template={template}
              slide={slide}
              slideNumber={i + 1}
              totalSlides={totalSlides}
              format={format}
              maxWidth={slideWidth}
            />
          </div>
        ))}
        {/* Invisible padding at end for last slide to center */}
        <div className="shrink-0" style={{ width: 1 }} />
      </div>

      {/* Dot navigation */}
      <div className="flex justify-center gap-1.5 pb-4 shrink-0">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            aria-label={`Слайд ${i + 1}`}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === current ? 16 : 6,
              height: 6,
              background: i === current ? "#D4F542" : "rgba(255,255,255,0.25)",
            }}
          />
        ))}
      </div>

      {/* Download all button */}
      <div className="px-5 pb-3 shrink-0">
        <button
          onClick={downloadAll}
          disabled={downloading}
          className="w-full py-3.5 rounded-2xl bg-[#D4F542] text-[#0D0D14] font-bold text-sm active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {downloading ? "Подготовка..." : `Скачать все ${totalSlides} слайдов`}
        </button>
      </div>

      {/* Edit + Create buttons */}
      <div className="flex gap-2.5 px-5 pb-4 shrink-0">
        <a
          href={`/editor/${generationId}`}
          className="flex-1 py-3 rounded-2xl bg-white/10 text-white font-semibold text-sm text-center active:scale-[0.98] transition-all"
        >
          Редактировать
        </a>
        <a
          href="https://swipely.ru"
          className="flex-1 py-3 rounded-2xl bg-white/10 text-white font-semibold text-sm text-center active:scale-[0.98] transition-all"
        >
          Создать ещё
        </a>
      </div>

      {/* Post caption */}
      {postCaption && (
        <div className="mx-5 mb-4 p-4 rounded-2xl bg-white/5 border border-white/10 shrink-0">
          <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2">
            Текст поста
          </p>
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
            {postCaption}
          </p>
        </div>
      )}

      {/* CTA */}
      <div className="mx-5 mb-8 p-5 rounded-2xl bg-[#D4F542]/10 border border-[#D4F542]/20 text-center shrink-0">
        <p className="text-white font-semibold text-sm mb-1">Создай свою карусель</p>
        <p className="text-white/40 text-xs mb-3">
          Swipely — AI-генератор каруселей за 20 секунд
        </p>
        <a
          href="https://swipely.ru"
          className="inline-block px-5 py-2 rounded-xl bg-[#D4F542] text-[#0D0D14] font-bold text-sm active:scale-[0.98] transition-all"
        >
          Попробовать бесплатно
        </a>
      </div>
    </div>
  );
}
