# Technology Stack

**Analysis Date:** 2026-03-19

## Languages

**Primary:**
- JavaScript/Node.js (18.x) — Bot and API backends, Telegram integration
- TypeScript 5.5 — Next.js 16 web app, API routes, shared types
- HTML/CSS — Carousel rendering templates (Puppeteer), email templates

**Secondary:**
- SQL (PostgreSQL) — Supabase database, RPC functions, schema migrations

## Runtime

**Environment:**
- Node.js 18.x (minimum, specified in swipely-api/package.json)
- Browser (React 18, React 19 in Next.js)

**Package Manager:**
- npm
- Lockfile: package-lock.json present in all sub-projects

## Frameworks

**Core:**
- Next.js 16.1.1 — Main SaaS web app, SSR deployment, API routes, static generation
- Express 4.21.0 — swipely-api mini backend for Telegram Mini App
- React 19.2.3 — swipely-nextjs client components
- React 18.3.1 — swipely-editor Vite app

**Build/Dev:**
- Vite 5.4.2 — swipely-editor development and production builds
- TypeScript 5.x — Type checking in Next.js and Vite projects
- nodemon 3.1.x — Development hot reload for Node.js services

**Frontend UI:**
- Tailwind CSS 4.x (swipely-nextjs via @tailwindcss/postcss), 3.4.10 (swipely-editor)
- Radix UI components — Dialog, Dropdown, Label, Select, Switch
- Framer Motion 12.34.0 — Animation library (swipely-nextjs)
- Embla Carousel 8.6.0 — Carousel component (swipely-nextjs)
- Lucide React 0.562.0 — Icon library
- Recharts 3.7.0 — Analytics chart visualization

**Form Handling:**
- React Hook Form 7.69.0 — Form state management
- Zod 4.2.1 — Runtime schema validation
- @hookform/resolvers 5.2.2 — Zod integration

**HTML/Canvas:**
- html2canvas 1.11.13 — Client-side PNG export (swipely-editor)
- html-to-image 1.11.13 — Alternative image conversion
- Puppeteer 24.38.0 (nextjs), 23.11.1 (bot) — Headless Chrome HTML→PNG rendering

**AI & LLM:**
- @google/generative-ai 0.24.1 — Gemini API (text generation)
- @google/genai 1.0.0, 0.14.1 — Google GenAI SDK for image generation
- @anthropic-ai/sdk 0.30.1 — Claude API (optional fallback)
- openai 4.73.0 — OpenAI API (optional Whisper transcription)

**State Management:**
- Zustand 5.0.11 — Client-side state (cart, session, UI state)
- React Router 7 (implied), React Router Dom 6.26.0 — Routing

**Database/ORM:**
- @supabase/supabase-js 2.89-2.90.1 — PostgreSQL client, auth, RLS
- @supabase/ssr 0.8.0 — Next.js SSR auth integration

**Utilities:**
- axios 1.7.9 — HTTP requests (swipely-bot)
- dotenv 16.4.7 — Environment variable loading
- cors 2.8.5 — CORS middleware (Express)
- node-telegram-bot-api 0.67.0 — Telegram Bot API wrapper
- marked 17.0.4 — Markdown parsing
- cheerio 1.2.0 — HTML/XML parsing (web scraping)
- canvas-confetti 1.9.4 — Confetti animation effect
- sonner 2.0.7 — Toast notifications
- disposable-email-domains 1.0.62 — Disposable email checking
- clsx 2.1.1 — Conditional className utility
- class-variance-authority 0.7.1 — Component variant library
- tailwind-merge 3.4.0 — Tailwind class merging
- @distube/ytdl-core 4.16.12 — YouTube video downloading (not currently used)
- @dnd-kit/core 6.3.1 — Drag-and-drop (not currently used)
- @number-flow/react 0.6.0 — Number animation
- tw-animate-css 1.4.0 — Tailwind animation utilities

**Linting & Formatting:**
- ESLint 9 — Code linting (swipely-nextjs via eslint.config.mjs)
- eslint-config-next 16.1.1 — Next.js ESLint rules

## Configuration

**Environment:**
- `.env` files (local development) — Never committed, see env.md for required variables
- `.env.local` (Next.js) — Used by swipely-nextjs
- `.env` (swipely-bot, swipely-api) — Used by Node.js services

**Build:**
- `next.config.ts` (swipely-nextjs) — Standalone output, Turbopack enabled
- `vite.config.ts` or implicit Vite config (swipely-editor)
- `tsconfig.json` (all TS projects) — Strict mode enabled, target ES2017
- `tailwind.config.js` (not present in swipely-nextjs — uses Tailwind v4 @theme CSS)
- `.vercelignore` / `.gitignore` — Deployment and git exclusions
- `Dockerfile` (swipely-bot) — Node 18 slim + Chromium for Puppeteer
- `railway.json` (swipely-bot) — Railway.app deployment config

**TypeScript:**
- Strict: `true`
- moduleResolution: `bundler`
- target: `ES2017`
- Path aliases: `@/*` → project root (swipely-nextjs), all ES modules

## Platform Requirements

**Development:**
- Node.js 18.x or higher
- npm or yarn
- Chromium/Chrome (for local Puppeteer HTML→PNG rendering)
- Database: Supabase PostgreSQL (remote, shared across all sub-projects)

**Production:**
- **swipely-nextjs:** Vercel (Next.js native) or self-hosted with `npm run build && npm run start`
- **swipely-bot:** Railway.app (Docker-based) with Node 18 + system Chromium
- **swipely-editor:** Vercel (static site at edit.swipely.ai)
- **swipely-api:** Railway or any Node.js hosting (Express server on port 3001)
- **Database:** Supabase Cloud (shared PostgreSQL instance)

## Deployment Targets

**Web App (swipely-nextjs):**
- Vercel serverless + ISR
- Alternate: Selectel VPS (178.72.168.235) — current production
- Output: Standalone Next.js with no .next directory required

**Bot (swipely-bot):**
- Railway.app — Docker container pulls from registry, runs polling bot
- Node.js 18 + system Chromium (installed via Dockerfile)

**Editor (swipely-editor):**
- Vercel SPA deployment (https://edit.swipely.ai)
- Static React + Vite build

**API (swipely-api):**
- Railway.app or similar Node.js host
- Exposes /api/auth, /api/carousel, /api/usage routes
- Port 3001 (configurable via env)

## Critical Dependencies

**AI Generation:**
- Google Gemini API (text-to-carousel, image generation) — primary
- Anthropic Claude API — fallback option
- OpenAI API — optional voice transcription (Whisper)

**Payment Processing:**
- AuraPay API (v2 webhook handling) — subscription and slide pack purchases
- Telegram Stars integration via Telegram Bot API

**Authentication:**
- Supabase Auth (email + Telegram OAuth via Mini App)
- Telegram Bot API for Mini App sign-in verification

**Database:**
- Supabase PostgreSQL with Row-Level Security (RLS)
- pgvector (not yet integrated, prepared for embeddings)

---

*Stack analysis: 2026-03-19*
