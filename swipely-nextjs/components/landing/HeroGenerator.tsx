'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import SlideRenderer from '@/components/slides/SlideRenderer'
import { useGenerationSession } from '@/lib/hooks/useGenerationSession'
import type { SlideData } from '@/components/slides/types'

type GenerationState = 'idle' | 'loading' | 'success' | 'error' | 'rate_limited'

const PICKER_TEMPLATES = [
  { id: 'swipely', label: 'Swipely' },
  { id: 'dispatch', label: 'Dispatch' },
  { id: 'frame', label: 'Frame' },
  { id: 'chapter', label: 'Chapter' },
]

function IdlePlaceholder() {
  return (
    <div className="absolute inset-0 flex items-end justify-center gap-3 px-4 pb-6 overflow-hidden">
      {PICKER_TEMPLATES.slice(0, 3).map((t, i) => (
        <div
          key={t.id}
          className="relative rounded-xl overflow-hidden shadow-2xl flex-shrink-0"
          style={{
            width: '30%',
            aspectRatio: '4/5',
            transform: `rotate(${(i - 1) * 5}deg) translateY(${i === 1 ? -16 : 0}px)`,
            zIndex: i === 1 ? 2 : 1,
            opacity: i === 1 ? 1 : 0.6,
          }}
        >
          <Image
            src={`/previews/${t.id}.png`}
            alt={t.label}
            fill
            className="object-cover"
            sizes="120px"
          />
        </div>
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-sm text-muted-foreground bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
          Введите текст и нажмите Сгенерировать
        </p>
      </div>
    </div>
  )
}

interface HeroGeneratorProps {
  /** Controlled text value from parent */
  externalText?: string
  /** Increment this value to programmatically trigger generation */
  triggerGeneration?: number
}

export function HeroGenerator({ externalText, triggerGeneration }: HeroGeneratorProps) {
  const [template, setTemplate] = useState(PICKER_TEMPLATES[0].id)
  const [state, setState] = useState<GenerationState>('idle')
  const [slides, setSlides] = useState<SlideData[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const { save } = useGenerationSession()
  const router = useRouter()
  const prevTrigger = useRef(0)

  const generate = useCallback(async (textToUse?: string, templateToUse?: string) => {
    const t = textToUse ?? externalText ?? ''
    const tmpl = templateToUse ?? template
    if (t.trim().length < 10) return

    setState('loading')
    setCurrentSlide(0)

    try {
      const res = await fetch('/api/generate/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t, template: tmpl }),
      })

      if (res.status === 429) {
        setState('rate_limited')
        return
      }

      if (!res.ok) {
        setState('error')
        return
      }

      const data = await res.json()
      const generatedSlides: SlideData[] = data.slides ?? []
      const generatedCaption: string = data.post_caption ?? ''

      setSlides(generatedSlides)
      save({ slides: generatedSlides, caption: generatedCaption, template: tmpl, text: t })
      setState('success')
    } catch {
      setState('error')
    }
  }, [externalText, template, save])

  // Trigger generation when parent increments triggerGeneration
  useEffect(() => {
    if (triggerGeneration && triggerGeneration !== prevTrigger.current) {
      prevTrigger.current = triggerGeneration
      generate() // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [triggerGeneration, generate])

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {/* Template picker */}
      <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0">
        {PICKER_TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => setTemplate(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border flex-shrink-0 ${
              template === t.id
                ? 'bg-accent text-accent-foreground border-accent'
                : 'border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Preview area */}
      <div className="flex-1 relative rounded-2xl overflow-hidden bg-muted min-h-0">

        {state === 'idle' && <IdlePlaceholder />}

        {state === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Gemini AI создаёт карусель...</p>
          </div>
        )}

        {state === 'success' && slides.length > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="flex-1 flex items-center justify-center min-h-0 w-full">
              <SlideRenderer
                template={template}
                slide={slides[currentSlide]}
                slideNumber={currentSlide + 1}
                totalSlides={slides.length}
                format="portrait"
                showWatermark={true}
                maxWidth={280}
              />
            </div>
            {/* Dot navigation + arrows */}
            <div className="flex items-center gap-3 mt-3 flex-shrink-0">
              <button
                onClick={() => setCurrentSlide(i => Math.max(0, i - 1))}
                disabled={currentSlide === 0}
                className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Предыдущий слайд"
              >
                ‹
              </button>
              <div className="flex gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentSlide ? 'bg-accent' : 'bg-border'
                    }`}
                    aria-label={`Слайд ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setCurrentSlide(i => Math.min(slides.length - 1, i + 1))}
                disabled={currentSlide === slides.length - 1}
                className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Следующий слайд"
              >
                ›
              </button>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
            <p className="text-muted-foreground text-sm">Что-то пошло не так. Попробуй ещё раз.</p>
            <button
              onClick={() => setState('idle')}
              className="text-xs underline text-accent"
            >
              Повторить
            </button>
          </div>
        )}

        {state === 'rate_limited' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-6">
            <p className="text-muted-foreground text-sm">
              Лимит на сегодня исчерпан. Зарегистрируйтесь для безлимитного доступа.
            </p>
            <button
              onClick={() => router.push('/signup')}
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold"
            >
              Зарегистрироваться бесплатно
            </button>
          </div>
        )}
      </div>

      {/* CTA — shown after generation */}
      {state === 'success' && (
        <div className="flex-shrink-0">
          <button
            onClick={() => router.push('/signup')}
            className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Скачать без водяного знака &rarr;
          </button>
          <p className="text-xs text-muted-foreground text-center mt-1.5">
            Бесплатно. Без привязки карты.
          </p>
        </div>
      )}

    </div>
  )
}
