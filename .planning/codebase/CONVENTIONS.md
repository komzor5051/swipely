# Coding Conventions

**Analysis Date:** 2026-03-19

## Naming Patterns

**Files:**
- React components (client): PascalCase, e.g., `SwipelySlide.tsx`, `EditorClient.tsx`, `CarouselEditor.tsx`
- React components (server): PascalCase, e.g., `StatsRow.tsx`, `RevenueChart.tsx`
- Pages: lowercase with brackets for dynamic routes, e.g., `[id]/page.tsx`, `page.tsx`
- Routes/API: lowercase with forward slashes, e.g., `/api/generate`, `/api/payments/create`
- Utilities/hooks: camelCase, e.g., `usePhotoGeneration.ts`, `use-media-query.ts`
- Services: camelCase, e.g., `image-generator.ts`, `openrouter.js`
- Types/interfaces: PascalCase, e.g., `SlideProps`, `Profile`, `Generation`
- Constants: UPPER_SNAKE_CASE, e.g., `GEMINI_API_KEY`, `PHOTO_SYSTEM_PROMPT`

**Functions:**
- React components: PascalCase (function name matches export)
- Service functions: camelCase with descriptive verb prefixes, e.g., `buildSystemPrompt()`, `buildSlideStructure()`, `generateCarouselContent()`
- Utility functions: camelCase, e.g., `resetMonthlyIfNeeded()`, `checkSubscriptionExpiry()`
- Event handlers: `on` + PascalCase event, e.g., `onUpdateSlide()`, `onChangeTemplate()`, `handleUpdateSlide()`
- Async operations: verbs in past tense, e.g., `generateContent()`, `trackGeneration()`
- Query functions: `get` + noun or `fetch` + noun, e.g., `getProfile()`, `getGenerations()`

**Variables:**
- State variables: camelCase, e.g., `isGenerating`, `slideCount`, `errorMessage`
- Boolean flags: `is` + descriptor or `has` + descriptor, e.g., `isHook`, `hasPhoto`, `isPro`
- Computed values: descriptive camelCase, e.g., `highlightStyle`, `layoutVariant`, `contentAlignment`
- Config objects: camelCase, e.g., `designPresets`, `contentTones`, `ASPECT_RATIOS`

**Types:**
- Interfaces: PascalCase with `I` prefix optional, e.g., `SlideData`, `SlideProps`, `Profile`, `Generation`
- Type aliases: PascalCase, e.g., `ImageStyle = "cartoon" | "realistic"`, `Format = "portrait" | "square"`
- Enums: UPPER_SNAKE_CASE for values, e.g., `subscription_tier: "free" | "start" | "pro"`

## Code Style

**Formatting:**
- No `.prettierrc` or explicit Prettier config — uses ESLint 9 defaults
- Line length: no enforced limit observed; typical 80-100 characters for readability
- Indentation: 2 spaces (JavaScript/TypeScript projects)
- Trailing commas: allowed in multiline structures
- Semicolons: included (standard JavaScript)
- Quotes: double quotes in most files; single quotes in import paths occasionally

**Linting:**
- Framework: ESLint 9 (using flat config system, `eslint.config.mjs`)
- Config: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` for Next.js projects
- TypeScript strict mode enabled in `swipely-nextjs/tsconfig.json` with standard strict checks
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

**Comments:**
- JSDoc rarely used; code is typically self-documenting
- Inline comments used strategically to explain AI prompt structure or complex business logic
- Section dividers: `// ─── Section Name ───` used in files with distinct logical sections
- System prompts documented inline with clear, descriptive comments explaining tone, rules, and structure

## Import Organization

**Order:**
1. React/Framework imports (`import React from "react"`, `import type { Metadata }`)
2. Next.js built-ins (`import { NextRequest, NextResponse } from "next/server"`)
3. Third-party libraries (`import { useState } from "react"`, `import axios from "axios"`)
4. Supabase and custom service imports (`import { createClient } from "@/lib/supabase/server"`)
5. Local component/type imports (`import { SlideRenderer } from "@/components/slides"`)
6. Relative imports (`./*`, `../`)
7. CSS/style imports (`.css`, `.module.css`)
8. Type imports separated if many: `import type { ... }` with `import type` syntax

**Path Aliases:**
- `@/*` maps to project root in Next.js (`swipely-nextjs/`)
- `@/components/` — UI and slide components
- `@/lib/` — utilities, services, Supabase clients
- `@/hooks/` — custom React hooks
- `@/app/` — route handlers and pages

**Verbatim Module Syntax:**
- TypeScript enforces `import type` for types (no ambient type imports)
- Erasable syntax only: no `enum` declarations (use `as const` instead)
- Strict TypeScript: `noUnusedLocals`, `noUnusedParameters`, `strict: true`

## Error Handling

**Patterns:**
- Async/await with try-catch blocks; errors logged to console
- API route handlers: return `NextResponse` with status codes and JSON error object: `{ error: "message" }`
- Database operations: return `null` on error (see `lib/supabase/queries.ts` pattern)
- Express routes (swipely-api): status codes with `{ success: false, error: "message" }` or `{ error: "..." }` response
- Service functions: throw errors or return null; calling code decides how to handle
- User-facing errors: wrapped in try-catch blocks, toast/notification displayed via `sonner` toast library
- Logging: all errors logged to console with context (function name, user ID, operation)

**Validation:**
- Zod schemas defined inline in route handlers for request body validation
- React Hook Form + Zod resolver for client-side form validation
- Input sanitization: user input capped at character limits (e.g., 3000 chars for carousel text, 500 chars for brief)
- Sanitization helpers: `cleanMarkdown()` removes markdown before storage; `sanitizedBrief` in prompts escapes newlines

**Security:**
- Prompt injection filter in `/api/generate`: `containsInjection()` checks user input against known patterns
- User content wrapped in `<user_content>` tags in AI prompts to signal it's data, not instructions
- API keys hashed with SHA-256 before storage in `api_keys` table
- RLS (Row-Level Security) enforced at database level; admin client bypasses for privileged operations
- HMAC-SHA256 verification for Telegram OAuth validation

## Logging

**Framework:** `console.log()`, `console.error()` only; no logger library

**Patterns:**
- Development: verbose logs with emoji prefixes for readability (🎨, 🤖, ❌, 🚀, etc.)
- Production: logs go to stdout/stderr; captured by deployment system
- API requests: log topic/operation start and completion
- Errors: always include error message and relevant context (user ID, operation type)
- Rate limiting: log when slots are claimed or limits are hit
- Database operations: log query type and affected rows

**Log Examples:**
```javascript
console.log(`🎨 Generating carousel for user ${profile.telegram_id}`);
console.log(`   Topic: ${topic.substring(0, 50)}...`);
console.error('❌ sendMessage error:', err.message);
console.log('🚀 Swipely Bot running on port 3000');
```

## Slide and Template Structure

**Template System:**
- Templates are React components in `swipely-nextjs/components/slides/templates/`
- Each template implements `SlideProps` interface: `{ slide: SlideData, slideNumber, totalSlides, format, username? }`
- `SlideData` interface: `{ type: string, title: string, content: string, imageUrl?: string }`
- Template IDs: `swipely`, `grid_multi`, `purple_accent`, `receipt`, `quote_doodle`, `speech_bubble`, `star_highlight`, `street`, `chapter`, `dispatch`, `frame`, etc.

**Slide Types:**
- `hook` — mгновенная остановка скролла (instant scroll stop)
- `tension` — усиление боли или проблемы (problem intensification)
- `value` — конкретная польза (concrete benefit)
- `accent` — резкая смена темпа (tempo shift): shock data, unexpected comparison, direct challenge
- `insight` — неожиданный вывод (unexpected conclusion)
- `cta` — одно простое действие (single clear call-to-action)

**Rendering:**
- `SlideRenderer.tsx` maps template IDs to components via `TEMPLATE_MAP`
- Each component defines its own styling (inline styles or Tailwind)
- Highlight syntax: `<hl>keyword</hl>` in titles for keyword highlighting; each template implements its own rendering
- Dimensions handled by `getSlideDimensions(format)` utility: square (1080x1080), portrait (1080x1350), story (1080x1920)

**Design Presets:**
- Defined in `app/api/generate/route.ts` as `designPresets` object
- Each preset specifies: `name`, `max_words_per_slide`, `tone` (for AI generation)
- Tone descriptions are detailed: "modern, tech-savvy, energetic, startup vibe, bold statements" for Swipely
- Content tones: `educational`, `entertaining`, `provocative`, `motivational` (stored as `tone` on Generation record)

**Photo Mode:**
- Uses `PhotoSlide.tsx` component (NOT in template registry)
- Base64 image data URL stored in `slide.imageUrl`
- Image generation via Gemini 3 Pro or 2.0 Flash exp model
- Style presets: `cartoon` (Pixar/Disney style) or `realistic` (cinematic photography)
- Image prompts emphasize full-frame composition, no text, recognition of subject from reference photo

## Function Design

**Size:** Functions typically 20-60 lines; API routes and complex pipelines up to 150+ lines

**Parameters:**
- Router/API handlers: `(req, res)` for Express, `(request: NextRequest)` for Next.js
- React components: receive `props` object destructured in function signature
- Service functions: single object parameter with named fields (avoid positional args)
- Callbacks: use `useCallback` hook with explicit dependency arrays

**Return Values:**
- Query functions return data type or `null` (never throw)
- Service functions return data or throw Error
- React components return JSX
- API routes return `NextResponse` or express `res.json()`
- Async functions return `Promise<T>`

**Async/Await:**
- Used consistently throughout; no callback chains
- All async operations wrapped in try-catch with error handling
- Streaming responses handled with `Response` reader API (SSE in photo generation)

## Module Design

**Exports:**
- Named exports for utility functions: `export function buildSystemPrompt() { ... }`
- Default export for React components: `export default function SwipelySlide() { ... }`
- Type exports: `export interface SlideProps { ... }` or `export type Format = "square" | "portrait"`

**Barrel Files:**
- `swipely-nextjs/components/slides/` does NOT use barrel exports; imports are path-specific
- Example: `import { SlideRenderer } from "@/components/slides/SlideRenderer"` (not from index)

**Organization:**
- `lib/supabase/` — database query wrappers grouped by entity (profiles, generations, api-keys)
- `lib/services/` — external service integrations (image generator, OpenRouter, Telegram)
- `lib/templates/` — template registry and type definitions
- `app/api/` — route handlers organized by feature (generate, payments, auth, cron)
- `components/slides/` — slide components and rendering utilities

## String Handling

**Multilingual:**
- All user-facing text in Russian (Cyrillic)
- Component defaults in Russian, e.g., `<p className="text-slate-500 mb-6">Откройте ссылку редактирования из Telegram бота</p>`
- System prompts in Russian with explicit language instruction: "Создай карусель для соцсетей на русском языке"
- API response messages in English for B2B/integration endpoints

**Markdown Stripping:**
- `cleanMarkdown()` utility removes markdown formatting: bold, italic, code, links, headings
- Applied before storing generated content or passing to image generation
- Used in photo mode to clean title before building image prompt

**Special Characters:**
- No emojis in AI output (explicitly forbidden in system prompts)
- User content escaped in prompt tags: `<user_content>` and `</user_content>` wrap user input
- Special characters in URLs escaped by framework automatically

---

*Convention analysis: 2026-03-19*
