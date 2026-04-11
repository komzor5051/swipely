'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type TgWindow = Window & { __tgAuth?: (data: Record<string, unknown>) => void }

export function TelegramLoginButton() {
  const ref = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
    const container = ref.current
    if (!bot || !container) return

    ;(window as TgWindow).__tgAuth = async (data: Record<string, unknown>) => {
      setLoading(true)
      setError('')
      const payload: Record<string, string> = {}
      for (const [k, v] of Object.entries(data)) payload[k] = String(v)

      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!res.ok) { setError(json.error || 'Ошибка'); setLoading(false); return }

      // Verify OTP directly in browser — no URL redirect needed
      const supabase = createClient()
      const { error: otpErr } = await supabase.auth.verifyOtp({
        email: json.email,
        token: json.token,
        type: 'email',
      })

      if (otpErr) { setError('Ошибка входа'); setLoading(false); return }
      window.location.href = '/generate'
    }

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', bot)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-radius', '8')
    script.setAttribute('data-onauth', '__tgAuth(user)')
    script.async = true
    container.appendChild(script)

    return () => {
      delete (window as TgWindow).__tgAuth
      container.innerHTML = ''
    }
  }, [])

  if (loading) return <div className="h-10 flex items-center justify-center text-sm text-gray-500">Входим...</div>
  return (
    <div className="space-y-1">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div ref={ref} />
    </div>
  )
}
