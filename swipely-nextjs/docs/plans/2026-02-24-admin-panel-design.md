# Admin Panel Design

**Date:** 2026-02-24
**Status:** Approved

## Overview

Internal admin panel for Swipely owner to monitor all project data and manage users.
Route: `/admin` inside `swipely-nextjs`. Protected by email check against `ADMIN_EMAIL` env var.

## File Structure

```
swipely-nextjs/app/admin/
├── layout.tsx                ← email guard → notFound() if not admin
├── page.tsx                  ← main dashboard (Server Component)
├── actions.ts                ← Server Actions for mutations
└── components/
    ├── StatsRow.tsx          ← 4 stat cards at top
    ├── UsersTable.tsx        ← users table with inline editing
    └── PaymentsTable.tsx     ← payments table (read-only)
```

## Protection

`layout.tsx` is a Server Component that:
1. Gets current user via `createClient()` (server)
2. Compares `user.email` with `process.env.ADMIN_EMAIL`
3. Calls `notFound()` if mismatch — returns 404, leaks no info

New env variable: `ADMIN_EMAIL=your@email.com` in `.env.local`.

## Data Displayed

### Stats Row (4 cards)
- Total revenue (sum of `payments` where `status = 'confirmed'`, in RUB)
- Total users / PRO users count
- Generations today / all time
- New users last 7 days

### Users Table
Columns: Email, Tier, Generations count, Photo balance, Referral count, Registration date, Actions

**Inline editing per row:**
- Dropdown: `free` / `pro` for `subscription_tier`
- Number input for `photo_slides_balance`
- Save button → calls Server Action

### Payments Table (read-only)
Columns: Date, User email, Product, Amount (RUB), Status
Shows last 100 payments ordered by `created_at DESC`.

## Implementation Approach

- **Server Components** for all data fetching — `supabase-server` with `service_role` key bypasses RLS
- **Server Actions** (`"use server"`) in `actions.ts` for mutations
- No new API routes needed
- Styling: existing design tokens (`--ink`, `--lime`) + `@/components/ui` components

## Server Actions

```ts
// actions.ts
updateUserTier(userId: string, tier: 'free' | 'pro'): Promise<void>
updateUserBalance(userId: string, balance: number): Promise<void>
```

Both use `supabaseAdmin` (service_role) to bypass RLS on `profiles` table.

## Environment Variables

```
ADMIN_EMAIL=your@email.com   # add to .env.local
```

No other env changes needed — `SUPABASE_SERVICE_ROLE_KEY` already exists.
