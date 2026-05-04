# Retention System Design

**Date:** 2026-05-05
**Status:** Approved
**Scope:** swipely-nextjs

---

## Problem

Analytics (Supabase, 2026-05-05):
- 1 079 registered users, 404 created at least one carousel
- 88.7% made their last carousel on registration day — never returned
- Median user lifetime: 0 days
- 97.6% of active users stopped at 1–3 carousels
- No email infrastructure exists — zero emails sent to users

Root causes (confirmed by founder):
- No re-engagement mechanism after user leaves
- Dashboard topic suggestions are hardcoded generics, not personalized
- Streak is computed in code but hidden (`void streak`)
- Onboarding collects TOV style but not niche — no basis for personalization

---

## What Already Exists

| Feature | Status |
|---|---|
| StatsRow (total + monthly count) | Exists |
| Input "О чём расскажем сегодня?" | Exists |
| 3 hardcoded topic suggestions (firstTime only) | Exists |
| Streak computation (`computeStreak`) | Exists but suppressed |
| Onboarding — TOV analysis from URL | Exists |
| `profiles.niche` column | Exists in DB, always null |
| `profiles.suggested_topics` column | Exists in DB, unused |
| History page, templates page | Exists |

---

## Solution: 4 Changes

### 1. Show streak in StatsRow (~30 min)

Remove `void streak` on line 141 of `DashboardClient.tsx`. Pass `streak` into `StatsRow` alongside existing props. Display as a third stat: "X дней подряд".

**Why it matters:** Streak creates loss aversion — breaking a streak is painful. It's already computed correctly, just hidden.

### 2. Add niche question to onboarding (~1 hour)

After TOV analysis (or on skip), show one additional step:

> "О чём твой блог?" — chip selection with categories: Маркетинг, Психология, Бизнес, Финансы, Саморазвитие, Дизайн, Копирайтинг, Здоровье + free-text "своё"

Save to `profiles.niche`. Required for starters personalization and email personalization. Users who skip TOV should still see this question.

### 3. Personalized daily starters (~3 hours)

Replace hardcoded `TOPIC_SUGGESTIONS` with AI-generated starters from Gemini.

**API route:** `GET /api/starters`
- Reads `profile.niche` + `profile.tov_guidelines`
- Calls Gemini to generate 3 carousel topic ideas in user's niche
- Caches result in `profiles.suggested_topics` with `profiles.suggested_topics_date`
- Cache TTL: 24 hours (regenerate if date differs from today)
- Fallback: hardcoded generic topics if niche is null

**Dashboard change:** Remove `firstTime` condition — show starters to all users on every visit, not just first-timers. This is the "стартер дня" hook that gives a reason to open the app.

### 4. Email re-engagement system (~1 day)

**Infrastructure:** Resend. Single shared email template, minimal HTML — plain text with one CTA button.

**Four triggers** (implemented as Next.js API routes called by cron or webhook):

| # | Trigger | Condition | Subject |
|---|---|---|---|
| 1 | +24h after signup | `standard_used = 0` | "Ты зарегистрировался, но ещё ничего не сделал" |
| 2 | +3d after first carousel | `standard_used >= 1`, inactive 3d | "Стартер для следующей карусели — уже готов" |
| 3 | +7d silence | No generation in 7d | "Пока не удалили твои шаблоны — быстрый вопрос" |
| 4 | Recurring every 3d | Active users, no generation in 3d | "Стартер готов: [тема по нише]" |

**Email 2 and 4** include a personalized topic from the user's niche (same Gemini call as starters).

**Email 3** uses a different angle — personal question from founder + mention of new template. Designed for re-activation, not conversion pressure.

**Stop conditions:**
- Email 1: skip if user created a carousel before send time
- Email 4: skip if user has a generation in the last 2 days (already active, no nudge needed)
- All: respect unsubscribe

**Cron schedule:** Daily job at 10:00 Moscow time checks who qualifies for each trigger.

---

## Data Flow

```
User registers
  → Onboarding: TOV analysis + niche question → profiles.niche saved
  → Dashboard shows: StatsRow (total, month, streak) + starters by niche
  → Cron job daily: checks inactivity → sends appropriate email
  → User clicks email → lands on dashboard with fresh starters → creates carousel
  → Streak increments → loop
```

---

## Out of Scope

- Template drops / new template notifications (separate feature, after this ships)
- Streak rewards / gamification beyond display
- Push notifications (no PWA service worker)
- Unsubscribe management UI (Resend handles this)

---

## Success Criteria

- Day 7 retention improves from ~9% (36 of 404 active) to >20%
- At least 30% of email opens result in a carousel creation session
- Niche fill rate: >60% of new users complete the niche question

---

## Implementation Order

1. Streak in StatsRow — 30 min, zero risk
2. Niche question in onboarding — 1 hour, isolated change
3. Personalized starters API — 3 hours, replaces hardcoded strings
4. Email system (Resend) — 1 day, new infrastructure

Total: ~2 days to first email in user's inbox.
