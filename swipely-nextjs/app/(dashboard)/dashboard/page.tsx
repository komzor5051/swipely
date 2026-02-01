import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Users, CreditCard, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Добро пожаловать!</h2>
        <p className="text-gray-600">Вот обзор вашей активности</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Всего запросов
            </CardTitle>
            <Activity className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-gray-600">+20% от прошлого месяца</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Активных пользователей
            </CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-gray-600">+5 за эту неделю</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Выручка
            </CardTitle>
            <CreditCard className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₽48,000</div>
            <p className="text-xs text-gray-600">+12% от прошлого месяца</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Конверсия
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24%</div>
            <p className="text-xs text-gray-600">+4% от прошлого месяца</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Последняя активность</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'Создан новый запрос', time: '2 минуты назад' },
              { action: 'Обновлены настройки', time: '1 час назад' },
              { action: 'Экспорт данных завершён', time: '3 часа назад' },
              { action: 'Новый платёж получен', time: '5 часов назад' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium">{item.action}</p>
                  <p className="text-sm text-gray-600">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}