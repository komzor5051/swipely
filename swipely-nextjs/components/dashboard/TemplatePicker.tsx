"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { templates } from "@/lib/templates/registry";

export default function TemplatePicker({ isPro = false }: { isPro?: boolean }) {
  const router = useRouter();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 3,
    containScroll: "trimSnaps",
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [selectedSnap, setSelectedSnap] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setSelectedSnap(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setSnapCount(emblaApi.scrollSnapList().length); // eslint-disable-line react-hooks/set-state-in-effect
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleSelect = (id: string) => {
    router.push(`/generate?template=${id}`);
  };

  return (
    <div className="space-y-4">

      {/* Viewport with side arrows */}
      <div className="relative">
        <button
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!canScrollPrev}
          aria-label="Прокрутить влево"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full border border-[#E8E8E4] bg-white flex items-center justify-center shadow-sm transition-all disabled:opacity-0 hover:bg-[#F5F5F0]"
        >
          <ChevronLeft className="h-4 w-4 text-[#6B7280]" />
        </button>
        <button
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canScrollNext}
          aria-label="Прокрутить вправо"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-9 h-9 rounded-full border border-[#E8E8E4] bg-white flex items-center justify-center shadow-sm transition-all disabled:opacity-0 hover:bg-[#F5F5F0]"
        >
          <ChevronRight className="h-4 w-4 text-[#6B7280]" />
        </button>

        <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex" style={{ gap: "12px" }}>
          {templates.map((tpl) => {
            return (
              <button
                key={tpl.id}
                onClick={() => handleSelect(tpl.id)}
                style={{ flex: "0 0 calc((100% - 24px) / 3)" }}
                className="relative flex-none rounded-2xl overflow-hidden bg-white text-left cursor-pointer transition-all duration-200 hover:-translate-y-1 border border-[#E8E8E4] shadow-sm hover:shadow-md hover:border-[#D4F542]/40"
              >
                {/* Preview image */}
                <div className="relative w-full aspect-[4/5] bg-[#F5F5F0]">
                  <Image
                    src={tpl.preview}
                    alt={tpl.nameRu}
                    fill
                    className="object-cover pointer-events-none"
                    sizes="(max-width: 768px) 33vw, 220px"
                    draggable={false}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>

                {/* Name */}
                <div className="px-3 py-2.5">
                  <p className="text-xs font-semibold truncate text-[#0D0D14]">{tpl.nameRu}</p>
                  <p className="text-[10px] mt-0.5 font-medium text-[#6B7280]">Выбрать →</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      </div>

      {/* Dot indicators */}
      {snapCount > 1 && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: snapCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Страница ${i + 1}`}
              style={{
                width: i === selectedSnap ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === selectedSnap ? "#0D0D14" : "rgba(0,0,0,0.15)",
                transition: "all 0.2s ease",
                border: "none",
                padding: 0,
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}

    </div>
  );
}
