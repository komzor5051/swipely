'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import type { Template } from '@/lib/templates/registry'

interface TemplateModalProps {
  template: Template
  onClose: () => void
}

export function TemplateModal({ template, onClose }: TemplateModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-card rounded-2xl max-w-sm w-full overflow-hidden border border-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Preview image */}
        <div className="relative aspect-[4/5] w-full bg-muted">
          <Image
            src={template.preview}
            alt={template.nameRu}
            fill
            className="object-cover"
            sizes="384px"
          />
        </div>

        {/* Info + CTA */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-lg font-semibold text-foreground">{template.nameRu}</h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none ml-2 mt-0.5"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
          <a
            href="/signup"
            className="block w-full py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm text-center hover:opacity-90 transition-opacity"
          >
            Попробовать шаблон
          </a>
        </div>
      </div>
    </div>
  )
}
