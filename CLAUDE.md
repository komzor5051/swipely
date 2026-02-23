# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**Swipely** — AI-powered Instagram carousel generator. Telegram bot + Next.js SaaS web app. Monorepo where three sub-projects have their own `.git`: `swipely-bot/`, `swipely-nextjs/`, `landing/`.

## ⚠️ Critical Constraints

- **Root `src/`** is a stale duplicate of `swipely-bot/src/` — never edit it
- **`landing/` has a separate git repo** — never commit it from monorepo root
- **Never use Telegraf** — use `node-telegram-bot-api` (Telegraf breaks on Node.js v24)
- Always `cd` into the correct sub-project before committing
- `README.md` has unresolved git merge conflict markers — ignore it

## Sub-Projects & Commands

| Sub-project | Dev command | Deploy |
|-------------|-------------|--------|
| `swipely-bot/` | `npm run dev` | Railway / Docker |
| `swipely-nextjs/` | `npm run dev` (port 3000) | Vercel |
| `swipely-editor/` | `npm run dev` | Vercel (edit.swipely.ai) |
| `swipely-api/` | `npm run dev` (port 3001) | Manual VPS |
| `swipely-promo/` | `npm run studio` | Local only |
| `brand-templates/` | `node render-all.js` | Local only |

No test framework exists in any sub-project.

## Shared Supabase Database

Both `swipely-bot` and `swipely-nextjs` share the same Supabase project.

- Bot schema: `supabase_migration.sql` (RLS commented out)
- Nextjs schema: `swipely-nextjs/supabase-migration.sql` (RLS enabled, adds `tov_profile JSONB`, `onboarding_completed`, `increment_standard_used` RPC, `handle_new_user` trigger)
- Key tables: `profiles` (users, subscriptions, balances, TOV), `payments`, `generations`

## AI Output Format

All generation (both bot and nextjs) produces:
```json
{
  "slides": [{"type": "hook", "title": "Title with <hl>keyword</hl>", "content": "..."}],
  "post_caption": "150-300 word post text"
}
```
`<hl>` tags mark 1-2 highlighted keywords per title — all templates must render them visually distinct.

## Key Patterns

**AI Response Parsing**: Always strip markdown wrappers before `JSON.parse`:
```js
content.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '')
```

**Error Convention**: Services return `null` on error (both bot and nextjs). No thrown exceptions in user flows.

**Callback Timeout** (bot): Wrap `answerCallbackQuery` in try/catch, ignore errors containing `'too old'`.

**Payments**: swipely-nextjs uses AuraPay (NOT YooKassa). Bot uses YooKassa + Telegram Stars.

## Design Tokens (swipely-nextjs)

**UI/Editor theme**: `--ink: #0D0D14` · `--lime: #D4F542` · `--lime-hover: #c8e83a`
**Slide brand tokens**: `--swipely-blue: #0A84FF` · `--swipely-lime: #D4F542` · `--swipely-pink: #F9A8D4` · `--swipely-charcoal: #1A1A2E`
Fonts: Outfit (`--font-body`) + Space Mono (`--font-mono`) via `next/font/google`

## Modular Docs

See `.claude/rules/` for details:
- `bot.md` — swipely-bot services, templates, session state, callback routing, pricing
- `nextjs.md` — routes, generation flow, components, auth, payments, ToV
- `templates.md` — step-by-step guide for adding new templates to both sub-projects
- `env.md` — all environment variables for all sub-projects
