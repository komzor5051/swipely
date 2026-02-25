# Environment Variables

## swipely-bot/.env

```
TELEGRAM_BOT_TOKEN=
GOOGLE_GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=        # Actually service_role key (misleading name)
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
OPENAI_API_KEY=           # Optional — voice transcription via Whisper
EDITOR_API_URL=           # https://edit.swipely.ai
EDITOR_BOT_SECRET=
```

## swipely-nextjs/.env.local

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # Required by admin client (generate, tov, webhooks, signup)
GOOGLE_GEMINI_API_KEY=        # Used by /api/generate (REST) and /api/generate/photo (@google/genai SDK)
AURAPAY_API_KEY=              # Required by /api/payments/create
AURAPAY_SHOP_ID=              # Required by /api/payments/create
NEXT_PUBLIC_APP_URL=          # Base URL for payment callbacks (default: http://localhost:3000)
```

## swipely-editor/.env.local

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
EDITOR_BOT_SECRET=
```

## swipely-api/.env

```
TELEGRAM_BOT_TOKEN=
OPENROUTER_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```
