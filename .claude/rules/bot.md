---
paths: "swipely-bot/**/*"
---

# swipely-bot Architecture

## Generation Pipeline

**Standard Mode:** User Input → Gemini AI Content → HTML Template → Puppeteer PNG → Telegram

**Photo Mode:** User Input + Photo → Gemini Content (text) → Gemini Image Gen (per-slide) → Text Overlay → Telegram
- Styles: cartoon (Pixar/Disney) or realistic (professional photography)
- Max 7 slides, cost ~13.5₽/slide

## Source Layout

| Path | Purpose |
|------|---------|
| `src/index.js` | ~2,500-line monolith — all Telegram handlers and callback routing |
| `src/services/` | All integrations (see below) |
| `src/templates/` | 16 HTML templates with `{{TITLE}}`, `{{CONTENT}}`, `{{SLIDE_NUMBER}}` |
| `src/config/pricing.js` | Pricing constants |
| `src/utils/copy.js` | ALL user-facing strings (Russian) — never hardcode user text elsewhere |
| `src/utils/constants.ts` | Global constants |
| `src/components/`, `src/contexts/`, `src/hooks/` | Leftover artifacts from old React app — unused |

## Key Services

| File | Purpose |
|------|---------|
| `gemini.js` | Primary AI — Gemini 2.5 Flash, `getDesignConfig()` returns design presets |
| `renderer.js` | Puppeteer HTML→PNG, `generateSlideHTML()` maps template names to files |
| `supabaseService.js` | 19+ DB functions for profiles, payments, generations |
| `yookassa.js` | YooKassa payment processing |
| `whisper.js` | Voice→text via OpenAI Whisper (optional, needs `OPENAI_API_KEY`) |
| `editorService.js` | Creates 24h edit sessions, uploads images to Supabase Storage |
| `imageGenerator.js` | Photo Mode — Gemini image generation |
| `tovAnalyzer.js` | Tone-of-voice analysis for brand consistency |

## Templates (16 HTML)

`app_list` · `aurora` · `backspace` · `editorial` · `grid_multi` · `lime_checklist` · `luxe` · `notebook` · `paper_image` · `purple_accent` · `quote_doodle` · `receipt` · `speech_bubble` · `star_highlight` · `swipely` · `terminal`

**Note:** Bot HTML templates (`src/templates/`) are independent from `swipely-nextjs` React components. The bot retains all 16; nextjs replaced 9 of them with Chapter, Dispatch, Frame, Street, and updated others.

## Session State (In-Memory, lost on bot restart)

```js
sessions[userId] = {
  transcription, slideCount, format, generationMode,
  awaitingPhoto, referencePhoto, imageStyle, awaitingUsername
}
```

## Callback Routing (index.js)

**Exact matches (`===`):** `menu_account`, `menu_buy`, `menu_create`, `menu_legal`, `menu_main`, `menu_referral`, `mode_photo`, `mode_standard`, `view_packs`, `view_pro`, `view_styles`

**Prefix matches (`startsWith`):** `confirm_custom_`, `buy_pack_`, `check_payment_`, `pay_photo_`, `topup_`, `stars_*`, `rub_*`, `admin_`, `slides_`, `format_`, `tone_`, `imgstyle_`, `style_`

Telegram Stars: `bot.on('pre_checkout_query')` and `bot.on('successful_payment')` handle Stars payments.

## Pricing

| Tier | Price | Standard | Photo Mode |
|------|-------|----------|------------|
| Free | 0₽ | 3/month | Not available |
| PRO Monthly | 990₽/mo | Unlimited | 20% discount |
| PRO Yearly | 9,900₽/yr | Unlimited | 20% discount |

Photo per-carousel: 149₽ (3 slides) · 249₽ (5) · 349₽ (7)
Packs: 490₽ (15) · 1490₽ (50) · 3990₽ (150)
Per-slide top-up: 49₽ (free) / 39₽ (PRO)
Telegram Stars multiplier: RUB × 0.693 = Stars

## Deployment

- Docker: `node:18-slim` + Chromium, runs as non-root `botuser`
- Production: `pm2 start ecosystem.config.js` or `docker run --env-file .env`
- Puppeteer on Linux requires `chromium-browser` + `--no-sandbox` flag
