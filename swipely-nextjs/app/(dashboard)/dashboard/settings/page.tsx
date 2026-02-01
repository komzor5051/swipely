import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Настройки</h2>
        <p className="text-gray-600">Управляйте настройками вашего аккаунта</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Профиль</CardTitle>
          <CardDescription>Обновите информацию о вашем профиле</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <Input id="name" placeholder="Ваше имя" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="demo@example.com" disabled />
            <p className="text-sm text-gray-600">Email нельзя изменить</p>
          </div>
          <Button>Сохранить изменения</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Подписка</CardTitle>
          <CardDescription>Управляйте вашей подпиской</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Текущий план: Pro</p>
              <p className="text-sm text-gray-600">₽19,000 / месяц</p>
            </div>
            <Button variant="outline">Изменить план</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Опасная зона</CardTitle>
          <CardDescription>Необратимые действия с аккаунтом</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Удалить аккаунт</Button>
        </CardContent>
      </Card>
    </div>
  )
}