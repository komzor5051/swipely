import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }

      // Success - close modal
      onClose();
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Ошибка авторизации. Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-scale-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <i className="ph ph-x text-xl"></i>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)', boxShadow: '0 10px 30px rgba(255, 107, 107, 0.3)'}}>
            <i className="ph ph-user text-white text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold" style={{color: 'var(--color-charcoal)'}}>
            {mode === 'signin' ? 'Вход' : 'Регистрация'}
          </h2>
          <p className="mt-2" style={{color: 'var(--color-teal-light)'}}>
            {mode === 'signin'
              ? 'Войдите, чтобы продолжить создание каруселей'
              : 'Создайте аккаунт и получите 5 бесплатных генераций'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <i className="ph ph-warning-circle"></i>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border rounded-lg outline-none transition-all"
              style={{borderColor: 'var(--color-cream)', background: 'var(--color-warm-white)'}}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-coral)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-cream)'}
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border rounded-lg outline-none transition-all"
              style={{borderColor: 'var(--color-cream)', background: 'var(--color-warm-white)'}}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-coral)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-cream)'}
              disabled={isLoading}
            />
          </div>

          {/* Confirm Password (signup only) */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Подтвердите пароль
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border rounded-lg outline-none transition-all"
                style={{borderColor: 'var(--color-cream)', background: 'var(--color-warm-white)'}}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-coral)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-cream)'}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)', boxShadow: '0 4px 20px rgba(255, 107, 107, 0.4)'}}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 30px rgba(255, 107, 107, 0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 107, 107, 0.4)'}
          >
            {isLoading ? (
              <>
                <i className="ph ph-spinner animate-spin"></i>
                Загрузка...
              </>
            ) : (
              <>{mode === 'signin' ? 'Войти' : 'Зарегистрироваться'}</>
            )}
          </button>
        </form>

        {/* Switch mode */}
        <div className="mt-6 text-center">
          <button
            onClick={switchMode}
            className="text-sm transition-colors"
            style={{color: 'var(--color-teal-light)'}}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-coral)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-teal-light)'}
          >
            {mode === 'signin' ? (
              <>
                Нет аккаунта?{' '}
                <span className="font-semibold" style={{color: 'var(--color-coral)'}}>Зарегистрируйтесь</span>
              </>
            ) : (
              <>
                Уже есть аккаунт?{' '}
                <span className="font-semibold" style={{color: 'var(--color-coral)'}}>Войдите</span>
              </>
            )}
          </button>
        </div>

        {/* Info для signup */}
        {mode === 'signup' && (
          <div className="mt-6 p-4 rounded-lg text-sm" style={{background: 'var(--color-cream)'}}>
            <div className="flex items-start gap-2">
              <i className="ph ph-info mt-0.5" style={{color: 'var(--color-coral)'}}></i>
              <div>
                <span className="font-semibold" style={{color: 'var(--color-teal)'}}>Бесплатный тариф:</span>
                <ul className="mt-1 space-y-1" style={{color: 'var(--color-charcoal)'}}>
                  <li>• 5 генераций в месяц</li>
                  <li>• Доступ к обоим режимам</li>
                  <li>• Экспорт в PNG</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
