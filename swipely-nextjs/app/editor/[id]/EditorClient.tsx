"use client";

import { useState, useCallback } from "react";
import CarouselEditor from "@/components/generate/CarouselEditor";
import type { SlideData } from "@/components/slides/types";

interface Slide extends SlideData {
  type: string;
}

interface EditorClientProps {
  generationId: string;
  template: string;
  format: "square" | "portrait";
  slides: SlideData[];
  postCaption: string;
}

export default function EditorClient({
  generationId,
  template,
  format,
  slides: initialSlides,
  postCaption: initialCaption,
}: EditorClientProps) {
  const [slides, setSlides] = useState<Slide[]>(
    initialSlides.map((s) => ({ ...s, type: (s as Slide).type ?? "value" }))
  );
  const [postCaption, setPostCaption] = useState(initialCaption);

  const handleUpdateSlide = useCallback(
    (index: number, field: "title" | "content", value: string) => {
      setSlides((prev) =>
        prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
      );
    },
    []
  );

  const handleUpdateCaption = useCallback((value: string) => {
    setPostCaption(value);
  }, []);

  const handleClose = useCallback(() => {
    window.location.href = "https://swipely.ru";
  }, []);

  const handleChangeTemplate = useCallback((_id: string) => {
    // Template switching is disabled in the public editor
  }, []);

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      {/* Header */}
      <div className="w-full px-4 py-4 flex items-center justify-between border-b border-white/10">
        <a
          href="https://swipely.ru"
          className="text-[#D4F542] font-bold text-lg tracking-tight"
        >
          swipely.ru
        </a>
        <a
          href={`/viewer/${generationId}`}
          className="text-[#9CA3AF] text-sm hover:text-white transition-colors"
        >
          Просмотр
        </a>
      </div>

      {/* Editor */}
      <CarouselEditor
        slides={slides}
        template={template}
        format={format}
        postCaption={postCaption}
        onUpdateSlide={handleUpdateSlide}
        onUpdateCaption={handleUpdateCaption}
        onClose={handleClose}
        onChangeTemplate={handleChangeTemplate}
        isPro={false}
      />

      {/* CTA */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="p-6 rounded-xl bg-[#D4F542]/10 border border-[#D4F542]/20 text-center">
          <p className="text-white font-semibold mb-2">Создай свою карусель</p>
          <p className="text-[#9CA3AF] text-sm mb-4">
            Swipely — AI-генератор каруселей для Instagram и других соцсетей
          </p>
          <a
            href="https://swipely.ru"
            className="inline-block px-6 py-2.5 rounded-lg bg-[#D4F542] text-[#0D0D14] font-semibold text-sm hover:bg-[#c8e83a] transition-colors"
          >
            Попробовать
          </a>
        </div>
      </div>
    </div>
  );
}
