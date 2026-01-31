import React, { useState } from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Pricing plans
const PLANS = [
  {
    id: 'monthly',
    months: 1,
    price: 790,
    pricePerMonth: 790,
    label: '1 месяц',
    discount: null,
    popular: false
  },
  {
    id: 'quarterly',
    months: 3,
    price: 2086,
    pricePerMonth: 695,
    label: '3 месяца',
    discount: '12%',
    popular: true
  },
  {
    id: 'yearly',
    months: 12,
    price: 7205,
    pricePerMonth: 600,
    label: '1 год',
    discount: '24%',
    popular: false
  }
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1].id); // Default to quarterly
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    const plan = PLANS.find(p => p.id === selectedPlan);
    if (!plan) return;

    setIsProcessing(true);

    // TODO: Implement payment via YooKassa
    // For now, just show alert
    alert(`Оплата ${plan.price}₽ за ${plan.label} будет реализована через ЮKassa`);

    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <i className="ph ph-x text-xl"></i>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{background: 'linear-gradient(135deg, #FFD93D 0%, #FF6B6B 100%)', boxShadow: '0 10px 30px rgba(255, 215, 61, 0.4)'}}>
            <i className="ph ph-crown text-white text-3xl"></i>
          </div>
          <h2 className="text-3xl font-bold mb-2" style={{color: 'var(--color-charcoal)'}}>
            Обновитесь до PRO
          </h2>
          <p style={{color: 'var(--color-teal-light)'}}>
            Создавайте до 50 премиум каруселей ежемесячно
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className="relative p-5 border-2 rounded-xl cursor-pointer transition-all"
              style={selectedPlan === plan.id ? {borderColor: 'var(--color-coral)', background: 'var(--color-cream)', boxShadow: '0 10px 30px rgba(255, 107, 107, 0.2)', transform: 'scale(1.05)'} : {borderColor: 'var(--color-cream)'}}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="text-white text-xs font-bold px-3 py-1 rounded-full" style={{background: 'linear-gradient(135deg, #FFD93D 0%, #FF6B6B 100%)'}}>
                    Популярный
                  </span>
                </div>
              )}

              {/* Discount badge */}
              {plan.discount && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-10 h-10 rounded-full flex items-center justify-center">
                  -{plan.discount}
                </div>
              )}

              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 mb-2">{plan.label}</div>
                <div className="mb-3">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600"> ₽</span>
                </div>
                {plan.months > 1 && (
                  <div className="text-sm text-gray-600">
                    {plan.pricePerMonth}₽/месяц
                  </div>
                )}
              </div>

              {/* Checkmark */}
              <div className={`mt-4 flex justify-center ${selectedPlan === plan.id ? 'opacity-100' : 'opacity-0'}`}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{background: 'var(--color-coral)'}}>
                  <i className="ph ph-check text-white font-bold"></i>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="rounded-xl p-6 mb-6" style={{background: 'linear-gradient(135deg, var(--color-cream) 0%, var(--color-warm-white) 100%)'}}>
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{color: 'var(--color-charcoal)'}}>
            <i className="ph ph-sparkle" style={{color: 'var(--color-butter)'}}></i>
            Что включено в PRO:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              '50 генераций каруселей в месяц',
              'Визуальный сторителлинг с персонажем',
              'Премиум качество с Claude Sonnet',
              'Экспорт в высоком качестве',
              'Приоритетная поддержка',
              'Доступ к новым функциям'
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm" style={{color: 'var(--color-charcoal)'}}>
                <i className="ph ph-check-circle" style={{color: 'var(--color-teal)'}}></i>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleUpgrade}
          disabled={isProcessing}
          className="w-full text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
          style={{background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)', boxShadow: '0 4px 30px rgba(255, 107, 107, 0.4)'}}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 40px rgba(255, 107, 107, 0.6)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 30px rgba(255, 107, 107, 0.4)'}
        >
          {isProcessing ? (
            <>
              <i className="ph ph-spinner animate-spin"></i>
              Обработка...
            </>
          ) : (
            <>
              <i className="ph ph-crown"></i>
              Оплатить {PLANS.find(p => p.id === selectedPlan)?.price}₽
            </>
          )}
        </button>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Безопасная оплата через ЮKassa. Подписка продлевается автоматически.
        </p>
      </div>
    </div>
  );
};
