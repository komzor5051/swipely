# Phase 5: Credits-based free tier + /analyze + drift fix + wow-onboarding + PostHog — Research

**Researched:** 2026-05-23
**Domain:** Monetization (credits/entitlements) + Lead-magnet funnel + Bug fix (env/route drift) + Activation UX + Product analytics
**Confidence:** HIGH (codebase findings); MEDIUM (UX patterns)

## Summary

Phase 5 is five tightly coupled workstreams under one north star: lift activation (158/296 → target 65–75%) and paywall reach by replacing the fragmented free-tier mechanics with a unified credits system, and by adding a public lead-magnet (`/analyze`) that delivers a "wow" moment before signup. The codebase already has 80% of the primitives needed — they just live in disjoint shapes:

- **Entitlements today are three parallel ledgers**: `profiles.standard_used` (monthly carousel counter, TIER_LIMITS), `profiles.photo_slides_balance` (cumulative paid slide pack), and ad-hoc Photo Mode pricing via `photo_custom` (40₽/slide). All three need to collapse into one "credits" column with consistent debit semantics and a single check function.
- **/api/profile-audit already works end-to-end for the chat flow** — `scrapeProfile` + `generateProfileRecommendations` returns the exact `AuditReportData` shape the chat UI renders. The "drift" is real but smaller than memory suggests: it's an **env var name mismatch** (`APIFY_API_TOKEN` in `profile-scraper.ts:59` vs `APIFY_API_KEY` everywhere else) plus **two parallel profile audit code paths that should be merged** (`/api/profile-audit` for chat vs `/api/ai/profile-audit` for onboarding).
- **PostHog is already wired server-side** via fire-and-forget `captureEvent()` in `lib/posthog.ts`. Payment events fire today. The phase needs ~6 new events on the analyze→signup→activation→payment path, not new infrastructure.
- **No `/analyze` route exists.** Welcome page (`app/welcome/page.tsx`) is 23 lines (stub). Onboarding (`app/(dashboard)/onboarding/page.tsx`) is 777 lines but locked behind auth. The lead-magnet is greenfield.

**Primary recommendation:** Ship as five plans in this order — (1) drift fix (1h, unblocks everything), (2) credits schema + migration (3–4h, foundation), (3) PostHog event taxonomy + helpers (1h, instrument as we build), (4) `/analyze` public landing (1 day), (5) wow-onboarding hand-off from `/analyze` to signed-up user (0.5 day). Do NOT redesign the existing pricing/paywall UI in this phase — just sit credits on top.

## User Constraints (from CONTEXT.md)

No CONTEXT.md exists for this phase. Phase was added to ROADMAP without `/gsd:discuss-phase`. All scope decisions are Claude's discretion, constrained by:

- Project-level rule: NO emojis anywhere (code, UI, docs).
- Project-level rule: NO AI-slop design (purple gradients, glow cards, rainbow CTAs). Black/white/grey + one accent.
- Manual subscription grants are always 1 month — irrelevant here unless credits unification touches the grant code path.
- Primary product is swipely-nextjs (web). Telegram bot is NOT in scope.

## Phase Requirements

No formal requirement IDs were assigned in REQUIREMENTS.md (Phase was added post-hoc to ROADMAP). Proposed requirement IDs for the planner to formalize:

| Proposed ID | Description | Research Support |
|----|-------------|-----------------|
| CRED-01 | Unified `credits_balance` column on `profiles` replaces `standard_used` (count-up) + `photo_slides_balance` (count-down) with a single count-down semantics | Section "Credits Unification" — schema diff |
| CRED-02 | Free tier grants N credits/month via cron or lazy reset (mirrors existing `resetMonthlyIfNeeded`) | `app/api/generate/route.ts:114` already does lazy monthly reset |
| CRED-03 | All generation endpoints (`/api/generate`, `/api/generate/photo`, `/api/generate/seamless`, `/api/generate/from-url`) debit credits via single helper | All 4 routes already exist and check `subscription_tier` separately |
| CRED-04 | Webhook `add_photo_slides` RPC → `add_credits` RPC; backward-compat with existing `pack_15/50/150` and `photo_custom` SKUs | Webhook section "Slide packs" — direct migration target |
| ANLZ-01 | Public route `/analyze` accepts Instagram/Threads/LinkedIn/Telegram URL, returns scraped + audited profile to unauthenticated user | `scrapeProfile` already public-safe; route gate is auth |
| ANLZ-02 | `/analyze` is rate-limited per IP (Apify costs ~$0.002/profile, abuse vector) | No IP rate-limiter exists yet — must add |
| DRIFT-01 | `/api/profile-audit` reads `APIFY_API_KEY` (rename `APIFY_API_TOKEN` references) | `lib/services/profile-scraper.ts:59` |
| DRIFT-02 | `/api/ai/profile-audit` (onboarding-only legacy) merged into `/api/profile-audit` with optional `mode: "onboarding" \| "chat"` OR kept but documented as separate | `app/api/ai/profile-audit/route.ts` returns different shape |
| WOW-01 | After `/analyze` result, user sees one CTA: "Get this carousel made for you" → triggers anonymous carousel generation pre-filled with `suggested_topic` from audit | Uses existing `/api/generate/anonymous` path |
| WOW-02 | First-time signed-up user from `/analyze` lands directly into chat with audit pre-loaded as first message | Chat already supports `audit_report` ui_hint |
| PH-01 | PostHog events fire on: `analyze_started`, `analyze_completed`, `analyze_signup_clicked`, `analyze_signup_completed`, `first_generation`, `paywall_viewed` | `lib/posthog.ts` `captureEvent` ready; `payment_succeeded` already fires |
| PH-02 | PostHog funnel insight created via MCP: `analyze_started → analyze_completed → analyze_signup_completed → first_generation → payment_succeeded` | PostHog MCP available; project 160889 |

## Standard Stack

### Core (already installed — no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.x | App Router for `/analyze` public page + API routes | Already the framework |
| `posthog-node` | (installed) | Server-side `captureEvent` from API routes | `lib/posthog.ts` exists |
| `posthog-js` | (installed) | Client-side capture from `/analyze` page | `app/providers.tsx` already wires it |
| `@supabase/supabase-js` | (installed) | Admin client for credits RPC | `lib/supabase/admin.ts` exists |
| `zod` | (installed) | Validate `/analyze` URL input | Used throughout chat tools |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Apify HTTP API | n/a | Instagram/Threads/LinkedIn scraping | `lib/services/apify.ts` + `profile-scraper.ts` |
| Gemini 2.5 Flash via `GEMINI_PROXY_URL` | n/a | Profile recommendations | `profile-recommendations.ts` |
| `@upstash/ratelimit` or homemade RPC | ? | Per-IP rate limit on `/analyze` | **Verify** — `checkAndIncrementRateLimit` exists at `lib/?` — must locate |

**Verification step before planning:** Grep for `checkAndIncrementRateLimit` to find existing rate-limit primitive. Reuse if possible; otherwise add Upstash Redis or a simple Supabase RPC with IP-keyed counter.

### Alternatives NOT to use

| Instead of | Don't use | Why |
|------------|-----------|-----|
| Unified `credits_balance` column | Separate `standard_credits` + `photo_credits` columns | Defeats the purpose — back to two ledgers. Different generation types just debit different amounts (1 credit for standard, 3-7 for photo) |
| Stripe Customer Portal patterns | n/a | YooKassa/AuraPay region — not applicable |
| Adding `posthog-js-lite` | Use existing `posthog-js` from `app/providers.tsx` | Already loaded; no bundle gain |

## Architecture Patterns

### Credits unification — recommended data model

```sql
-- Migration: 2026-MM-DD-credits-unification.sql
alter table profiles add column credits_balance integer not null default 0;
alter table profiles add column credits_granted_at timestamptz;  -- for monthly reset

-- Backfill: each existing user gets credits = (TIER_LIMIT[tier] - standard_used) + photo_slides_balance
update profiles set credits_balance = greatest(0,
  case subscription_tier
    when 'free' then 3
    when 'start' then 30
    when 'blogger' then 30
    when 'creator' then 100
    when 'pro' then 100
    else 3
  end - coalesce(standard_used, 0)
) + coalesce(photo_slides_balance, 0);

-- RPC: atomic debit (replaces claim_generation_slot for credit math)
create or replace function debit_credits(p_user_id uuid, p_amount integer)
returns table(allowed boolean, balance_after integer, reason text) ...
```

**Generation cost table (proposal):**
| Action | Credits debited |
|--------|-----------------|
| Standard carousel (any slide count) | 1 |
| Seamless carousel | 2 |
| Photo Mode 3 slides | 3 |
| Photo Mode 5 slides | 5 |
| Photo Mode 7 slides | 7 |
| `/analyze` profile audit (authenticated) | 1 |
| `/analyze` profile audit (anonymous via lead magnet) | 0 (free, rate-limited) |
| `carousel_from_url`, `analyze_text`, `suggest_topics`, content plan | 0 (existing free helpers) |

**Monthly grant (per tier):**
| Tier | Monthly credits |
|------|-----------------|
| free | 3 |
| start | 30 |
| blogger | 30 |
| creator | 100 |
| pro | 100 |

**Migration strategy:**
1. Add column, backfill, deploy.
2. Update generation routes to call new `debit_credits` RPC while still updating `standard_used` (dual-write).
3. Add cron/lazy reset that grants credits at month boundary (or keep `resetMonthlyIfNeeded` and refactor it).
4. Update UI (pricing page, dashboard header) to show `credits_balance` instead of "X of 3 free this month".
5. After 30 days: drop `standard_used` and `photo_slides_balance` columns.

### `/analyze` landing — recommended structure

```
app/analyze/
├── page.tsx               # Public hero with URL input, no auth required
├── ResultView.tsx         # Renders ProfileRecommendations + signup CTA
├── analyze.module.css     # Black/white/grey, no AI-slop
└── route.ts               # OR reuse /api/profile-audit with auth-optional flag
```

**Auth model:** No auth required for first analysis. Result is stored in `localStorage` keyed by URL hash so it survives signup redirect. On signup, server reads `analyze_result_id` query param and seeds a chat thread with the audit as first assistant message.

**Rate limit:** 3 analyses per IP per day, 10 per IP per week. Stored in Supabase table `analyze_rate_limits(ip_hash, day, count)`. Cap is generous because Apify cost is ~0.50₽/call — Threads ratio of legit:abuse is ~20:1 on this kind of page.

### Wow-onboarding — recommended pattern

Three "wow" candidates ranked by expected lift:

1. **(Recommended) "Carousel preview from your audit"** — auto-generate a 5-slide carousel using `audit.suggested_topic` (already returned by `auditProfile`) via the anonymous generation endpoint. Show the slides BEFORE asking for signup. Signup unlocks "save + edit + download". This is the strongest activation pattern because the user sees their own brand-relevant output, not a generic demo.

2. **"Brand starter pack"** — after audit, preview niche/tone/audience filled into the brand-memory form. Signup auto-saves them.

3. **"Personalized 7-day content plan preview"** — show first 3 days of a content plan based on the niche from audit. Signup unlocks the full 30 days.

For Phase 5, recommend implementing **option 1 only** (depth > breadth). Track in PostHog `wow_preview_shown` + `wow_signup_completed`.

### PostHog instrumentation pattern (existing codebase convention)

Server-side (in API routes):
```typescript
import { captureEvent } from "@/lib/posthog";

captureEvent(userId, "analyze_completed", {
  platform: profile.platform,
  handle: profile.handle,
  followers: profile.followers,
  source: "lead_magnet",
});
```

Client-side (in pages):
```typescript
import posthog from "posthog-js";

posthog.capture("analyze_started", { url_host: new URL(input).hostname });
```

**For anonymous `/analyze` flow** — generate a stable `anonymous_id` (uuid in localStorage) and use it as `distinctId` server-side. On signup, alias via `posthog.alias(authUserId)` so the funnel stitches correctly.

### Anti-patterns to avoid

- **Don't debit credits client-side.** All debits happen in the route handler via the new RPC, atomically with the work.
- **Don't put `/analyze` behind middleware auth.** The `app/(auth)` and `app/(dashboard)` group folders are auth-gated. Place `/analyze` directly under `app/` (sibling to `welcome/`).
- **Don't reuse `/api/ai/profile-audit` for the public landing.** That route updates `profiles` and requires auth. Use `/api/profile-audit` (the chat-tool route) or a new public sibling.
- **Don't fire PostHog events from middleware.** Edge runtime drops `posthog-node`. Server components and route handlers only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL platform detection | New regex | `detectPlatform()` in `profile-scraper.ts:27` | Already handles ig/threads/linkedin/telegram |
| Apify scraping | Direct fetch to actors | `scrapeProfile()` | Handles timeout, error normalization |
| Audit prompt + JSON parse + retry | New Gemini wrapper | `generateProfileRecommendations()` | Uses `callGeminiJsonWithRetry` |
| Atomic credit decrement | `select then update` | Postgres RPC `debit_credits` like existing `claim_generation_slot` / `add_photo_slides` | Race-condition-safe; pattern already in codebase |
| Funnel definition | Manual queries | PostHog Funnel Insight via MCP tool | `posthog` MCP server available — call `query-funnel` |
| Anonymous → user identity | UUID juggling | `posthog.alias()` + `localStorage` | Standard PostHog pattern |
| Rate limiting | Hand-roll | Find existing `checkAndIncrementRateLimit` (referenced in chat route line 258) | Already used for chat tier limits |

## Common Pitfalls

### Pitfall 1: Backfill arithmetic underflow
**What goes wrong:** `TIER_LIMIT - standard_used` goes negative if `standard_used > limit` (possible from past bugs or grandfathered users).
**How to avoid:** Use `greatest(0, ...)` in backfill SQL. Add a one-off audit query before migration to count anomalies.
**Warning signs:** Users with `standard_used > 100` exist (manual grants gone wrong).

### Pitfall 2: Apify env-var name mismatch (the actual "drift")
**What goes wrong:** `profile-scraper.ts:59` reads `APIFY_API_TOKEN`. `apify.ts:32` reads `APIFY_API_KEY`. Memory file says `APIFY_API_KEY` is what's set in `.env.local`. Therefore the chat-route audit (`/api/profile-audit` → `scrapeProfile`) throws "APIFY_API_TOKEN not configured" for Instagram/Threads/LinkedIn URLs. Telegram works because it doesn't call Apify.
**How to avoid:** Single-line fix — replace `process.env.APIFY_API_TOKEN` with `process.env.APIFY_API_KEY` in `profile-scraper.ts:59-60`. Add a smoke test that hits each platform's scraper with a known-good handle.
**Warning signs:** Sentry/logs show "APIFY_API_TOKEN not configured" but never "APIFY_API_KEY not configured".

### Pitfall 3: Two parallel audit code paths drift further apart
**What goes wrong:** `/api/profile-audit` (chat) and `/api/ai/profile-audit` (onboarding) use different Gemini prompts, different output shapes (`{summary, strengths, weaknesses, ideas}` vs `{niche, tone, audience, visual_style, suggested_topic}`), different scrapers (`scrapeProfile` multi-platform vs `fetchInstagramProfile` IG-only).
**How to avoid:** Phase 5 should pick ONE: merge `auditProfile` into `generateProfileRecommendations` with an output schema that satisfies both UIs (return all fields, consumers pick what they render). Delete `/api/ai/profile-audit` after onboarding page is updated.
**Warning signs:** Field name "drift" in PRs (one says `niche`, another says `summary`).

### Pitfall 4: PostHog event flush latency from RU VPS
**What goes wrong:** PostHog Cloud hangs from RU IPs. `lib/posthog.ts` already mitigates with `requestTimeout: 3000` and fire-and-forget.
**How to avoid:** Keep using the existing helper. Do NOT `await captureEvent`. Do NOT add `enableExceptionAutocapture: true` (the comment in posthog.ts explains why).
**Warning signs:** API routes get slower; logs show AbortError.

### Pitfall 5: Anonymous → user identity stitching in PostHog
**What goes wrong:** Funnel breaks because `analyze_started` was fired with anonymous distinctId and `payment_succeeded` fires with user UUID — PostHog sees two people.
**How to avoid:** On signup completion, call `posthog.alias(userId, anonymousId)` client-side AND set `posthog.identify(userId)`. Server-side, fire `signup_completed` with userId only after alias is set client-side (or fire from server with userId and rely on PostHog person-on-events stitching).
**Warning signs:** Funnel conversion drops 80% at the signup step compared to backend signup count.

### Pitfall 6: Photo Mode debit math breaks on credits migration
**What goes wrong:** `/api/generate/photo` reads `photo_slides_balance` directly. After migration, that column is gone and balance lives in `credits_balance`. If route isn't updated, generation fails silently or double-debits.
**How to avoid:** Sequenced rollout — add `credits_balance` as authoritative, dual-read for one week (`credits_balance ?? photo_slides_balance`), then drop old column.

## Code Examples

### Verified pattern: atomic slot claim RPC (existing — model for `debit_credits`)

```typescript
// app/api/generate/route.ts:194
const { data: slotData, error: slotError } = await admin.rpc("claim_generation_slot", {
  p_user_id: user.id,
});
const slot = Array.isArray(slotData) ? slotData[0] : slotData;
if (!slot?.allowed) {
  if (slot?.reason === "COOLDOWN") return NextResponse.json({ error: "COOLDOWN", waitSeconds: slot.wait_seconds ?? 15 }, { status: 429 });
  if (slot?.reason === "DAILY_LIMIT") return NextResponse.json({ error: "Достигнут дневной лимит" }, { status: 429 });
  return NextResponse.json({ error: "Лимит генераций исчерпан..." }, { status: 429 });
}
```

### Verified pattern: PostHog server-side capture

```typescript
// lib/posthog.ts:42 — fire-and-forget
captureEvent(userId, "payment_succeeded", {
  product_id: productId,
  plan: PRODUCT_TIER[productId] ?? null,
  amount: paymentRecord.amount,
  // ...
});
```

### New pattern: `/analyze` route handler (proposed)

```typescript
// app/api/analyze/public/route.ts (NEW)
export async function POST(req: NextRequest) {
  const ipHash = await hashIp(req);
  const allowed = await checkPublicRateLimit(ipHash); // 3/day, 10/week
  if (!allowed) return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });

  const { url } = await req.json();
  const profile = await scrapeProfile(url);
  const recommendations = await generateProfileRecommendations(profile);

  const distinctId = req.headers.get("x-anonymous-id") ?? ipHash;
  captureEvent(distinctId, "analyze_completed", {
    platform: profile.platform, followers: profile.followers, source: "lead_magnet",
  });

  // Cache by URL hash for 24h so refresh doesn't re-burn Apify cost
  await cacheAuditResult(url, { profile, recommendations });

  return NextResponse.json({ profile, ...recommendations });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate `standard_used` counter + `photo_slides_balance` ledger + Photo Mode pay-per-call | Unified `credits_balance` with per-action debit amounts | Phase 5 | Clearer UX, one number to show user, one API surface |
| `/api/profile-audit` chat-only (auth required) | Public `/api/analyze/public` lead magnet + authenticated chat tool | Phase 5 | Top-of-funnel acquisition channel |
| Onboarding-only `/api/ai/profile-audit` returning `{niche, tone, audience, visual_style, suggested_topic}` | Single audit route returning superset (audit_report + brand_seed) | Phase 5 (drift fix) | Eliminates parallel maintenance |
| Ad-hoc `posthog.capture` scattered | Typed event taxonomy in `lib/analytics/events.ts` extended for Phase 5 funnel | Phase 5 | Funnel insight is queryable; events are discoverable |

**Deprecated/outdated after Phase 5:**
- `profiles.standard_used` column → drop after 30d.
- `profiles.photo_slides_balance` column → drop after 30d.
- `app/api/ai/profile-audit/route.ts` → delete after onboarding refactor (or keep with explicit "internal-only" comment).
- `TIER_LIMITS` in `lib/billing/tiers.ts` → replaced by `MONTHLY_CREDIT_GRANT` map (same values, different semantics: grant on month start, don't compare to a counter).

## Open Questions

1. **Should `/analyze` require even an email before showing results?**
   - What we know: Lead-magnet conversion is highest when value is delivered FIRST (Brunson, Hormozi).
   - What's unclear: Will users abuse the open endpoint at scale beyond rate limits?
   - Recommendation: Ship open. Add email gate only if abuse rate > 10% of traffic (measurable via PostHog).

2. **Credits cost for Photo Mode — flat or by slide?**
   - What we know: Current pricing is 149/249/349₽ for 3/5/7 slides (~50₽/slide retail; ~13.5₽ COGS).
   - What's unclear: Whether "1 credit = 1 slide" or "1 credit = 1 carousel of any size" feels fairer.
   - Recommendation: 1 credit per slide for Photo, 1 credit total for Standard (matches today's economics: Standard COGS is ~0.5₽, Photo COGS is ~13.5₽/slide).

3. **Should the existing `claim_generation_slot` RPC be reused or replaced?**
   - What we know: It does cooldown + daily limit + standard_used increment in one transaction.
   - What's unclear: Whether to bolt credits onto it (cheap) or write a new `debit_credits` and leave slot RPC for rate-limit-only (clean).
   - Recommendation: Extend `claim_generation_slot` to take a `p_credit_cost` param and decrement `credits_balance` — preserves all existing safety properties.

4. **PostHog funnel for `payment_succeeded` step — which product?**
   - What we know: Both subscription and slide-pack purchases fire `payment_succeeded`.
   - What's unclear: Activation funnel should probably gate on subscription, not slide-pack.
   - Recommendation: Funnel uses `payment_succeeded WHERE plan IS NOT NULL` (subscription filter); secondary funnel for slide-pack.

5. **Wow-preview cost — who pays for the generation?**
   - What we know: Anonymous endpoint `/api/generate/anonymous` exists.
   - What's unclear: Cost of generating a wow-carousel for every analyzer (~0.5₽ + Gemini quota).
   - Recommendation: Generate text-only Gemini outline (no image gen, no Puppeteer render — cheaper than a full carousel). Show as styled preview. Real render happens on signup.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (run via `npm test` → `vitest run`) |
| Config file | `swipely-nextjs/vitest.config.ts` |
| Quick run command | `cd swipely-nextjs && npm test -- <pattern>` |
| Full suite command | `cd swipely-nextjs && npm test` |
| E2E | Playwright (`npm run test:e2e`) — exists, used sparingly |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DRIFT-01 | `scrapeProfile("instagram.com/test")` reads `APIFY_API_KEY`, not `APIFY_API_TOKEN` | unit | `npm test -- lib/services/__tests__/profile-scraper.test.ts` | Wave 0 (file missing) |
| DRIFT-02 | `/api/profile-audit` returns 200 with `{summary, strengths, weaknesses, ideas}` shape for IG/Threads/LinkedIn/TG inputs | integration | `npm test -- app/api/profile-audit/__tests__/route.test.ts` | Wave 0 |
| CRED-01 | `debit_credits` RPC blocks at balance=0, succeeds at balance>=cost, decrements atomically | unit (SQL) | `npm test -- lib/billing/__tests__/credits.test.ts` | Wave 0 |
| CRED-02 | Monthly reset grants tier-appropriate credits and only once per calendar month | unit | `npm test -- lib/billing/__tests__/monthly-reset.test.ts` | Wave 0 |
| CRED-03 | `/api/generate` returns 429 when `credits_balance < 1`; debits 1 on success | integration | `npm test -- app/api/generate/__tests__/credits.test.ts` | Wave 0 |
| CRED-04 | `/api/generate/photo` debits N credits for N slides; refunds on failure | integration | `npm test -- app/api/generate/photo/__tests__/credits.test.ts` | Wave 0 |
| ANLZ-01 | `POST /api/analyze/public` returns audit without auth header | integration | `npm test -- app/api/analyze/__tests__/public.test.ts` | Wave 0 |
| ANLZ-02 | 4th request from same IP in 24h returns 429 RATE_LIMIT | integration | `npm test -- app/api/analyze/__tests__/ratelimit.test.ts` | Wave 0 |
| WOW-01 | Audit result includes `suggested_topic`; signup query param `?from=analyze&topic=...` seeds first chat message | integration | `npm test -- app/analyze/__tests__/handoff.test.ts` | Wave 0 |
| PH-01 | Each new event has correct shape (validate via test that asserts mock `captureEvent` call args) | unit | `npm test -- lib/analytics/__tests__/phase5-events.test.ts` | Wave 0 |
| PH-02 | Funnel insight exists in PostHog project 160889 with correct event sequence | manual + MCP | `mcp posthog query-funnel ...` | manual-only (PostHog API verification) |

### Sampling Rate
- **Per task commit:** `cd swipely-nextjs && npm test -- <changed area pattern>` (e.g., `npm test -- lib/billing`)
- **Per wave merge:** `cd swipely-nextjs && npm test`
- **Phase gate:** Full suite green; `/api/profile-audit` smoke test against all 4 platforms; PostHog funnel insight created via MCP.

### Wave 0 Gaps

All test files below are missing and must be created in Wave 0 (or co-located with implementation):

- [ ] `lib/services/__tests__/profile-scraper.test.ts` — env var name + platform detection
- [ ] `app/api/profile-audit/__tests__/route.test.ts` — happy path + error shapes
- [ ] `lib/billing/__tests__/credits.test.ts` — RPC contract
- [ ] `lib/billing/__tests__/monthly-reset.test.ts` — date logic
- [ ] `app/api/generate/__tests__/credits.test.ts` — debit + refund
- [ ] `app/api/generate/photo/__tests__/credits.test.ts` — variable debit by slide count
- [ ] `app/api/analyze/__tests__/public.test.ts` — anon access
- [ ] `app/api/analyze/__tests__/ratelimit.test.ts` — IP cap
- [ ] `app/analyze/__tests__/handoff.test.ts` — query param → chat seed
- [ ] `lib/analytics/__tests__/phase5-events.test.ts` — event payload shapes
- [ ] Supabase migration: `supabase/migrations/2026-MM-DD-credits-unification.sql` (schema + backfill + `debit_credits` RPC)
- [ ] Supabase migration: `supabase/migrations/2026-MM-DD-analyze-rate-limit.sql` (rate-limit table + RPC)

Framework is already installed (`vitest` in `package.json`). No setup needed beyond writing the files.

## Sources

### Primary (HIGH confidence)
- `swipely-nextjs/lib/billing/tiers.ts` — TIER_LIMITS source of truth
- `swipely-nextjs/lib/billing/quota.ts` — `checkPublishQuota` (outcome pricing — separate system, not used for free tier)
- `swipely-nextjs/lib/services/profile-scraper.ts` — multi-platform scraper, **line 59 env var bug**
- `swipely-nextjs/lib/services/profile-recommendations.ts` — Gemini audit prompt + JSON contract
- `swipely-nextjs/lib/services/profile-audit.ts` — onboarding-only audit (drift source)
- `swipely-nextjs/lib/services/apify.ts` — `APIFY_API_KEY` env var (canonical name)
- `swipely-nextjs/lib/chat/tools.ts:342-386` — `analyze_profile` tool definition
- `swipely-nextjs/lib/chat/system-prompt.ts:64,81` — tool advertised to LLM
- `swipely-nextjs/app/api/profile-audit/route.ts` — chat tool target (43 lines, clean)
- `swipely-nextjs/app/api/ai/profile-audit/route.ts` — onboarding target (69 lines, drift)
- `swipely-nextjs/app/api/generate/route.ts:85-250` — quota gate via `claim_generation_slot` RPC
- `swipely-nextjs/app/api/payments/create/route.ts` — product catalog including slide packs
- `swipely-nextjs/app/api/webhooks/aurapay/route.ts:236-270` — `add_photo_slides` RPC pattern
- `swipely-nextjs/lib/posthog.ts` — fire-and-forget capture pattern
- `swipely-nextjs/lib/analytics/events.ts` + `server.ts` — typed event taxonomy pattern
- `swipely-nextjs/components/dashboard/conv/types.ts:44` — `AuditReportData` UI contract
- `swipely-nextjs/vitest.config.ts` — test runner config
- Project memory: `project_analyze_profile_drift.md`, `project_growth_diagnosis.md`, `project_okr_2026.md`

### Secondary (MEDIUM confidence)
- PostHog MCP server access (project 160889, person-on-events mode) — confirmed available for funnel creation
- Pricing economics (~13.5₽/Photo slide COGS, ~0.5₽/Standard COGS) — from CLAUDE.md project notes

### Tertiary (LOW confidence — needs validation in planning)
- `checkAndIncrementRateLimit` location — referenced in `app/api/chat/route.ts:258` but file not located. Planner must grep before designing `/analyze` rate limit.
- Exact behavior of `claim_generation_slot` (cooldown windows, daily caps) — referenced but RPC body not read. Planner should `psql` or query Supabase to see definition before extending it.
- Whether `posthog-js` is initialized for non-auth pages — `app/providers.tsx` not read. Planner should verify before relying on it on `/analyze`.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all primitives already installed and used in codebase.
- Architecture (credits schema): HIGH — direct extension of existing `claim_generation_slot` / `add_photo_slides` patterns.
- analyze_profile drift: HIGH — exact env var line located, exact two parallel routes located.
- `/analyze` lead-magnet UX: MEDIUM — pattern is industry-standard, but no `/analyze` precedent in codebase.
- Wow-onboarding mechanic: MEDIUM — three options proposed, option 1 recommended on first principles; no A/B data.
- PostHog event taxonomy: HIGH — pattern established; just adding events.

**Research date:** 2026-05-23
**Valid until:** 2026-06-22 (30 days — codebase moves fast on this project; re-verify file paths if delay > 30d)
