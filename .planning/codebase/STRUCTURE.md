# Codebase Structure

**Analysis Date:** 2026-03-19

## Directory Layout

```
swipely-monorepo/
├── swipely-nextjs/         # Main SaaS web app (Next.js 16 + React 19)
├── swipely-bot/            # Telegram bot (currently a redirect stub)
├── swipely-editor/         # Web carousel editor (React 18 + Vite)
├── swipely-api/            # Mini App backend API (Express)
├── landing/                # Static landing page (separate git repo)
├── brand-templates/        # Marketing HTML templates (Puppeteer render)
├── src/                    # STALE DUPLICATE of swipely-bot/src (DO NOT EDIT)
├── .planning/codebase/     # GSD planning documents (this directory)
├── supabase_migration.sql  # Database schema + RPC functions
├── CLAUDE.md               # Monorepo architecture guide
└── .claude/rules/          # Scoped rules (bot.md, nextjs.md, env.md)
```

## Directory Purposes

**swipely-nextjs/**
- Purpose: Main production SaaS application — carousel generation, editing, payment, admin panel
- Contains: Next.js 16 (App Router), React 19, Tailwind v4, Zustand stores, API routes
- Key files: `app/layout.tsx`, `app/api/generate/route.ts`, `lib/supabase/`, `components/slides/`
- Deploy: Selectel VPS (178.72.168.235) via GitHub Actions SSH + pm2
- Env: `.env.local` with Supabase keys, Gemini API, AuraPay, admin email

**swipely-bot/**
- Purpose: Legacy Telegram bot (now a redirect stub to swipely.ru)
- Contains: Node.js + node-telegram-bot-api, services for generation/rendering/payments
- Current behavior: All user messages redirected to website with promo
- Note: Has its own `.git` repo (separate from monorepo root)
- Deploy: Railway Docker container

**swipely-editor/**
- Purpose: Standalone web carousel editor — load carousel JSON, edit text, export PNG
- Contains: React 18 + Vite, Supabase browser client, html2canvas
- Entry: `src/App.tsx` (mounts to `src/main.tsx`)
- Components: `SlideNavigator`, `TextEditPanel`, `SlideCanvas`, `ExportButton`
- Deploy: Vercel (edit.swipely.ai)
- Note: Lightweight client-only app, no backend

**swipely-api/**
- Purpose: Backend for Telegram Mini App — auth, carousel generation, usage tracking
- Contains: Express, Supabase service_role client, OpenRouter AI
- Routes: `/api/auth/*`, `/api/carousel/*`, `/api/usage/*`
- Entry: `src/index.js`
- Deploy: Local only (not actively deployed)

**landing/**
- Purpose: Static landing page (marketing site copy, pricing, features)
- Contains: Next.js 16 + Tailwind, Supabase auth
- Note: Separate git repo — never commit from swipely root
- Deploy: Vercel (swipely.ru)

**brand-templates/**
- Purpose: HTML→PNG rendering templates for marketing (use Puppeteer)
- Contains: 40+ HTML files (notebook.html, aurora.html, etc.)
- Usage: `swipely-bot/src/services/renderer.js` loads and renders these
- Note: Only used by bot (legacy); nextjs has React templates instead

## Key File Locations

**Entry Points:**
- `swipely-nextjs/app/layout.tsx` — root layout, wraps entire app
- `swipely-bot/src/index.js` — bot polling loop + message handlers
- `swipely-editor/src/App.tsx` — editor UI root
- `swipely-api/src/index.js` — Express server
- `landing/app/page.tsx` — landing page (separate repo)

**Configuration:**
- `swipely-nextjs/.env.local` — API keys, Supabase URLs, admin email
- `swipely-bot/.env` — bot token, Gemini API, Supabase, YooKassa
- `swipely-editor/.env.local` — Supabase URL + keys
- `swipely-api/.env` — bot token, OpenRouter, Supabase
- `supabase_migration.sql` — database schema (tables + RPC functions)
- `.claude/rules/env.md` — all env vars documented

**Core Logic:**

*Nextjs generation:*
- `swipely-nextjs/app/api/generate/route.ts` — main generation endpoint (180+ lines)
- `swipely-nextjs/lib/supabase/queries.ts` — types + RPC callers (Profile, Generation, Usage)
- `swipely-nextjs/lib/supabase/admin.ts` — service-role client initialization

*Bot generation (legacy):*
- `swipely-bot/src/services/gemini.js` — Gemini/OpenRouter AI wrapper
- `swipely-bot/src/services/renderer.js` — Puppeteer HTML→PNG pipeline
- `swipely-bot/src/services/imageGenerator.js` — Gemini 3 Pro Image generation (photo mode)
- `swipely-bot/src/config/pricing.js` — subscription tier definitions
- `swipely-bot/src/utils/copy.js` — all user-facing Russian strings

*Slide rendering:*
- `swipely-nextjs/components/slides/SlideRenderer.tsx` — central routing to template components
- `swipely-nextjs/lib/templates/registry.ts` — template metadata (23 public + 3 B2B)
- `swipely-nextjs/components/slides/templates/*.tsx` — individual slide component implementations

*Payment/auth:*
- `swipely-nextjs/app/api/payments/create.ts` — AuraPay payment link creation
- `swipely-nextjs/app/api/webhooks/aurapay.ts` — payment confirmation → update subscription
- `swipely-nextjs/app/api/auth/telegram.ts` — Telegram OAuth via initData

*Admin panel:*
- `swipely-nextjs/app/admin/layout.tsx` — admin guard (notFound() if not ADMIN_EMAIL)
- `swipely-nextjs/app/admin/actions.ts` — server actions (user lookup, payments, broadcast)
- `swipely-nextjs/app/admin/page.tsx` — dashboard with charts

*Blog system:*
- `swipely-nextjs/lib/blog/pipeline/` — topic-miner, writer, editors, publisher modules
- `swipely-nextjs/app/blog/page.tsx` — blog listing
- `swipely-nextjs/app/blog/[slug]/page.tsx` — individual post (ISR)
- `swipely-nextjs/app/cron/generate.ts` — scheduled blog generation
- `swipely-nextjs/scripts/batch-generate.ts` — manual bulk generation

**Testing:**
- No test suites in any sub-project
- Manual testing via Telegram, web UI, or API calls

**Database/Supabase:**
- `supabase_migration.sql` — schema (profiles, generations, api_keys, payments, blog_posts, blog_topics)
- RPC functions: `claim_generation_slot`, `reset_monthly_if_needed`, `claim_api_key_slot`
- Auth: Supabase email/password + Telegram OAuth
- RLS: enabled on key tables, admin client bypasses

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `SwipelySlide.tsx`, `SlideRenderer.tsx`)
- Utilities: camelCase (e.g., `getSlideDimensions.ts`, `cleanMarkdown.ts`)
- Pages: lowercase (e.g., `page.tsx`, `layout.tsx`)
- Services: camelCase (e.g., `gemini.js`, `supabaseService.js`)
- Types: PascalCase with suffix (e.g., `SlideProps`, `Profile`, `Generation`)

**Directories:**
- Features: lowercase (e.g., `components/`, `lib/`, `app/api/`)
- Route groups: parentheses (e.g., `(auth)/`, `(dashboard)/`)
- Nested routes: brackets (e.g., `[slug]/`, `[id]/`)

**Variables/Functions:**
- Functions: camelCase (e.g., `generateCarouselContent`, `buildSystemPrompt`)
- Constants: UPPER_SNAKE_CASE (e.g., `DEFAULT_MODEL`, `TEMPLATES_DIR`)
- React hooks: camelCase with `use` prefix (e.g., `useGenerations`, `useMediaQuery`)
- Store selectors: camelCase (e.g., `useGenerateStore`, `useAuthStore`)

**Slide Types:**
- Names: lowercase (e.g., `"hook"`, `"tension"`, `"value"`, `"cta"`)
- Template IDs: lowercase with underscores (e.g., `"swipely"`, `"grid_multi"`, `"purple_accent"`)

## Where to Add New Code

**New Generation Feature:**
- Generation logic: `swipely-nextjs/app/api/[endpoint]/route.ts`
- Supabase queries: add to `lib/supabase/queries.ts`
- UI component: `swipely-nextjs/components/[feature]/`
- Tests: no test suite yet; test manually

**New Slide Template:**
1. Create `swipely-nextjs/components/slides/templates/[NameSlide].tsx` implementing `SlideProps`
2. Add to `TEMPLATE_MAP` in `swipely-nextjs/components/slides/SlideRenderer.tsx`
3. Register in `swipely-nextjs/lib/templates/registry.ts`:
   - Public: add to `templates[]` array
   - B2B: add to `tenantTemplates[]` with `tenantId` set
4. Add design config to `designPresets` in `swipely-nextjs/app/api/generate/route.ts`
5. Add preview image: `swipely-nextjs/public/previews/[id].png`

**New API Endpoint:**
- Location: `swipely-nextjs/app/api/[route]/route.ts`
- Pattern: export `POST`, `GET`, etc. as async functions
- Auth: use `createServerClient` for public endpoints, `createAdminClient` for DB mutations
- Returns: JSON `{ success: boolean, data: {...}, error?: string }`

**New Dashboard Page:**
- Location: `swipely-nextjs/app/(dashboard)/[feature]/page.tsx`
- Automatically protected by `(dashboard)/layout.tsx` auth guard
- Use Zustand store from `lib/store/` for state
- Fetch data from API routes in `useEffect` or `useServer` action

**New Cron Job:**
- Location: `swipely-nextjs/app/api/cron/[job-name]/route.ts`
- Verify auth: check `CRON_SECRET` header (bearer token)
- Export `GET` function
- Use `createAdminClient` for DB access

**Utilities/Helpers:**
- Shared helpers: `swipely-nextjs/lib/utils/`
- Service layer: `swipely-nextjs/lib/services/` (e.g., `image-generator.ts`, `stripe.ts`)
- Type definitions: `swipely-nextjs/lib/types/` or in `queries.ts`

**Styling:**
- Use Tailwind v4 classes (no `tailwind.config.js`, config via CSS `@theme` in `globals.css`)
- Component-scoped: CSS modules (`.module.css`)
- Global: `app/globals.css`
- Design tokens: dark bg (`#0D0D14`), lime accent (`#D4F542`)

## Special Directories

**`.planning/codebase/`:**
- Purpose: GSD planning documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated: yes (by orchestrator)
- Committed: yes

**`.claude/rules/`:**
- Purpose: Scoped rules that auto-load based on file path
- Files: `bot.md`, `nextjs.md`, `templates.md`, `env.md`
- Committed: yes
- Used by: Claude Code to load context-specific guidance

**`public/previews/`:**
- Purpose: Template preview images (PNG 1080x1350)
- Generated: partially (some manually added)
- Committed: yes
- Used by: template picker UI to show visual previews

**`docs/`:**
- Purpose: Design specs, economics, UX guides (non-code documentation)
- Files: `Swipely Design Presets.txt`, `Swipely Telegram Bot Full UX Copy Guide.docx`, etc.
- Committed: yes

**`output/` (bot only):**
- Purpose: Temporary storage for generated carousel PNGs
- Generated: yes
- Committed: no (in `.gitignore`)

**`brand-templates/`:**
- Purpose: HTML carousel templates for bot rendering
- Contains: 40+ `.html` files (aurora, notebook, terminal, etc.)
- Generated: no (manually authored)
- Committed: yes

**`previews/` (bot only):**
- Purpose: PNG thumbnails of generated carousels (for demo)
- Generated: yes (by bot)
- Committed: partially

---

*Structure analysis: 2026-03-19*
