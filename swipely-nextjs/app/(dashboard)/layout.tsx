import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Settings, LogOut } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6 flex flex-col">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">SaaS App</h2>
        </div>
        
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/settings">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-700">
          <div className="mb-4 text-sm">
            <p className="text-gray-400">Вход как:</p>
            <p className="font-medium truncate">demo@example.com</p>
          </div>
          <Link href="/login">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b px-8 py-4">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </header>
        <main className="flex-1 p-8 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}