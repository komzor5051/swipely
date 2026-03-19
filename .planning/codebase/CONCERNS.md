# Codebase Concerns

**Analysis Date:** 2026-03-19

## Monorepo Architecture Issues

### Stale Duplicate Code (Critical for Modifications)

**Area:** Root-level `src/` and root `package.json`

**Issue:** Root `src/` is a stale duplicate of `swipely-bot/src/` and root `package.json` is outdated. This creates confusion during feature additions — edits to root files are lost since the bot repo has its own `.git` and `package.json`.

**Files:** `./src/` (entire directory), `./package.json`, `./index.original.js`, `./index.js.backup`

**Impact:**
- Risk of accidentally editing stale code instead of actual source
- Developers unfamiliar with the monorepo may make changes in the wrong location
- No automatic sync between copies — divergence is guaranteed

**Fix approach:**
- Mark root `src/` and `package.json` as read-only or add a prominent `DO NOT EDIT` comment at the top
- Add pre-commit hook to prevent edits to root-level code files
- Update root `.gitignore` to ignore root `src/` entirely (reference `swipely-bot/src/` in docs)
- Consider removing root files entirely if they serve no purpose (check if any workflows reference them)

---

### Multiple Schema Migrations (Sync Risk)

**Area:** Database schema management

**Issue:** Four separate migration files exist in different locations:
- `./supabase_migration.sql` (root, 145 lines)
- `./swipely-bot/supabase_migration.sql` (145 lines)
- `./landing/supabase-migration.sql` (634 lines)
- `./swipely-nextjs/supabase-migration.sql` (778 lines)

**Files:** `supabase_migration.sql`, `supabase-migration.sql` (multiple locations)

**Impact:**
- Each sub-project has been migrating schema independently (safe with RLS + idempotent SQL)
- Bot migration is outdated vs nextjs (no security hardening migration, no IP signup tracking)
- Landing migration has different content than nextjs (likely copy)
- Risk: developers apply incomplete migration from wrong file, missing new columns/RPCs
- Adding new tables/functions requires edits in potentially 2-3 files

**Fix approach:**
- Consolidate into single source of truth: `./swipely-nextjs/supabase-migration.sql`
- Update bot and landing migrations to be explicit references/imports of nextjs migration
- Add comment block at top of nextjs migration listing all schema versions with dates
- Document: "Always apply from `swipely-nextjs/supabase-migration.sql`"
- Optionally: create a `scripts/apply-migration.ts` that handles the application flow

---

### Independent Git Repos in Monorepo (Commit Confusion)

**Area:** Git repository structure

**Issue:** `swipely-bot/`, `swipely-nextjs/`, and `landing/` each have their own `.git` directory. Developers must `cd` into the correct subdirectory before committing, or changes appear as untracked files at the root level.

**Files:** `./.git/` (root), `./swipely-bot/.git/`, `./swipely-nextjs/.git/`, `./landing/.git/`

**Impact:**
- Easy to accidentally commit to root git instead of sub-repo git
- CI/CD workflows may fail if they assume monorepo git structure
- `git status` from root only shows sub-repos as modified, not individual file changes
- New developers unfamiliar with this pattern will make commits in the wrong repo

**Fix approach:**
- Add `.git-location.md` or similar to document which repo owns which directory
- Update `.claude/rules/` to explicitly remind developers: "Always `cd swipely-nextjs` before `git commit`"
- Consider creating a script `scripts/check-git-status.sh` that runs `git status` in each sub-repo
- Document in CI/CD that it must `cd` into the correct repo before pushing

---

## Template Synchronization (Cross-Project Duplication)

### Misaligned Template Definitions Between Bot and Next.js

**Area:** Slide template generation and rendering

**Issue:** Bot has 16 HTML templates; nextjs has ~13 React templates. They are NOT equivalent:
- Bot templates: `swipely-bot/src/templates/*.html`
- Nextjs templates: `swipely-nextjs/components/slides/templates/*Slide.tsx`

Design presets in `app/api/generate/route.ts` and `swipely-bot/src/services/gemini.js` claim to be aligned but are maintained independently. Adding a new template requires:
1. Create HTML version in bot
2. Create React version in nextjs
3. Update design presets in both places
4. Add preview image to both places

If only one is updated, generation will return invalid data for users on the other platform.

**Files:**
- `swipely-bot/src/templates/` (16 templates)
- `swipely-nextjs/components/slides/templates/` (~13 templates)
- `swipely-bot/src/services/gemini.js` (design presets)
- `swipely-nextjs/app/api/generate/route.ts` (design presets, lines 14-27)
- `swipely-nextjs/lib/templates/registry.ts` (template registry)

**Impact:**
- Bot generation may produce template IDs that don't exist in nextjs rendering
- Adding new templates is error-prone; easy to forget one half of the pair
- Template tone/styling can diverge — users see different results based on platform
- B2B API may render with nextjs while bot would generate differently

**Fix approach:**
- Create single `docs/TEMPLATE_SYNC.md` checklist for adding templates
- When adding template, require commits to BOTH bot and nextjs in same PR
- Consider using a shared constant file that both bot and nextjs import (if feasible with their different ecosystems)
- Add automated test: verify all template IDs in one platform exist in the other
- For new features (charts, lists), implement BOTH bot and nextjs versions before release

---

## No Test Suites (Critical Risk for New Features)

**Area:** Testing infrastructure

**Issue:** No test suites configured in ANY sub-project. No Jest, Vitest, Mocha, or comparable testing framework set up. This creates severe risk when adding new features like charts/lists in slides or flexible text rendering.

**Files:** All projects lack test configuration (no `jest.config.js`, `vitest.config.ts`, `.test.ts` files in source)

**Impact:**
- New slide template features (lists, charts) have no unit tests
- Text rendering changes in `components/slides/templates/` can't be verified
- Photo Mode generation pipeline has no regression tests
- Rate limiting logic (`claim_generation_slot` RPC) has no test coverage
- API routes like `/api/generate` can silently break on schema changes
- Prompt injection filter has no test cases for attack patterns
- Onboarding flow can't be tested programmatically

**Fix approach:**
- Add Jest/Vitest config to `swipely-nextjs` (start here, it's the main web app)
- Create test directory: `swipely-nextjs/__tests__/`
- Start with critical paths: API generation, rate limiting RPC, template rendering
- Add pre-commit hook to run tests before allowing commits to main
- For new features (charts/lists), TDD: write tests first, then implementation
- Document testing patterns in `swipely-nextjs/CLAUDE.md`

---

## Data Flow & State Management Issues

### Session State Lost on Bot Restart (Legacy Issue)

**Area:** Bot wizard state persistence

**Issue:** Bot session state is stored in-memory in `sessions[userId]` map. On restart, all active user sessions are lost. Users mid-wizard lose their context.

**Files:** `swipely-bot/src/index.js` (original monolithic handler, though current version is just a redirect stub)

**Impact:**
- Users in middle of a carousel generation lose session on deploy
- No graceful state recovery
- Only affects bot (which is now a redirect stub, so low impact)

**Fix approach:**
- Since bot is now a redirect-only stub, this is no longer a concern
- If bot functionality is ever restored, migrate session storage to Redis or Supabase `sessions` table

---

### Monthly Usage Reset is Lazy (Race Condition Risk)

**Area:** Rate limiting and subscription tracking

**Issue:** Monthly usage counter reset happens on first generation request via `resetMonthlyIfNeeded()`. This is lazy (not on schedule). If multiple requests hit at month boundary, race condition is possible despite atomic DB function.

**Files:**
- `swipely-nextjs/lib/supabase/queries.ts` (resetMonthlyIfNeeded function)
- `swipely-nextjs/supabase-migration.sql` (reset_monthly_if_needed RPC, line ~159)

**Impact:**
- Low probability, but if two requests hit within milliseconds at month boundary, counter might reset in unexpected order
- User might get one free generation at month boundary even if they've hit limit

**Fix approach:**
- Add column `last_reset_checked_at TIMESTAMPTZ` to track when reset was attempted
- Modify reset function to use `ON CONFLICT DO NOTHING` pattern to idempotently reset once per month
- Document the lazy reset behavior in CLAUDE.md

---

## Security & Input Validation Gaps

### Prompt Injection Filter May Be Incomplete

**Area:** Security: AI input validation

**Issue:** Prompt injection filter in `/api/generate` uses `containsInjection()` function to check user input against "known attack patterns". The set of patterns is static and hardcoded.

**Files:** `swipely-nextjs/app/api/generate/route.ts` (implementation details unclear without reading full file)

**Impact:**
- New attack patterns discovered daily; static filter will lag
- XML-wrapping of user content helps, but not foolproof
- `<user_content>` tags signal to model this is data, but determined attacker can still try
- No rate limiting on prompt injection attempts

**Fix approach:**
- Add monitoring: log all blocked injection attempts (separate table `injection_attempts`)
- Regularly review blocked patterns and update filter
- Consider using external API (e.g., Prompt Armour) for dynamic pattern updates
- Add tests for known OWASP prompt injection patterns
- Document in CONCERNS.md: "Monitor injection_attempts table monthly"

---

### Email Verification Bypassed in Signup

**Area:** Security: account creation

**Issue:** Signup endpoint calls `admin.createUser({email_confirm: true})` which bypasses email verification. Comment in code explicitly warns "do not add email verification steps to signup flow" — this suggests someone tried before.

**Files:** `swipely-nextjs/app/api/auth/signup/route.ts`

**Impact:**
- Disposable email accounts can be created (mitigation: disposable-email-domains library is used in validate, so this is actually handled)
- Signups are instant, users can generate immediately without confirming email
- Users with typos in email can't fix it (email is immutable in Supabase auth)

**Fix approach:**
- This is intentional MVP decision (fast signup, low friction)
- Document it as deliberate: "Email verification bypassed for UX. No change without product review."
- Add note in CLAUDE.md warning not to add verification without explicit approval
- Consider post-generation email confirmation step instead (after first carousel)

---

## Performance & Scalability Issues

### Puppeteer Server-Side Rendering (B2B API)

**Area:** Performance: server-side PNG rendering

**Issue:** B2B API endpoint `/api/v1/generate` uses Puppeteer to render slides to PNG server-side. Puppeteer is heavy — each render spawns a browser instance.

**Files:**
- `swipely-nextjs/lib/render/` (Puppeteer rendering logic)
- `swipely-nextjs/app/api/v1/generate/route.ts` (B2B API)

**Impact:**
- High CPU usage under load; cold starts on Vercel timeout (120s max)
- Each request = new browser instance = slow
- If B2B clients hammer the endpoint, server will run out of memory
- No request queuing or connection pooling

**Fix approach:**
- Migrate Puppeteer to dedicated service (separate from Vercel) — e.g., Railway or AWS Lambda with Chromium layer
- Implement connection pooling: reuse browser instances instead of spawning new ones per request
- Add request queue: Puppeteer can only handle N concurrent renders, queue excess
- Set timeout to 30s per render, return error if exceeded
- Monitor: track render times, memory usage per request
- Document in `swipely-nextjs/CLAUDE.md`: "B2B API rendering is CPU-intensive; monitor performance"

---

### Gemini API Geo-Blocking Workaround (Fragile)

**Area:** Deployment: external API integration

**Issue:** Selectel VPS (Russia) is geo-blocked from `generativelanguage.googleapis.com`. Workaround: Cloudflare Worker proxy at `cloudflare-worker/gemini-proxy.js` that forwards requests. If Cloudflare Worker is down or quota exceeded, ALL generations on prod fail.

**Files:**
- `swipely-nextjs/cloudflare-worker/gemini-proxy.js`
- `swipely-nextjs/app/api/generate/route.ts` (line 9: uses `GEMINI_PROXY_URL`)

**Impact:**
- Single point of failure: Cloudflare Worker outage = Swipely down
- No fallback to direct API if proxy fails
- Deployment is manual ("Deploy via Cloudflare dashboard — paste the file")
- No monitoring of proxy health
- If proxy is misconfigured, all Gemini requests fail silently

**Fix approach:**
- Add health check: `/api/health/gemini` that tests Gemini connectivity via proxy
- Implement fallback: if proxy fails, try direct API (will fail for Russia-based requests, but graceful)
- Automate proxy deployment: add to CI/CD pipeline instead of manual paste
- Monitor: add Sentry/error tracking for proxy timeouts
- Document: "Cloudflare Worker is critical infrastructure. Monitor in Cloudflare dashboard."
- Consider multi-region setup: VPS in Europe + Cloudflare ensures redundancy

---

## Code Organization & Maintainability

### Monolithic Bot Index.js (Though Now Stub)

**Area:** Code organization

**Issue:** Bot's original `src/index.js` was ~2,500 lines (see backup `index.original.js`). Currently replaced with a simple redirect stub (52 lines), but the backup shows historical complexity.

**Files:**
- `swipely-bot/src/index.js` (current: 52 lines, redirect stub)
- `swipely-bot/src/index.original.js` (backup: 93K, old monolith)
- `swipely-bot/src/index.js.backup` (another backup)

**Impact:**
- If bot functionality is restored, old code has unclear testing/dependencies
- Multiple backup files create confusion: which is the right one?
- Unused directories: `src/components/`, `src/contexts/`, `src/hooks/` (React artifacts)

**Fix approach:**
- Keep current stub as-is (working, simple)
- Delete backup files `index.original.js` and `index.js.backup` — they're in git history if needed
- Delete unused directories: `components/`, `contexts/`, `hooks/`
- If bot is ever restored, rebuild from scratch based on nextjs patterns

---

### No TypeScript in Bot Services

**Area:** Code quality

**Issue:** Bot still uses raw JavaScript (`.js` files) while nextjs is full TypeScript. Services like `src/services/gemini.js`, `src/services/supabase.ts` (mixed!).

**Files:** `swipely-bot/src/services/*.js`, some with `.ts` extensions inconsistently

**Impact:**
- No type safety in bot; easy to pass wrong data types
- Different ecosystem from main nextjs app (harder to port templates/logic)
- Inconsistent naming: `.js` vs `.ts` in same directory

**Fix approach:**
- Since bot is now a redirect stub, no need to refactor
- If bot is restored, migrate to TypeScript entirely
- Create `swipely-bot/tsconfig.json` from `swipely-nextjs/tsconfig.json`

---

## Breaking Changes Risk (For New Features)

### Slide JSON Schema (Undocumented)

**Area:** API contracts

**Issue:** Slide JSON schema is defined implicitly in type hints and Gemini prompts, but NOT formally documented. When Gemini returns slides, it must match the `SlideData` type expected by renderer.

**Files:**
- `swipely-nextjs/lib/services/image-generator.ts` (SlideData type)
- `swipely-nextjs/app/api/generate/route.ts` (Gemini prompt defines output format, lines 130-137)

**Impact:**
- If someone changes the Gemini prompt to add a new field (e.g., `image_url` for list items), but forgets to update `SlideData` type, rendering breaks
- No validation: if Gemini returns malformed JSON, error handling may mask the real issue
- Adding charts/lists to slides requires changing this schema carefully

**Fix approach:**
- Create `docs/SLIDE_FORMAT.md` with formal JSON schema
- Use Zod schema to validate all slide JSON from Gemini before saving
- Add unit test: generate carousel with each template, verify JSON structure
- Document in `swipely-nextjs/CLAUDE.md`: "Slide JSON is the contract between API and renderer. Changes require type+schema updates."

---

### Photo Mode Slide Format (Separate from Standard)

**Area:** API contracts

**Issue:** Photo Mode uses `PhotoSlide.tsx` component which is NOT registered in template registry. It has its own format. If standard and photo formats diverge (different fields), rendering breaks.

**Files:**
- `swipely-nextjs/components/slides/templates/PhotoSlide.tsx` (separate, unregistered)
- `swipely-nextjs/app/api/generate/photo/route.ts` (Photo Mode generation)

**Impact:**
- Photo slides have different JSON structure than standard slides
- Easy to accidentally try to render photo slide with standard template (will error)
- Adding fields to standard slides won't auto-apply to photo slides

**Fix approach:**
- Document: "PhotoSlide is NOT in TEMPLATE_MAP. It's used exclusively by Photo Mode generation."
- Create union type: `type SlideData = StandardSlide | PhotoSlide`
- Add validation in SlideRenderer to reject PhotoSlide if rendered with wrong pipeline
- When adding new features (lists, charts), explicitly decide if Photo Mode supports them

---

## Database Schema Concerns

### Missing Constraints & Indexes

**Area:** Database

**Issue:** Migrations add columns with `IF NOT EXISTS` but don't always add indexes. Example: `profiles` table has `telegram_id` with index (good), but newer columns like `tov_guidelines` lack indexes for queries.

**Files:** `swipely-nextjs/supabase-migration.sql` (line 34: index for telegram_id; missing for others)

**Impact:**
- Queries on `tov_guidelines`, `referral_code`, `subscription_tier` may be slow with millions of users
- No foreign key constraints between `referred_by` and `profiles(id)` (relies on RLS)
- Potential N+1 queries if application does lookups in a loop

**Fix approach:**
- Review all WHERE clauses in code; add indexes on frequently-queried columns
- Add NOT NULL constraints where sensible (e.g., `subscription_tier` should default, not be null)
- Add foreign key: `ALTER TABLE profiles ADD CONSTRAINT fk_referred_by FOREIGN KEY (referred_by) REFERENCES profiles(id)`
- Document index strategy in `docs/DATABASE.md`

---

## Deployment & Configuration Issues

### Environment Variables Scattered (Env.md)

**Area:** Configuration management

**Issue:** Environment variables are documented in `.claude/rules/env.md` but NOT in `.env.example` files. Developers deploying a new instance must manually copy from `.claude/rules/env.md`.

**Files:**
- `.claude/rules/env.md` (source of truth, but hard to find)
- `swipely-nextjs/.env.local` (not committed, no example)
- `swipely-bot/.env` (not committed, no example)

**Impact:**
- New deployments prone to missing env vars
- No validation that all required vars are present
- Onboarding new developers is error-prone

**Fix approach:**
- Create `.env.example` in each sub-project listing all required vars
- Add setup script: `scripts/verify-env.ts` that checks all required vars are set
- Update CI/CD to run env check before build
- Document in `README.md`: "Copy `.env.example` to `.env` and fill in values from password manager"

---

## Template & Content Pipeline Issues

### Design Presets Hardcoded (Scalability Issue)

**Area:** Content generation

**Issue:** Design presets (tone descriptions, word limits) are hardcoded in `app/api/generate/route.ts` lines 14-27. Adding a new template requires manual edits to this file AND creating the React component.

**Files:** `swipely-nextjs/app/api/generate/route.ts` (designPresets object, lines 14-27)

**Impact:**
- Can't add templates without backend code change
- Design presets can't be updated by non-engineers
- Tone strings are long, unmaintainable Russian text
- If nextjs is redeployed, old preset tones are lost

**Fix approach:**
- Move design presets to database: new table `design_presets(template_id, name, max_words, tone, updated_at)`
- Load presets at startup (with caching)
- Create admin panel UI to edit presets without code deploy
- Keep presets in code as fallback (seeded into DB on migration)
- Document: "Edit design presets via admin panel, don't edit route.ts directly"

---

## Specific Concerns for Planned Features

### Adding Charts/Lists to Slides

**Blocker Issues:**
1. **No test coverage** — adding new slide element (chart) requires manual testing
2. **Photo Mode vs Standard divergence** — if adding charts, must decide if Photo Mode supports them
3. **Gemini prompt complexity** — generating JSON for chart (labels, values, colors) is harder; prompt must be updated carefully
4. **Text rendering flexibility** — currently templates use hardcoded layout. Lists require flexible container heights

**Files to modify:**
- `swipely-nextjs/components/slides/templates/*.tsx` (new element component)
- `swipely-nextjs/app/api/generate/route.ts` (system prompt, new tone/preset)
- `swipely-nextjs/lib/templates/registry.ts` (register new template if needed)
- `swipely-bot/src/templates/*.html` (if bot is ever restored)
- `swipely-nextjs/lib/services/image-generator.ts` (update SlideData type if new fields)

**Risk:** Misalignment between Gemini output format and SlideData type could cause runtime errors.

---

### User Photo Carousels (Photo Mode Enhancement)

**Blocker Issues:**
1. **No tests for photo generation** — Gemini image generation per-slide is untested
2. **Image generation quota** — Gemini Image API has per-minute/per-day limits; no throttling documented
3. **Timeout risk** — image generation + text generation per slide is slow (7 slides × 2-5s each = 14-35s) — Vercel 120s timeout is tight
4. **Reference photo parsing** — current code expects base64; what if user uploads via different method?

**Files to modify:**
- `swipely-nextjs/app/api/generate/photo/route.ts` (core logic)
- `swipely-nextjs/lib/services/image-generator.ts` (Gemini image API integration)

**Risk:** Image generation timeouts will silently fail. Need better error handling and async status updates.

---

### Content Planning Features (Topics, Scheduling)

**Blocker Issues:**
1. **Topic mining is experimental** — uses Exa API (external dependency, quota-based)
2. **No scheduled generation UI** — backend cron exists (`/api/cron/generate`) but no user-facing scheduler
3. **Blog system is separate** — auto-generates blog articles independently; combining with carousel scheduler requires new state model

**Files affected:**
- `swipely-nextjs/lib/blog/pipeline/` (blog generation)
- `swipely-nextjs/app/api/cron/` (cron endpoints)

**Risk:** Adding scheduling UI is complex; cron endpoints assume admin trigger, not user-scheduled.

---

## Summary of High-Priority Concerns

| Concern | Severity | Effort | Impact |
|---------|----------|--------|--------|
| Stale root `src/` directory | High | Low | Developers edit wrong files |
| Multiple schema migrations | High | Medium | Risk of incomplete migrations |
| Independent git repos in monorepo | Medium | Low | Commit confusion |
| No test suites (0% coverage) | Critical | High | New features break easily |
| Template sync between bot/nextjs | High | Medium | Cross-platform bugs |
| Puppeteer rendering scalability | Medium | High | B2B API performance issues |
| Gemini proxy single point of failure | Medium | Medium | Production downtime risk |
| Slide JSON schema undocumented | Medium | Low | Breaking changes on new features |
| Design presets hardcoded | Low | Medium | Can't update without code deploy |
| Photo Mode timeout risk | Medium | High | User-facing failures |

---

*Concerns audit: 2026-03-19*
