import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">SaaS Boilerplate</h1>
          <div className="flex gap-4">
            <Link href="/pricing">
              <Button variant="ghost">Тарифы</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">Войти</Button>
            </Link>
            <Link href="/signup">
              <Button>Начать</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-4xl text-center">
          <h1 className="text-6xl font-bold mb-6">
            Запускай SaaS продукты<br />за 4 недели
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Готовый boilerplate с авторизацией, оплатой и dashboard.<br />
            Просто клонируй и добавляй свою бизнес-логику.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Начать бесплатно
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Посмотреть тарифы
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t py-8 text-center text-gray-600">
        <p>© 2025 SaaS Boilerplate. Сделано для 12/12 Startup Challenge.</p>
      </footer>
    </div>
  )
}