"use client";

import { useState } from "react";
import Image from "next/image";
import { templates } from "@/lib/templates/registry";
import type { Template } from "@/lib/templates/registry";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { TemplateModal } from "./TemplateModal";

const PREVIEW_IDS = ["chapter", "frame", "street", "quote_doodle"];

const NICHE_LABELS: Record<string, string> = {
  chapter: "Эксперты · Блоги · Образование",
  frame: "Премиум · Люкс · Бренды",
  street: "Маркетинг · SMM · Лайфстайл",
  quote_doodle: "Мотивация · Психология · Коучинг",
  swipely: "Фирменный · Градиент",
  grid_multi: "Яркий · Модульный",
  purple_accent: "Светлый · Элегантный",
  receipt: "Креативный · Моно",
  speech_bubble: "Чат · Диалог",
  star_highlight: "Акценты · Энергичный",
  dispatch: "Newsletter · Структура",
  newspaper: "Редакция · Серьёзный",
};

export function TemplatesGallery() {
  const [showAll, setShowAll] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const previewTemplates = PREVIEW_IDS
    .map((id) => templates.find((t) => t.id === id))
    .filter(Boolean) as typeof templates;

  const hiddenTemplates = templates.filter(
    (t) => !PREVIEW_IDS.includes(t.id)
  );

  const visible = showAll
    ? [...previewTemplates, ...hiddenTemplates]
    : previewTemplates;

  return (
    <section id="templates" className="py-24 px-6 bg-muted/50">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          tag="Шаблоны"
          title="12 дизайн-стилей под любую нишу"
          description="От строгого делового до яркого и дерзкого"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {visible.map((t) => (
            <div
              key={t.id}
              className="group relative rounded-2xl overflow-hidden border border-border bg-card hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
              onClick={() => setSelectedTemplate(t)}
            >
              <div className="aspect-[4/5] relative bg-muted">
                <Image
                  src={t.preview}
                  alt={t.nameRu}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-sm">{t.nameRu}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {NICHE_LABELS[t.id] ?? t.tags.join(" · ")}
                </p>
              </div>
            </div>
          ))}
        </div>

        {!showAll && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-border bg-card text-sm font-semibold hover:border-[#D4F542]/50 hover:bg-[#D4F542]/10 hover:text-[#5A7A00] transition-all cursor-pointer"
            >
              Показать все {templates.length} шаблонов →
            </button>
          </div>
        )}
      </div>

      {selectedTemplate && (
        <TemplateModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </section>
  );
}
