"use client";

import SlideRenderer from "@/components/slides/SlideRenderer";
import type { SlideData } from "@/components/slides/types";

const SLIDE_TYPES: SlideData[] = [
  { type: "hook", title: "5 ошибок в <hl>контенте</hl> которые убивают продажи", content: "Разбираем главные промахи, из-за которых ваш контент не работает" },
  { type: "tension", title: "Вы тратите часы на <hl>посты</hl> которые никто не читает", content: "80% контента в соцсетях получает менее 10 реакций. Знакомая ситуация?" },
  { type: "value", title: "Формула цепляющего <hl>заголовка</hl>", content: "Используйте числа + эмоцию + конкретику. Например: «3 способа удвоить вовлечённость за неделю»" },
  { type: "proof", title: "Мы увеличили охваты <hl>в 4 раза</hl> за месяц", content: "Клиент из ниши beauty перешёл с 200 просмотров на 800+ после внедрения нашей стратегии" },
  { type: "insight", title: "Лучшее время для <hl>публикации</hl>", content: "Алгоритм Instagram продвигает посты, которые набирают реакции в первые 30 минут" },
  { type: "contrast", title: "<hl>До</hl> и <hl>после</hl> нашей стратегии", content: "Было: хаотичные посты без плана. Стало: контент-воронка с конверсией 12%" },
  { type: "cta", title: "Готовы <hl>прокачать</hl> свой контент?", content: "Запишитесь на бесплатный разбор вашего профиля — покажем точки роста" },
];

const TEMPLATES = ["street", "chapter", "dispatch"] as const;

export default function PreviewLayoutsPage() {
  return (
    <div style={{ background: "#111", minHeight: "100vh", padding: 40 }}>
      <h1 style={{ color: "#fff", fontFamily: "sans-serif", fontSize: 28, marginBottom: 8 }}>
        Layout Variants Preview
      </h1>
      <p style={{ color: "#888", fontFamily: "sans-serif", fontSize: 14, marginBottom: 40 }}>
        Rows: templates (Street, Chapter, Dispatch) | Columns: slide types (hook, tension, value, proof, insight, contrast, cta)
      </p>

      {TEMPLATES.map((tpl) => (
        <div key={tpl} style={{ marginBottom: 60 }}>
          <h2 style={{ color: "#ccc", fontFamily: "sans-serif", fontSize: 20, marginBottom: 16, textTransform: "capitalize" }}>
            {tpl}
          </h2>
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16 }}>
            {SLIDE_TYPES.map((slide, i) => (
              <div key={i} style={{ flexShrink: 0 }}>
                <div style={{ color: "#666", fontFamily: "monospace", fontSize: 11, marginBottom: 6, textAlign: "center" }}>
                  {slide.type}
                </div>
                <SlideRenderer
                  template={tpl}
                  slide={slide}
                  slideNumber={i === 0 ? 1 : i === SLIDE_TYPES.length - 1 ? SLIDE_TYPES.length : i + 1}
                  totalSlides={SLIDE_TYPES.length}
                  format="portrait"
                  scale={0.22}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
