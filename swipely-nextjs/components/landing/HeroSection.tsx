'use client'

import { useState } from 'react'
import { HeroGenerator } from './HeroGenerator'

export function HeroSection() {
  const [heroText, setHeroText] = useState('')
  const [triggerGeneration, setTriggerGeneration] = useState(0)

  return (
    <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-start relative z-10">
      {/* Left column — text input */}
      <div className="flex flex-col gap-4 pt-4">
        <textarea
          value={heroText}
          onChange={e => setHeroText(e.target.value)}
          placeholder="Вставь любой текст, статью или идею для карусели..."
          rows={5}
          className="w-full rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground p-4 text-sm resize-none focus:outline-none focus:border-accent transition-colors"
        />
        <button
          onClick={() => setTriggerGeneration(n => n + 1)}
          disabled={heroText.trim().length < 10}
          className="w-full py-4 rounded-2xl bg-accent text-accent-foreground font-bold text-base disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          Сгенерировать карусель
        </button>
        <p className="text-xs text-muted-foreground text-center">
          Без регистрации. Бесплатно. 30 секунд.
        </p>
      </div>

      {/* Right column — preview */}
      <div className="h-[520px]">
        <HeroGenerator
          externalText={heroText}
          triggerGeneration={triggerGeneration}
        />
      </div>
    </div>
  )
}
