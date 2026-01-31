import React from 'react';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export const LimitReachedModal: React.FC<LimitReachedModalProps> = ({
  isOpen,
  onClose,
  onUpgrade
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-scale-in">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
            <i className="ph ph-lock text-red-500 text-4xl"></i>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-3" style={{color: 'var(--color-charcoal)'}}>
          Лимит генераций исчерпан
        </h2>

        {/* Description */}
        <p className="text-center mb-6" style={{color: 'var(--color-teal-light)'}}>
          Вы использовали все <span className="font-semibold" style={{color: 'var(--color-coral)'}}>5 бесплатных генераций</span> в этом месяце.
          Обновитесь до PRO для безлимитного доступа!
        </p>

        {/* Benefits */}
        <div className="rounded-xl p-5 mb-6" style={{background: 'linear-gradient(135deg, var(--color-cream) 0%, var(--color-warm-white) 100%)'}}>
          <div className="flex items-center gap-2 mb-3">
            <i className="ph ph-crown text-xl" style={{color: 'var(--color-butter)'}}></i>
            <span className="font-bold" style={{color: 'var(--color-charcoal)'}}>PRO подписка включает:</span>
          </div>
          <ul className="space-y-2 text-sm" style={{color: 'var(--color-charcoal)'}}>
            <li className="flex items-center gap-2">
              <i className="ph ph-check-circle" style={{color: 'var(--color-teal)'}}></i>
              <span>Безлимитные генерации</span>
            </li>
            <li className="flex items-center gap-2">
              <i className="ph ph-check-circle" style={{color: 'var(--color-teal)'}}></i>
              <span>Доступ к обоим режимам</span>
            </li>
            <li className="flex items-center gap-2">
              <i className="ph ph-check-circle" style={{color: 'var(--color-teal)'}}></i>
              <span>Приоритетная поддержка</span>
            </li>
            <li className="flex items-center gap-2">
              <i className="ph ph-check-circle" style={{color: 'var(--color-teal)'}}></i>
              <span>Экспорт в высоком качестве</span>
            </li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border rounded-lg font-medium transition-colors"
            style={{borderColor: 'var(--color-cream)', color: 'var(--color-teal)'}}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-cream)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Позже
          </button>
          <button
            onClick={() => {
              onClose();
              onUpgrade();
            }}
            className="flex-1 px-4 py-3 text-white rounded-lg font-semibold transition-all transform hover:-translate-y-0.5"
            style={{background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)', boxShadow: '0 4px 20px rgba(255, 107, 107, 0.4)'}}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 30px rgba(255, 107, 107, 0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 107, 107, 0.4)'}
          >
            Обновить до PRO
          </button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Лимиты сбрасываются каждый месяц
        </p>
      </div>
    </div>
  );
};
