# Swipely Brand Templates

Фирменные шаблоны для постов в соцсетях Swipely.

## Шаблоны

### Объявления/Новости
| Файл | Размер | Описание |
|------|--------|----------|
| `announcement-square.html` | 1080x1080 | Светлый квадрат для новостей |
| `announcement-vertical.html` | 1080x1350 | Вертикальный с фичами |
| `announcement-dark.html` | 1080x1080 | Тёмный со статистикой |

### Образовательные
| Файл | Размер | Описание |
|------|--------|----------|
| `educational-square.html` | 1080x1080 | Советы с tip-карточкой |
| `educational-vertical.html` | 1080x1350 | Пошаговая инструкция |
| `educational-tips-list.html` | 1080x1350 | Список советов/ошибок |

## Фирменный стиль

### Цвета
```css
--primary: #0A84FF;      /* Основной синий */
--primary-dark: #0066CC; /* Тёмный синий */
--lime: #D4F542;         /* Акцент лайм */
--pink: #F9A8D4;         /* Акцент розовый */
--charcoal: #1A1A2E;     /* Тёмный текст */
--gray: #64748B;         /* Вторичный текст */
```

### Шрифты
- **Outfit** — заголовки и текст (wght 400-800)
- **Space Mono** — цифры, счётчики

### Элементы
- Сетка 40x40px с opacity 0.03-0.04
- Декоративные лайм-линии под углом -25°
- Хайлайты текста (lime/pink background)
- Синяя подсветка под хайлайтом
- Точечный паттерн 20x20px
- Градиентные свечения (glow)

## Использование

### 1. Открыть в браузере
```bash
open announcement-square.html
```
Затем сделать скриншот (Cmd+Shift+4 на Mac).

### 2. Рендеринг через Puppeteer
```bash
node render.js announcement-square.html output.png
```

### 3. Редактирование
Открой HTML в любом редакторе и измени:
- Текст в `.headline`, `.subtext`, `.content-text`
- Бейдж в `.badge`
- Номер слайда в `.number-indicator`
- Эмодзи в `.tip-icon`, `.feature-icon`

## Структура HTML

```html
<div class="grid-bg"></div>           <!-- Фоновая сетка -->
<div class="deco-lines">...</div>     <!-- Декоративные линии -->
<div class="badge">Текст</div>        <!-- Бейдж -->
<div class="content-wrapper">
  <h1 class="headline">
    Текст <span class="highlight">выделение</span>
  </h1>
  <p class="subtext">Подзаголовок</p>
</div>
<div class="footer">...</div>         <!-- Логотип + CTA -->
```

## Варианты хайлайтов

```html
<!-- Лайм с синей подчёркиванием -->
<span class="highlight">текст</span>

<!-- Розовый без подчёркивания -->
<span class="highlight-pink">текст</span>

<!-- Синий (для тёмной темы) -->
<span class="highlight-blue">текст</span>
```

## Быстрые правки

### Изменить основной цвет
В `:root` замени `--primary: #0A84FF;`

### Изменить размер
В `body` измени `width` и `height`

### Убрать сетку
Удали или скрой `.grid-bg`

### Добавить свой логотип
Замени SVG в `.logo-icon` на `<img src="logo.png">`
