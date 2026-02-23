# Editor Ink & Lime Restyle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restyle `swipely-editor` from blue/white theme to the Ink & Lime design of the main service — dark header, blueprint grid canvas, lime accents.

**Architecture:** Token swap in `tailwind.config.js` + `index.css`, then surgical class replacements in `App.tsx`. No logic changes. Three commits total (config/css, App.tsx header+canvas, App.tsx panel+states).

**Tech Stack:** React 18, Vite, Tailwind CSS v3, TypeScript

---

## Task 1: Update design tokens (tailwind.config.js + index.css)

**Files:**
- Modify: `swipely-editor/tailwind.config.js`
- Modify: `swipely-editor/src/index.css`

### Step 1: Update tailwind.config.js

Replace the entire `colors` block:

```js
colors: {
  primary: '#D4F542',
  'primary-dark': '#B8D928',
  'primary-light': '#E8FF6E',
  ink: '#0D0D14',
  charcoal: '#1A1A2E',
  'warm-white': '#FAFAF9',
},
```

### Step 2: Update src/index.css

Replace the entire `:root` block and `.btn-primary` rule, and add `.blueprint-bg`:

```css
:root {
  --color-primary: #D4F542;
  --color-primary-dark: #B8D928;
  --color-primary-light: #E8FF6E;
  --color-ink: #0D0D14;
  --color-charcoal: #1A1A2E;
  --color-warm-white: #FAFAF9;
}

html, body, #root {
  height: 100%;
  min-height: 100%;
}

body {
  font-family: 'Outfit', sans-serif;
  color: var(--color-charcoal);
  -webkit-tap-highlight-color: transparent;
}

html {
  overscroll-behavior: none;
}

@supports (padding: max(0px)) {
  .safe-bottom {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }

/* Blueprint grid — shared with landing and main app */
.blueprint-bg {
  background-color: #FAFAF9;
  background-image:
    linear-gradient(rgba(0,0,0,0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.055) 1px, transparent 1px),
    linear-gradient(rgba(0,0,0,0.10) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.10) 1px, transparent 1px);
  background-size: 24px 24px, 24px 24px, 120px 120px, 120px 120px;
}

/* Lime button — dark text because lime is a light color */
.btn-primary {
  @apply px-5 py-2.5 bg-[#D4F542] text-[#0D0D14] font-medium rounded-xl;
  @apply shadow-lg shadow-[#D4F542]/20 hover:shadow-xl hover:shadow-[#D4F542]/30;
  @apply transition-all duration-200 hover:bg-[#C8E830];
}

.btn-secondary {
  @apply px-5 py-2.5 bg-white text-slate-700 font-medium rounded-xl;
  @apply border border-slate-200 hover:bg-slate-50;
  @apply transition-all duration-200;
}

.card {
  @apply bg-white rounded-2xl border border-slate-200 shadow-sm;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.loading { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
```

### Step 3: Start dev server and verify no crashes

```bash
cd swipely-editor
npm run dev
```

Open `http://localhost:5173`. The app should load (with a token in URL — use any test token). Check the console for errors.

### Step 4: Commit

```bash
cd swipely-editor
git add tailwind.config.js src/index.css
git commit -m "feat(editor): update design tokens — Ink & Lime theme"
```

---

## Task 2: Restyle header and canvas area in App.tsx

**Files:**
- Modify: `swipely-editor/src/App.tsx`

### Step 1: Restyle the loading state

Find:
```tsx
<div className="h-screen flex items-center justify-center bg-slate-100">
  <div className="text-center">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
    <p className="text-slate-500">Загрузка...</p>
```

Replace with:
```tsx
<div className="h-screen flex items-center justify-center blueprint-bg">
  <div className="text-center">
    <div className="w-12 h-12 border-4 border-[#D4F542] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
    <p className="text-slate-500">Загрузка...</p>
```

### Step 2: Restyle the error state

Find:
```tsx
<div className="h-screen flex items-center justify-center bg-slate-100">
  <div className="text-center card p-8 max-w-md">
    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
```

Replace with:
```tsx
<div className="h-screen flex items-center justify-center blueprint-bg">
  <div className="text-center card p-8 max-w-md">
    <div className="w-16 h-16 bg-[#D4F542]/10 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg className="w-8 h-8 text-[#D4F542]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
```

### Step 3: Restyle the root layout div

Find:
```tsx
<div className="h-screen flex flex-col overflow-hidden bg-slate-100">
```

Replace with:
```tsx
<div className="h-screen flex flex-col overflow-hidden blueprint-bg">
```

### Step 4: Restyle the header

Find:
```tsx
<header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2 sm:py-3 flex-shrink-0">
```

Replace with:
```tsx
<header className="bg-[#0D0D14] border-b border-white/10 px-3 sm:px-6 py-2 sm:py-3 flex-shrink-0">
```

### Step 5: Restyle header text elements

Find:
```tsx
<h1 className="text-base sm:text-lg font-semibold text-slate-800 hidden xs:block">Swipely Editor</h1>
<span className="text-xs sm:text-sm text-slate-400 hidden sm:block">
```

Replace with:
```tsx
<h1 className="text-base sm:text-lg font-semibold text-white hidden xs:block">Swipely Editor</h1>
<span className="text-xs sm:text-sm text-white/40 hidden sm:block">
```

### Step 6: Restyle header navigation controls

Find:
```tsx
<div className="flex items-center gap-1 sm:gap-2 bg-slate-100 rounded-lg p-0.5 sm:p-1">
  <button
    onClick={() => scrollToSlide(Math.max(0, currentSlideIndex - 1))}
    disabled={currentSlideIndex === 0}
    className="p-1.5 sm:p-2 rounded hover:bg-white disabled:opacity-30 transition-colors"
  >
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </button>
  <span className="px-2 sm:px-3 text-xs sm:text-sm font-medium text-slate-600">
    {currentSlideIndex + 1}/{totalSlides}
  </span>
  <button
    onClick={() => scrollToSlide(Math.min(totalSlides - 1, currentSlideIndex + 1))}
    disabled={currentSlideIndex === totalSlides - 1}
    className="p-1.5 sm:p-2 rounded hover:bg-white disabled:opacity-30 transition-colors"
  >
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
</div>
```

Replace with:
```tsx
<div className="flex items-center gap-1 sm:gap-2 bg-white/10 rounded-lg p-0.5 sm:p-1">
  <button
    onClick={() => scrollToSlide(Math.max(0, currentSlideIndex - 1))}
    disabled={currentSlideIndex === 0}
    className="p-1.5 sm:p-2 rounded hover:bg-white/20 disabled:opacity-30 transition-colors text-white"
  >
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </button>
  <span className="px-2 sm:px-3 text-xs sm:text-sm font-medium text-white">
    {currentSlideIndex + 1}/{totalSlides}
  </span>
  <button
    onClick={() => scrollToSlide(Math.min(totalSlides - 1, currentSlideIndex + 1))}
    disabled={currentSlideIndex === totalSlides - 1}
    className="p-1.5 sm:p-2 rounded hover:bg-white/20 disabled:opacity-30 transition-colors text-white"
  >
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
</div>
```

### Step 7: Restyle the mobile edit button

Find:
```tsx
<button
  onClick={() => setShowEditPanel(!showEditPanel)}
  className="lg:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
```

Replace with:
```tsx
<button
  onClick={() => setShowEditPanel(!showEditPanel)}
  className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
```

### Step 8: Visual check in browser

With dev server running, verify:
- Header is dark `#0D0D14` ✓
- "Swipely Editor" text is white ✓
- Nav arrows are white on semi-transparent background ✓
- "Скачать PNG" button is now lime (from `.btn-primary` update in Task 1) ✓
- Canvas area has subtle blueprint grid ✓

### Step 9: Commit

```bash
cd swipely-editor
git add src/App.tsx
git commit -m "feat(editor): dark header + blueprint grid canvas — Ink & Lime"
```

---

## Task 3: Restyle edit panel active states and slide ring

**Files:**
- Modify: `swipely-editor/src/App.tsx`

### Step 1: Update element selector button active state

Find (there are 2 buttons — title and content — with this pattern):
```tsx
className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
  selectedElement === 'title'
    ? 'bg-primary text-white'
    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
}`}
```

Replace with:
```tsx
className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
  selectedElement === 'title'
    ? 'bg-[#D4F542] text-[#0D0D14]'
    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
}`}
```

And for the content button:
```tsx
className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
  selectedElement === 'content'
    ? 'bg-[#D4F542] text-[#0D0D14]'
    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
}`}
```

### Step 2: Update textarea focus ring

Find:
```tsx
className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
```

Replace with:
```tsx
className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D4F542]/50"
```

### Step 3: Update font size slider accent

Find:
```tsx
className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
```

Replace with:
```tsx
className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#D4F542]"
```

### Step 4: Update alignment buttons active state

Find:
```tsx
className={`flex-1 px-2 py-1.5 rounded-lg text-sm transition-colors ${
  (selectedElement === 'title' ? currentSlide.titleStyles?.textAlign : currentSlide.contentStyles?.textAlign) === align
    ? 'bg-primary text-white'
    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
}`}
```

Replace with:
```tsx
className={`flex-1 px-2 py-1.5 rounded-lg text-sm transition-colors ${
  (selectedElement === 'title' ? currentSlide.titleStyles?.textAlign : currentSlide.contentStyles?.textAlign) === align
    ? 'bg-[#D4F542] text-[#0D0D14]'
    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
}`}
```

### Step 5: Update color presets array

Find:
```tsx
{['#FFFFFF', '#000000', '#0A84FF', '#FF6B6B', '#FFE66D'].map((c) => (
```

Replace with:
```tsx
{['#FFFFFF', '#000000', '#0D0D14', '#D4F542', '#FF6B6B'].map((c) => (
```

### Step 6: Update color picker default value

Find:
```tsx
value={(selectedElement === 'title' ? currentSlide.titleStyles?.color : currentSlide.contentStyles?.color) || '#FFFFFF'}
```

No change needed — white default is fine.

### Step 7: Update active slide ring color in SlideCard

Find:
```tsx
${isActive
  ? 'ring-2 sm:ring-4 ring-primary shadow-xl sm:shadow-2xl shadow-primary/20 scale-100'
  : 'ring-1 ring-slate-200 shadow-md sm:shadow-lg opacity-70 sm:opacity-60 scale-[0.98] sm:scale-95 hover:opacity-80 hover:scale-[0.99] sm:hover:scale-[0.97]'
}
```

Replace with:
```tsx
${isActive
  ? 'ring-2 sm:ring-4 ring-[#D4F542] shadow-xl sm:shadow-2xl shadow-[#D4F542]/20 scale-100'
  : 'ring-1 ring-slate-200 shadow-md sm:shadow-lg opacity-70 sm:opacity-60 scale-[0.98] sm:scale-95 hover:opacity-80 hover:scale-[0.99] sm:hover:scale-[0.97]'
}
```

### Step 8: Update iframe drag/selection outline colors

Find this style block injected into the iframe (in `setupEditing`):
```tsx
style.textContent = `
  .headline, .content, .quote-text, .quote-author, .highlight-box, h1, p {
    transition: outline 0.15s ease;
  }
  .editable-element:hover {
    outline: 2px dashed rgba(10, 132, 255, 0.5) !important;
    outline-offset: 8px;
  }
  .editable-element.selected {
    outline: 2px solid #0A84FF !important;
    outline-offset: 8px;
  }
`;
```

Replace with:
```tsx
style.textContent = `
  .headline, .content, .quote-text, .quote-author, .highlight-box, h1, p {
    transition: outline 0.15s ease;
  }
  .editable-element:hover {
    outline: 2px dashed rgba(212, 245, 66, 0.6) !important;
    outline-offset: 8px;
  }
  .editable-element.selected {
    outline: 2px solid #D4F542 !important;
    outline-offset: 8px;
  }
`;
```

### Step 9: Visual check in browser

Verify:
- "Заголовок"/"Контент" active button = lime with dark text ✓
- Font size slider thumb = lime ✓
- Alignment buttons active = lime ✓
- Color presets show ink + lime swatches instead of blue ✓
- Active slide ring = lime glow ✓
- Clicking a text element in the slide shows lime outline ✓

### Step 10: Commit

```bash
cd swipely-editor
git add src/App.tsx
git commit -m "feat(editor): lime active states in edit panel + slide ring"
```

---

## Done

All three commits complete the restyle. Final check:

1. Open editor with a real session token
2. Header: dark `#0D0D14`, white text, white nav, lime "Скачать PNG" ✓
3. Canvas: blueprint grid background ✓
4. Active slide: lime ring ✓
5. Edit panel: lime active buttons/slider, updated color swatches ✓
6. Selecting text on slide: lime outline ✓
7. Export: still works (ExportButton only uses `.btn-primary` class — already updated in Task 1) ✓
