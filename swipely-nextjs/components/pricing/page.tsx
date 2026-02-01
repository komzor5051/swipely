import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    price: '9,000',
    description: 'Для начинающих',
    features: [
      '100 запросов в месяц',
      'Базовая поддержка',
      'Email уведомления',
      'API доступ',
    ],
  },
  {
    name: 'Pro',
    price: '19,000',
    description: 'Для профессионалов',
    popular: true,
    features: [
      '1,000 запросов в месяц',
      'Приоритетная поддержка',
      'Email + Telegram уведомления',
      'API доступ',
      'Расширенная аналитика',
      'Экспорт данных',
    ],
  },
  {
    name: 'Enterprise',
    price: '49,000',
    description: 'Для бизнеса',
    features: [
      'Безлимитные запросы',
      'Выделенная поддержка 24/7',
      'Все виды уведомлений',
      'API доступ',
      'Полная аналитика',
      'Экспорт данных',
      'Custom интеграции',
      'SLA гарантия',
    ],
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Тарифы</h1>
          <p className="text-xl text-gray-600">
            Выберите подходящий план для вашего бизнеса
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={plan.popular ? 'border-blue-500 border-2 relative' : ''}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Популярный
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-600"> ₽/мес</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/signup" className="w-full">
                  <Button 
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    Начать
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}