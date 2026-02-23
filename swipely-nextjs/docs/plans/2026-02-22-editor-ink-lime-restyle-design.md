# Editor Ink & Lime Restyle — Design

**Goal:** Restyle `swipely-editor` from blue/white theme to the Ink & Lime design language of the main service (`swipely-nextjs`), so all three products (app, editor, landing) share a unified visual identity.

**Scope:** `swipely-editor/` only. No logic changes.

---

## Design Tokens

| Token | Old | New |
|-------|-----|-----|
| Primary | `#0A84FF` (blue) | `#D4F542` (lime) |
| Primary dark | `#0066CC` | `#B8D928` |
| Background | `#f1f5f9` (slate-100) | `#FAFAF9` + blueprint grid |
| Ink | — | `#0D0D14` |

---

## Layout Zones

### Header (`bg-[#0D0D14]`)

- Logo: white rounded square, same style as main app sidebar logo
- "Swipely Editor" label: `text-white`
- Save indicator: `text-white/40`
- Nav buttons `< >`: white SVG icons on `bg-white/10`, `hover:bg-white/20`
- Slide counter "1/6": `text-white`
- Mobile edit button: `bg-white/10 hover:bg-white/20`, white icon
- "Скачать PNG" button: `bg-[#D4F542] text-[#0D0D14]` (lime with dark text, matching "Создать карусель" in main app)

### Canvas Area (blueprint grid)

Background: `#FAFAF9` with blueprint grid pattern (same as landing + main service):
```css
background-image:
  linear-gradient(rgba(0,0,0,0.055) 1px, transparent 1px),
  linear-gradient(90deg, rgba(0,0,0,0.055) 1px, transparent 1px),
  linear-gradient(rgba(0,0,0,0.10) 1px, transparent 1px),
  linear-gradient(90deg, rgba(0,0,0,0.10) 1px, transparent 1px);
background-size: 24px 24px, 24px 24px, 120px 120px, 120px 120px;
```

- Active slide ring: `ring-[#D4F542]`, shadow `shadow-[#D4F542]/20`
- Inactive slides: keep `ring-slate-200 opacity-60`

### Edit Panel (stays white, right sidebar)

- Active element selector buttons: `bg-[#D4F542] text-[#0D0D14]` (not `bg-primary text-white`)
- Alignment buttons active: `bg-[#D4F542] text-[#0D0D14]`
- Textarea focus ring: `focus:ring-[#D4F542]/50 focus:border-[#D4F542]`
- Font size slider: `accent-[#D4F542]`
- Color presets: `['#FFFFFF', '#000000', '#0D0D14', '#D4F542', '#FF6B6B']` (replace `#0A84FF` with lime + add ink)
- Inline iframe drag outline: `rgba(212,245,66,0.5)` and `#D4F542` (replace `#0A84FF`)

### Loading & Error States

- Background: blueprint grid (same class as canvas area)
- Spinner: `border-[#D4F542]`
- Error icon background: `bg-[#D4F542]/10`, icon color `text-[#D4F542]`
- "Открыть бота" CTA: lime button

---

## Files Changed

| File | Change |
|------|--------|
| `tailwind.config.js` | Update `primary` → `#D4F542`, add `ink: '#0D0D14'`, update `warm-white` |
| `src/index.css` | Update CSS vars, add `.blueprint-bg` utility, update `.btn-primary` to lime + dark text |
| `src/App.tsx` | Restyle header, canvas div, loading/error states, edit panel button active states, color presets, iframe drag outline color |
