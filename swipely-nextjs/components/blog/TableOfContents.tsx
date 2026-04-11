"use client";

import { useEffect, useRef, useState } from "react";

export interface TocItem {
  id: string;
  text: string;
  depth: 2 | 3;
}

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    const headingIds = items.map((i) => i.id);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible heading
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    headingIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Оглавление">
      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">
        Оглавление
      </p>
      <ul className="space-y-0.5 border-l border-border">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                  setActiveId(item.id);
                }}
                className={[
                  "block py-1 text-sm transition-colors leading-snug",
                  item.depth === 3 ? "pl-5" : "pl-3",
                  isActive
                    ? "text-[#0A84FF] font-medium border-l-2 border-[#0A84FF] -ml-px"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
