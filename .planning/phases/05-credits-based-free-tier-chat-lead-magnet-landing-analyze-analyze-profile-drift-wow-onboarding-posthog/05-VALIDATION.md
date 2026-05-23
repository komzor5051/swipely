---
phase: 5
slug: credits-based-free-tier-chat-lead-magnet-landing-analyze-analyze-profile-drift-wow-onboarding-posthog
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-23
updated: 2026-05-24
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | swipely-nextjs/vitest.config.ts (verify in Wave 0) |
| **Quick run command** | `npm test -- --run --reporter=dot` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run --reporter=dot`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Plan | Task | Automated verify command |
|------|------|--------------------------|
| 05-01 | T1: Wave 0 failing tests for env var + audit route shape | `npm test -- --run lib/services/__tests__/profile-scraper.test.ts app/api/profile-audit/__tests__/route.test.ts` |
| 05-01 | T2: Fix env var bug + merge audit route shapes (GREEN) | `npm test -- --run lib/services/__tests__/profile-scraper.test.ts app/api/profile-audit/__tests__/route.test.ts` |
| 05-02 | T1: Migration + credits.ts helper + RPC contract tests | `npm test -- --run lib/billing/__tests__/credits.test.ts lib/billing/__tests__/monthly-reset.test.ts` |
| 05-02 | T2: Wire /api/generate + /api/generate/photo to debit credits | `npm test -- --run app/api/generate/__tests__/credits.test.ts` |
| 05-02 | T3: Webhook dual-write (add_credits alongside add_photo_slides) | `npm test -- --run app/api/webhooks/aurapay/__tests__/credits-dual-write.test.ts` |
| 05-03 | T1: Phase 5 PostHog event taxonomy + typed helpers | `npm test -- --run lib/analytics/__tests__/phase5-events.test.ts` |
| 05-04 | T1: Rate-limit migration + analyze-rate-limit.ts helper | `npm test -- --run app/api/analyze/__tests__/ratelimit.test.ts` |
| 05-04 | T2: Public /api/analyze route + integration test | `npm test -- --run app/api/analyze/__tests__/public.test.ts` |
| 05-04 | T3: /analyze public page UI | `npx tsc --noEmit` + `npm run lint -- --max-warnings=0 app/analyze` |
| 05-05 | T1: Anonymous /api/analyze/preview + ResultView outline + handoff CTA | `npm test -- --run app/api/analyze/preview` |
| 05-05 | T2: Signup handoff — alias anonymous distinctId + seed chat from audit | `npm test -- --run app/analyze/__tests__/handoff.test.ts` |

Coverage check: Every task in 05-01..05-05 has an `<automated>` command above. No 3 consecutive tasks without automated verify. Manual-only items are isolated below.

---

## Wave 0 Requirements

- [ ] Confirm vitest installed in swipely-nextjs/package.json
- [ ] Create test stubs for: profile-scraper env var, audit route merge, credits RPC, /analyze rate limit, PostHog event helpers
- [ ] SQL migration test fixtures for credits_balance column

*Detailed list lives in 05-RESEARCH.md Validation Architecture section.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PostHog funnel insight shows events | upsell funnel tracking | Requires PostHog dashboard UI + real event data | Trigger flow analyze→signup→generate→pay, query PostHog MCP for events |
| Wow-onboarding "wow" perception | activation lift | Subjective UX judgement | Manual walkthrough by Влад after deploy |
| /analyze landing renders public Instagram analysis | lead-magnet | Requires live Apify + Gemini calls | Hit /analyze with known IG handle, verify recommendations render |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planner
