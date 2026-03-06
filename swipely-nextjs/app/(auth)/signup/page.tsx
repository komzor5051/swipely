'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { TelegramLoginButton } from '@/components/auth/TelegramLoginButton'

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('ref')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Step 1: Create user via server API
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...(referralCode ? { referralCode } : {}) }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Step 2: Try to sign in (works only after email confirmation)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!signInError) {
        router.push('/generate')
        router.refresh()
        return
      }

      // Email confirmation required — show success screen
      if (signInError.message.toLowerCase().includes('email not confirmed') ||
          signInError.message.toLowerCase().includes('not confirmed')) {
        setEmailSent(true)
        return
      }

      throw signInError
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="text-4xl">✉️</div>
            <h2 className="text-xl font-semibold">Проверь почту</h2>
            <p className="text-gray-600 text-sm">
              На <span className="font-medium">{email}</span> отправлена ссылка для подтверждения.
              Перейди по ней — и сразу попадёшь в Swipely.
            </p>
            <p className="text-xs text-gray-400">
              Не пришло письмо? Проверь папку «Спам».
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Регистрация</CardTitle>
          <CardDescription>Создайте аккаунт для продолжения</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {referralCode && (
              <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200">
                Тебя пригласил друг — после регистрации получишь +3 Photo-слайда!
              </div>
            )}
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500">Минимум 6 символов</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Загрузка...' : 'Зарегистрироваться'}
            </Button>
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E8E8E4]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-[#6B7280]">или</span>
              </div>
            </div>
            <TelegramLoginButton />
            <p className="text-sm text-center text-gray-600">
              Уже есть аккаунт?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Войти
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
