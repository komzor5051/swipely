# Requirements: Swipely Milestone 2

**Defined:** 2026-03-19
**Core Value:** Каждый слайд выглядит по-разному — разные композиции, rich-элементы и фото вместо одинаковых текстовых блоков.

## v1 Requirements

### Layout System

- [ ] **LAYOUT-01**: AI назначает layout для каждого слайда (text-left, text-right, split, big-number, quote, default)
- [ ] **LAYOUT-02**: Существующие шаблоны рендерятся корректно с новой системой лейаутов (backward compatibility)
- [ ] **LAYOUT-03**: Gemini использует responseSchema enum для надёжного варьирования лейаутов
- [ ] **LAYOUT-04**: `backdrop-filter` заменён на solid rgba во всех шаблонах (иначе html-to-image экспорт сломан)

### Rich Elements

- [ ] **RICH-01**: Пользователь получает слайды с нумерованными списками (стильный рендеринг, не дефолтный `<ol>`)
- [ ] **RICH-02**: Пользователь получает слайды со stat/infographic-элементами (большая цифра + подпись)
- [ ] **RICH-03**: Пользователь получает слайды с bar chart (inline SVG, без внешних зависимостей)
- [ ] **RICH-04**: Пользователь получает слайды с pie chart (inline SVG, без внешних зависимостей)
- [ ] **RICH-05**: Rich-элементы корректно экспортируются в PNG через html-to-image

### User Photos

- [ ] **PHOTO-01**: Пользователь загружает свои фото через веб-редактор (Supabase Storage)
- [ ] **PHOTO-02**: Фото рендерится как full-bleed фон слайда с текстом поверх
- [ ] **PHOTO-03**: Фото рендерится как split-лейаут (половина фото + половина текст)
- [ ] **PHOTO-04**: Слайды с фото корректно экспортируются в PNG (base64 перед toPng, не URL)

### Content Calendar

- [ ] **PLAN-01**: Пользователь открывает страницу /content-plan в приложении
- [ ] **PLAN-02**: Пользователь вводит нишу/тему и получает 30-дневный контент-план от AI
- [ ] **PLAN-03**: Пользователь видит план в виде списка/сетки: дата, тема, тип поста
- [ ] **PLAN-04**: Пользователь запускает генерацию карусели из любого пункта контент-плана одним кликом
- [ ] **PLAN-05**: Контент-план сохраняется в Supabase и не теряется при перезагрузке

## v2 Requirements

### Publishing

- **PUB-01**: Публикация карусели напрямую в Instagram
- **PUB-02**: Планирование публикаций по дате из контент-плана

### Editor

- **EDIT-01**: Drag-and-drop редактор лейаутов (пользователь сам меняет компоновку)
- **EDIT-02**: Несколько фото на один слайд

### Advanced

- **ADV-01**: Анимированные слайды (motion)
- **ADV-02**: Видео-слайды

## Out of Scope

| Feature | Reason |
|---------|--------|
| swipely-bot | Milestone 2 фокус только на web (swipely-nextjs) |
| Canvas-based chart libs (Chart.js, Recharts) | html-to-image их не захватывает корректно |
| Ручной выбор лейаута пользователем | AI выбирает автоматически по контексту; сложный UX |
| Планировщик/автопостинг | Требует соцсеть интеграций, отдельный milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAYOUT-01 | Phase 1 | Pending |
| LAYOUT-02 | Phase 1 | Pending |
| LAYOUT-03 | Phase 1 | Pending |
| LAYOUT-04 | Phase 1 | Pending |
| RICH-01 | Phase 2 | Pending |
| RICH-02 | Phase 2 | Pending |
| RICH-03 | Phase 2 | Pending |
| RICH-04 | Phase 2 | Pending |
| RICH-05 | Phase 2 | Pending |
| PHOTO-01 | Phase 3 | Pending |
| PHOTO-02 | Phase 3 | Pending |
| PHOTO-03 | Phase 3 | Pending |
| PHOTO-04 | Phase 3 | Pending |
| PLAN-01 | Phase 4 | Pending |
| PLAN-02 | Phase 4 | Pending |
| PLAN-03 | Phase 4 | Pending |
| PLAN-04 | Phase 4 | Pending |
| PLAN-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-19*
