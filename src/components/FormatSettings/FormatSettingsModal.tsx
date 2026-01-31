import React, { useState } from 'react';
import { FormatSettings } from '../../types';

interface FormatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (settings: FormatSettings) => void;
  userTopic: string;
}

export default function FormatSettingsModal({ isOpen, onClose, onGenerate, userTopic }: FormatSettingsModalProps) {
  const [settings, setSettings] = useState<FormatSettings>({
    language: 'ru',
    slideCount: 10,
    includeOriginalText: false,
    customStyleGuide: '',
    characterImage: undefined,
    visualStorytellingEnabled: false,
  });
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = (file: File) => {
    console.log('📸 ЗАГРУЗКА ФОТО ПЕРСОНАЖА:', file.name, file.size, 'bytes');

    // Валидация
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, загрузите изображение (JPG, PNG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('Размер файла не должен превышать 5MB');
      return;
    }

    // Конвертация в base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      console.log('✅ ФОТО КОНВЕРТИРОВАНО в base64, длина:', base64String.length, 'символов');
      setSettings(prev => ({
        ...prev,
        characterImage: base64String,
        visualStorytellingEnabled: true, // Автоматически включаем
      }));
      console.log('✅ visualStorytellingEnabled УСТАНОВЛЕН В TRUE');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const removeCharacterImage = () => {
    setSettings(prev => ({
      ...prev,
      characterImage: undefined,
      visualStorytellingEnabled: false,
    }));
  };

  const handleSlideCountChange = (delta: number) => {
    setSettings(prev => ({
      ...prev,
      slideCount: Math.max(3, Math.min(15, prev.slideCount + delta))
    }));
  };

  const handleGenerate = () => {
    console.log('🚀 КНОПКА "СОЗДАТЬ" НАЖАТА');
    console.log('⚙️ Передаваемые настройки:', settings);
    console.log('📸 Персонаж загружен?', settings.characterImage ? 'ДА (' + settings.characterImage.substring(0, 50) + '...)' : 'НЕТ');
    console.log('🎭 Visual Storytelling включен?', settings.visualStorytellingEnabled);
    onGenerate(settings);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(45, 49, 66, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-warm-white)',
          borderRadius: '24px',
          padding: '2rem',
          maxWidth: '560px',
          width: '100%',
          maxHeight: 'calc(100vh - 2rem)',
          overflow: 'hidden',
          border: '2px solid var(--color-cream)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h2 style={{
              margin: 0,
              fontSize: 'var(--text-2xl)',
              fontFamily: 'var(--font-display)',
              color: 'var(--color-charcoal)',
            }}>
              Настройки формата
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: 'var(--color-teal)',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.color = 'var(--color-coral)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.color = 'var(--color-teal)';
              }}
            >
              <i className="ph-bold ph-x"></i>
            </button>
          </div>
          <p style={{
            margin: 0,
            fontSize: 'var(--text-sm)',
            color: 'var(--color-teal-light)',
            fontFamily: 'var(--font-body)',
          }}>
            Настройте параметры генерации карусели
          </p>
        </div>

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          paddingRight: '0.5rem',
          marginRight: '-0.5rem',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--color-coral) var(--color-cream)',
        }}>
        {/* User Topic Display */}
        {userTopic && (
          <div style={{
            backgroundColor: 'var(--color-cream)',
            borderRadius: '12px',
            padding: '0.75rem',
            marginBottom: '1rem',
            border: '1px solid rgba(13, 59, 102, 0.1)',
          }}>
            <div style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-teal)',
              fontWeight: '600',
              marginBottom: '0.25rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Тема карусели
            </div>
            <div style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-charcoal)',
              lineHeight: '1.5',
            }}>
              {userTopic}
            </div>
          </div>
        )}

        {/* Language Selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: 'var(--text-sm)',
            fontWeight: '600',
            color: 'var(--color-teal)',
            marginBottom: '0.5rem',
            fontFamily: 'var(--font-body)',
          }}>
            <i className="ph-bold ph-globe" style={{ marginRight: '0.5rem' }}></i>
            Язык контента
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {(['ru', 'en'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSettings(prev => ({ ...prev, language: lang }))}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.25rem',
                  fontSize: 'var(--text-base)',
                  fontWeight: '600',
                  border: settings.language === lang
                    ? '2px solid var(--color-coral)'
                    : '2px solid var(--color-cream)',
                  backgroundColor: settings.language === lang
                    ? 'rgba(255, 107, 107, 0.1)'
                    : 'var(--color-cream)',
                  color: settings.language === lang
                    ? 'var(--color-coral)'
                    : 'var(--color-charcoal)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={(e) => {
                  if (settings.language !== lang) {
                    e.currentTarget.style.borderColor = 'var(--color-coral-dark)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (settings.language !== lang) {
                    e.currentTarget.style.borderColor = 'var(--color-cream)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {lang === 'ru' ? 'Русский' : 'English'}
              </button>
            ))}
          </div>
        </div>

        {/* Slide Count */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: 'var(--text-sm)',
            fontWeight: '600',
            color: 'var(--color-teal)',
            marginBottom: '0.5rem',
            fontFamily: 'var(--font-body)',
          }}>
            <i className="ph-bold ph-stack" style={{ marginRight: '0.5rem' }}></i>
            Количество слайдов
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            backgroundColor: 'var(--color-cream)',
            borderRadius: '12px',
            padding: '0.5rem',
          }}>
            <button
              onClick={() => handleSlideCountChange(-1)}
              disabled={settings.slideCount <= 3}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: settings.slideCount <= 3
                  ? 'rgba(0,0,0,0.05)'
                  : 'var(--color-warm-white)',
                color: settings.slideCount <= 3
                  ? 'rgba(0,0,0,0.3)'
                  : 'var(--color-coral)',
                cursor: settings.slideCount <= 3 ? 'not-allowed' : 'pointer',
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (settings.slideCount > 3) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.backgroundColor = 'var(--color-coral)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (settings.slideCount > 3) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = 'var(--color-warm-white)';
                  e.currentTarget.style.color = 'var(--color-coral)';
                }
              }}
            >
              <i className="ph-bold ph-minus"></i>
            </button>

            <input
              type="number"
              min={3}
              max={15}
              value={settings.slideCount}
              onChange={(e) => {
                const value = Math.max(3, Math.min(15, parseInt(e.target.value) || 3));
                setSettings(prev => ({ ...prev, slideCount: value }));
              }}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 'var(--text-2xl)',
                fontWeight: '700',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--color-charcoal)',
                fontFamily: 'var(--font-display)',
                outline: 'none',
              }}
            />

            <button
              onClick={() => handleSlideCountChange(1)}
              disabled={settings.slideCount >= 15}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: settings.slideCount >= 15
                  ? 'rgba(0,0,0,0.05)'
                  : 'var(--color-warm-white)',
                color: settings.slideCount >= 15
                  ? 'rgba(0,0,0,0.3)'
                  : 'var(--color-coral)',
                cursor: settings.slideCount >= 15 ? 'not-allowed' : 'pointer',
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (settings.slideCount < 15) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.backgroundColor = 'var(--color-coral)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (settings.slideCount < 15) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = 'var(--color-warm-white)';
                  e.currentTarget.style.color = 'var(--color-coral)';
                }
              }}
            >
              <i className="ph-bold ph-plus"></i>
            </button>
          </div>
          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-teal-light)',
            marginTop: '0.5rem',
            marginBottom: 0,
          }}>
            Диапазон: от 3 до 15 слайдов
          </p>
        </div>

        {/* Include Original Text Toggle */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            backgroundColor: 'var(--color-cream)',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(244, 241, 234, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-cream)';
          }}
          >
            <div>
              <div style={{
                fontSize: 'var(--text-sm)',
                fontWeight: '600',
                color: 'var(--color-charcoal)',
                marginBottom: '0.25rem',
                fontFamily: 'var(--font-body)',
              }}>
                <i className="ph-bold ph-text-aa" style={{ marginRight: '0.5rem', color: 'var(--color-teal)' }}></i>
                Сохранить оригинал
              </div>
              <div style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-teal-light)',
              }}>
                Включить текст пользователя в карусель
              </div>
            </div>
            <div
              onClick={(e) => {
                e.preventDefault();
                setSettings(prev => ({ ...prev, includeOriginalText: !prev.includeOriginalText }));
              }}
              style={{
                width: '52px',
                height: '28px',
                borderRadius: '14px',
                backgroundColor: settings.includeOriginalText
                  ? 'var(--color-coral)'
                  : 'rgba(0, 0, 0, 0.1)',
                position: 'relative',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '12px',
                backgroundColor: 'white',
                position: 'absolute',
                top: '2px',
                left: settings.includeOriginalText ? '26px' : '2px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              }}></div>
            </div>
          </label>
        </div>

        {/* Visual Storytelling - Character Upload */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: 'var(--text-sm)',
            fontWeight: '600',
            color: 'var(--color-teal)',
            marginBottom: '0.5rem',
            fontFamily: 'var(--font-body)',
          }}>
            <i className="ph-bold ph-camera" style={{ marginRight: '0.5rem' }}></i>
            Визуальный сторителлинг с персонажем
          </label>

          {!settings.characterImage ? (
            /* Upload Zone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('character-image-input')?.click()}
              style={{
                padding: '1.5rem',
                backgroundColor: isDragging
                  ? 'rgba(255, 107, 107, 0.1)'
                  : 'var(--color-cream)',
                border: isDragging
                  ? '2px dashed var(--color-coral)'
                  : '2px dashed rgba(13, 59, 102, 0.2)',
                borderRadius: '12px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              <i className="ph-fill ph-image" style={{
                fontSize: '2rem',
                color: 'var(--color-teal)',
                marginBottom: '0.5rem',
                display: 'block',
              }}></i>
              <div style={{
                fontSize: 'var(--text-sm)',
                fontWeight: '600',
                color: 'var(--color-charcoal)',
                marginBottom: '0.5rem',
              }}>
                Загрузите фото вашего персонажа
              </div>
              <div style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-teal-light)',
                marginBottom: '0.5rem',
              }}>
                Перетащите файл сюда или кликните для выбора
              </div>
              <div style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-teal-light)',
                fontStyle: 'italic',
              }}>
                JPG, PNG | Макс. 5MB
              </div>
              <input
                id="character-image-input"
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            /* Preview */
            <div style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '2px solid var(--color-coral)',
              backgroundColor: 'var(--color-cream)',
            }}>
              <img
                src={settings.characterImage}
                alt="Character reference"
                style={{
                  width: '100%',
                  height: '120px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeCharacterImage();
                }}
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(255, 107, 107, 0.9)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(238, 90, 111, 1)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.9)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <i className="ph-bold ph-x"></i>
              </button>
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '0.75rem',
                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                color: 'white',
                fontSize: 'var(--text-xs)',
                fontWeight: '600',
              }}>
                <i className="ph-fill ph-check-circle" style={{ marginRight: '0.5rem', color: 'var(--color-butter)' }}></i>
                Персонаж загружен! Будет использован во всех слайдах
              </div>
            </div>
          )}

          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-teal-light)',
            marginTop: '0.5rem',
            marginBottom: 0,
          }}>
            💡 Загрузите своё фото или изображение маскота для создания уникальной карусели с персонажем
          </p>
        </div>

        {/* Custom Style Guide (Pro Feature) */}
        <div style={{
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: 'rgba(255, 217, 61, 0.1)',
          border: '2px dashed var(--color-butter)',
          borderRadius: '12px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 'var(--text-sm)',
                fontWeight: '600',
                color: 'var(--color-charcoal)',
                marginBottom: '0.25rem',
                fontFamily: 'var(--font-body)',
              }}>
                <i className="ph-bold ph-palette" style={{ marginRight: '0.5rem', color: 'var(--color-butter)' }}></i>
                Настройте свой стиль
              </div>
              <div style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-teal-light)',
              }}>
                Создайте уникальный style guide для брендированных каруселей
              </div>
            </div>
            <div style={{
              backgroundColor: 'var(--color-butter)',
              color: 'var(--color-charcoal)',
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              fontSize: 'var(--text-xs)',
              fontWeight: '700',
              fontFamily: 'var(--font-mono)',
            }}>
              PRO
            </div>
          </div>
        </div>

        {/* End Scrollable Content */}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.875rem 1.5rem',
              fontSize: 'var(--text-base)',
              fontWeight: '600',
              border: '2px solid var(--color-cream)',
              backgroundColor: 'var(--color-cream)',
              color: 'var(--color-charcoal)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-coral)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-cream)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleGenerate}
            style={{
              flex: 2,
              padding: '0.875rem 1.5rem',
              fontSize: 'var(--text-base)',
              fontWeight: '600',
              border: 'none',
              background: 'linear-gradient(135deg, var(--color-coral) 0%, var(--color-coral-dark) 100%)',
              color: 'white',
              borderRadius: '12px',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 4px 14px rgba(255, 107, 107, 0.4)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(255, 107, 107, 0.4)';
            }}
          >
            <i className="ph-bold ph-sparkle" style={{ marginRight: '0.5rem' }}></i>
            Сгенерировать карусель
          </button>
        </div>
      </div>
    </div>
  );
}
