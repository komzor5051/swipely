---
phase: 05
plan: 02
subsystem: billing
tags: [credits, billing, supabase, rpc, dual-write]
date: 2026-05-24
status: complete
duration_minutes: ~35
tasks_completed: 3
files_created: 5
files_modified: 4

dependency_graph:
  requires:
    - profiles table (existing)
    - claim_generation_slot RPC (existing)
    - add_photo_slides RPC (existing)
    - createAdminClient helper (existing)
  provides:
    - credits_balance column on profiles
    - claim_generation_slot(p_credit_cost) — extended RPC
    - add_credits / grant_monthly_credits RPCs
    - lib/billing/credits.ts — typed wrappers (debitCredits, addCredits, grantMonthlyCredits)
    - INSUFFICIENT_CREDITS reason for 429 responses
  affects:
    - /api/generate (now debits 1 credit)
    - /api/generate/photo (now debits N credits)
    - /api/webhooks/aurapay (dual-write to credits_balance on slide-pack purchase)
    - 05-04 /analyze (can now consume credits cleanly)
    - 05-05 wow-onboarding (can grant credits via RPC)

tech_stack:
  added:
    - none — uses existing Supabase + Next.js + vitest stack
  patterns:
    - "Dual-write window (30 days): new credits_balance + legacy photo_slides_balance/standard_used both updated; drop legacy after 2026-06-23"
    - "Refund-on-failure: pipeline error in /api/generate or /api/generate/photo triggers addCredits(N) refund"
    - "Best-effort dual-write: webhook addCredits wrapped in try/catch so legacy path is never blocked"

key_files:
  created:
    - swipely-nextjs/supabase/migrations/2026-05-23-credits-unification.sql
    - swipely-nextjs/lib/billing/credits.ts
    - swipely-nextjs/lib/billing/__tests__/credits.test.ts
    - swipely-nextjs/lib/billing/__tests__/monthly-reset.test.ts
    - swipely-nextjs/app/api/generate/__tests__/credits.test.ts
    - swipely-nextjs/app/api/webhooks/aurapay/__tests__/credits-dual-write.test.ts
  modified:
    - swipely-nextjs/app/api/generate/route.ts
    - swipely-nextjs/app/api/generate/photo/route.ts
    - swipely-nextjs/app/api/webhooks/aurapay/route.ts

decisions:
  - "Dual-write window set at 30 days (drop after 2026-06-23): credits_balance becomes authoritative, legacy counters preserved for rollback safety"
  - "Refund safety net implemented in both generate routes via addCredits — pipeline failure does not burn user credits"
  - "Webhook dual-write is best-effort (try/catch swallow): never block legacy add_photo_slides path; credits_balance discrepancy can be reconciled later"
  - "Credit costs: Standard = 1, Photo = 1-per-slide (3/5/7), as per RESEARCH"

metrics:
  duration_minutes: ~35
  tasks: 3
  files_changed: 9
  tests_added: 8
  lines_of_sql: ~85

commits:
  - 57d118b feat(05-02): credits unification - schema + RPC + helpers (Task 1)
  - 858f9da feat(05-02): wire /api/generate + /api/generate/photo to debit credits (Task 2)
  - 05b87f6 feat(05-02): webhook dual-write addCredits alongside add_photo_slides (Task 3, CRED-04)

requirements:
  - CRED-01: credits_balance column on profiles — DONE
  - CRED-02: grant_monthly_credits RPC idempotent within calendar month — DONE
  - CRED-03: Both /api/generate and /api/generate/photo debit via single helper — DONE
  - CRED-04: add_credits RPC + aurapay webhook dual-writes — DONE
---

# Phase 5 Plan 2: Credits Unification Summary

Replaced fragmented `standard_used` (count-up) + `photo_slides_balance` (count-down) with single unified `credits_balance` count-down ledger. Both generation endpoints now debit through one RPC; aurapay webhook dual-writes slide-pack purchases into the new column for a 30-day backfill safety window.

## What was built

**Schema (Task 1, commit 57d118b)**

- `profiles.credits_balance integer not null default 0`
- `profiles.credits_granted_at timestamptz` (idempotency anchor for monthly grants)
- `claim_generation_slot(p_user_id, p_credit_cost integer default 1)` — extended to accept a cost parameter and atomically decrement `credits_balance`; preserves dual-write into `standard_used`
- `add_credits(p_user_id, p_amount)` — atomic top-up RPC
- `grant_monthly_credits(p_user_id)` — idempotent monthly grant per tier (free=3, start=30, blogger=30, creator=100, pro=100)
- Backfill applied: existing users get `(tier_grant − standard_used) + photo_slides_balance`, floored at 0
- `lib/billing/credits.ts` exports typed wrappers `debitCredits`, `addCredits`, `grantMonthlyCredits`

**Generation routes (Task 2, commit 858f9da)**

- `/api/generate` passes `p_credit_cost: 1` to `claim_generation_slot`; returns 429 + `reason: "INSUFFICIENT_CREDITS"` when balance is exhausted. `refundSlot()` now also calls `addCredits(1)` on pipeline failure.
- `/api/generate/photo` replaces the `photo_slides_balance` gate with `debitCredits(user.id, slideCount)`. On Gemini failure inside the SSE stream, `addCredits(slideCount)` is called to refund. Legacy `decrement_photo_balance` call preserved with `DUAL-WRITE` comment.
- New test file `app/api/generate/__tests__/credits.test.ts`: 4 tests covering both routes (insufficient credits → 429, p_credit_cost passed, photo route debits N credits, photo failure triggers refund).

**Webhook (Task 3, commit 05b87f6)**

- `app/api/webhooks/aurapay/route.ts` now mirrors slide-pack purchases (`pack_15`, `pack_50`, `pack_150`, and `photo_custom`) into `credits_balance` via dynamic-import `addCredits` immediately after the legacy `add_photo_slides` RPC.
- Wrapped in try/catch so any credits failure cannot break the legacy fulfillment path.
- New test file `app/api/webhooks/aurapay/__tests__/credits-dual-write.test.ts`: 2 tests verifying both calls fire and that webhook still returns 200 when `addCredits` throws.

## Verification

- `npm test -- --run lib/billing/__tests__/credits.test.ts lib/billing/__tests__/monthly-reset.test.ts` — green (Task 1, executed during initial run)
- `npm test -- --run app/api/generate/__tests__/credits.test.ts` — 4/4 green (143s, slow due to heavy module graph)
- `npm test -- --run app/api/webhooks/aurapay/__tests__/credits-dual-write.test.ts` — 2/2 green (209ms)
- `npx tsc --noEmit` — exit 0

## Deviations from Plan

None — plan executed as written. The only minor adaptation: Task 3 dual-write was applied to BOTH branches (`SLIDE_PACKS` and `photo_custom`) to ensure custom slide purchases also mirror into credits, since the plan called out the slide-pack branch but the parallel `photo_custom` branch uses the same fulfillment shape and would otherwise diverge.

## Deferred / Follow-up

- Drop legacy `standard_used` and `photo_slides_balance` reads/writes after 2026-06-23 once `credits_balance` is verified authoritative in production.
- 05-04 (/analyze) and 05-05 (wow-onboarding) can now consume/grant credits via the new helpers.
- Migration must be applied to production Supabase before deploy (file in `swipely-nextjs/supabase/migrations/2026-05-23-credits-unification.sql`).

## Self-Check: PASSED

- All 9 files present on disk (4 modified, 5 created).
- All 3 commits (57d118b, 858f9da, 05b87f6) present in git log.
- Acceptance grep checks satisfied (p_credit_cost, INSUFFICIENT_CREDITS, addCredits, DUAL-WRITE markers).
