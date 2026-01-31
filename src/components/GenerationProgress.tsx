import React from 'react';

interface GenerationProgressProps {
  current: number;
  total: number;
  stage: 'content' | 'scenes' | 'images';
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  current,
  total,
  stage
}) => {
  const getStageText = () => {
    switch (stage) {
      case 'content':
        return 'Генерация контента карусели...';
      case 'scenes':
        return 'Создание описаний сцен...';
      case 'images':
        return `Генерация изображений персонажа: ${current}/${total}`;
      default:
        return 'Генерация...';
    }
  };

  const getProgress = () => {
    if (stage === 'content') return 10;
    if (stage === 'scenes') return 20;
    if (stage === 'images' && total > 0) {
      return 20 + Math.floor((current / total) * 80);
    }
    return 0;
  };

  const progress = getProgress();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-warm-white)',
          borderRadius: '24px',
          padding: '3rem',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '2px solid var(--color-cream)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            🎨
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              color: 'var(--color-charcoal)',
              marginBottom: '0.5rem',
            }}
          >
            Создаем визуальную магию
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              color: 'var(--color-teal)',
              margin: 0,
            }}
          >
            {getStageText()}
          </p>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '12px',
            backgroundColor: 'var(--color-cream)',
            borderRadius: '999px',
            overflow: 'hidden',
            position: 'relative',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--color-coral) 0%, var(--color-teal) 100%)',
              borderRadius: '999px',
              transition: 'width 0.5s ease-out',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Animated shine effect */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'shine 2s infinite',
              }}
            />
          </div>
        </div>

        {/* Progress Text */}
        <div
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            color: 'var(--color-teal-light)',
          }}
        >
          {progress}%
        </div>

        {/* Tip */}
        {stage === 'images' && (
          <div
            style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 107, 107, 0.2)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                color: 'var(--color-charcoal)',
                margin: 0,
                lineHeight: '1.6',
              }}
            >
              💡 <strong>Совет:</strong> Генерация изображений может занять 30-60 секунд.
              Мы создаем уникального персонажа для каждого слайда!
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        @keyframes shine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
      `}</style>
    </div>
  );
};
