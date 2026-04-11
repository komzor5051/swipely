'use client'

import { useCallback } from 'react'
import type { SlideData } from '@/components/slides/types'

export interface GenerationSession {
  slides: SlideData[]   // JSON slide data (rendered client-side)
  caption: string
  template: string
  text: string          // original input text — needed for signup handoff
}

const SESSION_KEY = 'swipely_preview'

export function useGenerationSession() {
  const save = useCallback((data: GenerationSession) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
    } catch {
      // sessionStorage unavailable (private browsing, storage full) — silently skip
    }
  }, [])

  const load = useCallback((): GenerationSession | null => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      // Basic validation
      if (!Array.isArray(parsed.slides) || !parsed.caption || !parsed.template) return null
      return parsed as GenerationSession
    } catch {
      return null
    }
  }, [])

  const clear = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {}
  }, [])

  return { save, load, clear }
}
