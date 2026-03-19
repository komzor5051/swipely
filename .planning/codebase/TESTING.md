# Testing Patterns

**Analysis Date:** 2026-03-19

## Test Framework

**Status:** No test framework configured.

- No `jest.config.js`, `vitest.config.js`, or test-related dev dependencies found in any sub-project
- No test files (`.test.ts`, `.spec.ts`, `.test.tsx`, `.spec.tsx`) present in the codebase
- `swipely-nextjs/package.json` lists only ESLint as linting tool; no testing libraries imported
- `swipely-bot/package.json` has no test or dev dependencies beyond nodemon

**Run Commands:** Not applicable — no test suite exists

## Test Coverage

**Current Status:** No test coverage tracking

- Zero automated test infrastructure
- No coverage requirements enforced
- No pre-commit hooks for test validation
- Testing is manual only (QA via bot usage, API endpoint testing via curl/Postman)

## Testing Approach

**Manual Testing Only:**
- Local development: `npm run dev` to start servers and test manually
- Bot testing: direct Telegram interaction
- API testing: manual requests to `/api/generate`, `/api/generate/photo`, etc.
- UI testing: browser interaction with generated carousels and editor
- Deployment validation: smoke tests on staging/production endpoints

**QA Workflow:**
- Type checking via TypeScript strict mode catches many errors at build time
- ESLint enforces code quality rules before commit
- Build step (`npm run build`) validates bundle correctness
- Telegram bot tests carousel generation end-to-end in real bot interaction

## Code Quality Gates (Non-Test)

**TypeScript Strict Mode:**
- All `.ts` and `.tsx` files compiled with strict type checking
- `noUnusedLocals`, `noUnusedParameters` enforce cleanup
- `verbatimModuleSyntax` and `erasableSyntaxOnly` enforce correct import patterns
- Type errors block build; no workarounds with `any` type

**ESLint (swipely-nextjs):**
- Config: `eslint.config.mjs` with ESLint 9 flat config
- Rules: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`
- Runs via: `npm run lint`

**Build Validation:**
- Next.js build step in CI (`npm run build`) validates all code
- Standalone output generation ensures bundle correctness
- Type checking during build catches compile errors
- Bundle size visible in build output

## Validation Patterns (In-Code)

**Request Validation:**
- Zod schemas for request body validation in API routes
- React Hook Form + Zod resolver for client-side form inputs
- Input length limits enforced: 3000 chars for carousel text, 500 chars for brief, 8000 chars for brand voice analysis

**Type Safety at Compile Time:**
- React component props typed with interfaces: `SlideProps`, `EditorClientProps`, `SessionResponse`
- API response shapes defined as TypeScript types: `Generation`, `Profile`, `ApiKey`
- Supabase queries return typed data via `as Profile` casts
- Query function return types: `Promise<T | null>` for safety

**Runtime Assertions:**
- Database query null checks: `if (error) return null;`
- User auth checks: `if (!user) return 401 Unauthorized`
- Subscription expiry checks via `checkSubscriptionExpiry()` before generation
- Rate limiting gate: `claim_generation_slot` RPC enforces atomically in database

## Dangerous Areas Without Tests

**High-Risk Untested Flows:**

| Area | Risk | Why Critical |
|------|------|-------------|
| `swipely-nextjs/app/api/generate/route.ts` | Prompt injection, output parsing failures | Main AI generation pipeline; JSON parsing could crash on malformed AI response |
| `swipely-nextjs/lib/services/image-generator.ts` | Image generation API failures, timeout handling | Streaming responses with abort controller; complex state management |
| `swipely-nextjs/lib/render/renderer.ts` | Puppeteer rendering failures, timeout management | B2B API PNG rendering; no fallback if Chromium unavailable |
| `swipely-nextjs/app/api/webhooks/aurapay/route.ts` | Payment webhook replay attacks, double-charging | Payment processing; no idempotency key validation visible |
| `swipely-nextjs/components/slides/templates/*.tsx` | Layout edge cases, font rendering issues | 20+ templates with inline styles; untested on different screen sizes/browsers |
| `swipely-editor/src/services/api.ts` | Network failures, session expiry during edit | Editor state sync; no reconnection logic visible |
| `swipely-bot/src/index.js` | Redirect logic failures, Telegram API timeouts | Current bot is stub redirect; legacy code commented or removed |

**What Should Be Tested:**
- JSON parsing of Gemini responses (failure modes when API returns invalid JSON)
- Rate limiting: `claim_generation_slot` RPC behavior under concurrent requests
- Subscription tier limits and monthly reset logic
- Template rendering on edge cases (very long titles, special characters, Unicode)
- Image generation streaming with abort/cancel
- Telegram OAuth HMAC-SHA256 verification
- API key hashing and rotation logic

## Testing Recommendations

**Priority 1 — Integration Tests:**
```typescript
// Test /api/generate endpoint with real Supabase (or mock)
// 1. Valid input → valid JSON slide output
// 2. Rate limit exceeded → 403 response
// 3. Malformed user input → sanitized properly
// 4. Subscription expired → 403 response

// Test slideCount variations (3, 5, 7, 9, 12) produce correct structures
```

**Priority 2 — Unit Tests:**
```typescript
// Template rendering with edge cases
// - Title with <hl> tags parsed correctly
// - Very long content truncated without breaking layout
// - Emoji/special chars handled safely

// Prompt building functions
// - designPresets lookup works
// - contentTones merged correctly
// - buildSlideStructure() returns correct schema for each count

// Image generation prompt building
// - Base64 photo detected correctly
// - Style selection applies correct prompt
// - <hl> tags stripped before image prompt
```

**Priority 3 — E2E Tests:**
```typescript
// Telegram bot interaction (if bot logic remains)
// - Send text → receive PNG carousel
// - Send photo + text → receive photo-mode carousel
// - Subscription check blocks generation

// Web UI flow
// - Login → generate → download carousel
// - Editor edit → save → export
// - Payment → subscription upgrade
```

## Test Data & Fixtures (If Implemented)

**Fixture Patterns (conceptual; not currently in codebase):**
```typescript
// Sample valid Gemini response for 3-slide carousel
const mockGeminiResponse = {
  slides: [
    { type: "hook", title: "Ты <hl>теряешь</hl> клиентов", content: "..." },
    { type: "accent", title: "<hl>47 часов</hl>", content: "..." },
    { type: "cta", title: "<hl>Проверь</hl>", content: "..." }
  ],
  post_caption: "..."
};

// Sample rate limit exceeded response
const mockRateLimitError = {
  allowed: false,
  reason: "daily_limit_reached",
  wait_seconds: 86400
};

// Sample user profile for testing
const testUser = {
  id: "test-user-123",
  subscription_tier: "free",
  standard_used: 3,
  photo_slides_balance: 0,
  created_at: "2026-01-01T00:00:00Z"
};
```

## Mock Strategy (If Tests Were Added)

**What to Mock:**
- Gemini API responses (use fixtures above)
- Supabase queries (mock `getProfile`, `updateProfile`, `checkSubscriptionExpiry`)
- Image generation service (mock Gemini image model)
- Puppeteer rendering (mock screenshot for PNG output)
- Telegram API (mock bot token validation)
- Payment webhooks (mock AuraPay callback)

**What NOT to Mock:**
- TypeScript type system (strict checks are the first defense)
- ESLint validation (catch style issues before runtime)
- Authentication logic (test with real Supabase admin key in test env)
- Rate limiting logic (test actual database RPC behavior)

## Type Safety as Testing (Current Approach)

**Strength:** TypeScript strict mode provides significant bug prevention:
- Uninitialized variables caught at compile
- Missing function parameters caught at compile
- Type mismatches in props/returns caught at compile
- Exhaustive switch statements (with union types) checked at compile

**Weakness:** Type safety cannot catch:
- AI model response parsing failures (runtime JSON parse)
- Image generation timeouts
- Concurrent request race conditions
- Logic errors in business logic (e.g., wrong tier limits)
- External service failures (Gemini API, Supabase)

---

*Testing analysis: 2026-03-19*
