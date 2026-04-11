# Admin Panel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a `/admin` route in swipely-nextjs with stats, user management (inline tier/balance editing), and payments history — protected by owner email.

**Architecture:** Server Components fetch all data at page load via `createAdminClient()` (service_role, bypasses RLS). Inline user editing uses a Client Component with Server Actions. No new API routes needed.

**Tech Stack:** Next.js 15 Server Components, Server Actions (`"use server"`), `createAdminClient()` from `lib/supabase/admin.ts`, existing UI components from `components/ui/`.

---

### Task 1: Add ADMIN_EMAIL env var + create folder structure

**Files:**
- Modify: `swipely-nextjs/.env.local`
- Create: `swipely-nextjs/app/admin/` (directory only, no files yet)

**Step 1: Add env variable**

Open `swipely-nextjs/.env.local` and append:
```
ADMIN_EMAIL=your@email.com
```
Replace `your@email.com` with your actual Supabase auth email.

**Step 2: Verify env file has no duplicates**

Check that `ADMIN_EMAIL` appears exactly once in `.env.local`.

**Step 3: Create directory**

```bash
mkdir -p "swipely-nextjs/app/admin/components"
```

**Step 4: Commit**

```bash
cd swipely-nextjs
git add .env.local
git commit -m "chore(admin): add ADMIN_EMAIL env variable"
```

---

### Task 2: Admin layout with email guard

**Files:**
- Create: `swipely-nextjs/app/admin/layout.tsx`

**Step 1: Create the layout**

```tsx
// swipely-nextjs/app/admin/layout.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email !== process.env.ADMIN_EMAIL) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <header className="bg-[#0D0D14] text-white px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D4F542] flex items-center justify-center">
            <span className="text-[#0D0D14] font-bold text-xs">ADM</span>
          </div>
          <span className="font-semibold">Swipely Admin</span>
        </div>
        <span className="text-white/40 text-sm">{user.email}</span>
      </header>
      <main className="max-w-7xl mx-auto px-8 py-8">{children}</main>
    </div>
  );
}
```

**Step 2: Verify it works**

Run `npm run dev` in `swipely-nextjs/`. Navigate to `http://localhost:3000/admin` while NOT logged in — should return 404. Log in as your email — should show the layout header.

**Step 3: Commit**

```bash
git add app/admin/layout.tsx
git commit -m "feat(admin): add email-guarded admin layout"
```

---

### Task 3: Server Actions for user mutations

**Files:**
- Create: `swipely-nextjs/app/admin/actions.ts`

**Step 1: Create actions file**

```ts
// swipely-nextjs/app/admin/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email !== process.env.ADMIN_EMAIL) {
    throw new Error("Unauthorized");
  }
}

export async function updateUserTier(
  userId: string,
  tier: "free" | "pro"
): Promise<void> {
  await verifyAdmin();
  const admin = createAdminClient();

  const subscriptionEnd =
    tier === "pro"
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const { error } = await admin
    .from("profiles")
    .update({ subscription_tier: tier, subscription_end: subscriptionEnd })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function updateUserBalance(
  userId: string,
  balance: number
): Promise<void> {
  await verifyAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ photo_slides_balance: Math.max(0, balance) })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
```

**Step 2: Commit**

```bash
git add app/admin/actions.ts
git commit -m "feat(admin): add server actions for user tier/balance updates"
```

---

### Task 4: StatsRow component

**Files:**
- Create: `swipely-nextjs/app/admin/components/StatsRow.tsx`

**Step 1: Create the component**

```tsx
// swipely-nextjs/app/admin/components/StatsRow.tsx
function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${
        accent ? "bg-[#D4F542]" : "bg-white border border-[#E8E8E4]"
      }`}
    >
      <p className={`text-sm mb-1 ${accent ? "text-[#0D0D14]/60" : "text-[#6B7280]"}`}>
        {label}
      </p>
      <p
        className={`text-3xl font-bold font-mono ${
          accent ? "text-[#0D0D14]" : "text-[#0D0D14]"
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-1 ${accent ? "text-[#0D0D14]/50" : "text-[#9CA3AF]"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function StatsRow({
  totalRevenue,
  totalUsers,
  proUsers,
  generationsToday,
  totalGenerations,
  newUsersWeek,
}: {
  totalRevenue: number;
  totalUsers: number;
  proUsers: number;
  generationsToday: number;
  totalGenerations: number;
  newUsersWeek: number;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        label="Выручка всего"
        value={`${totalRevenue.toLocaleString("ru-RU")} ₽`}
        sub="confirmed платежи"
        accent
      />
      <StatCard
        label="Пользователи"
        value={totalUsers}
        sub={`${proUsers} на PRO`}
      />
      <StatCard
        label="Генерации"
        value={totalGenerations}
        sub={`сегодня: ${generationsToday}`}
      />
      <StatCard
        label="Новых за 7 дней"
        value={newUsersWeek}
        sub="регистраций"
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/admin/components/StatsRow.tsx
git commit -m "feat(admin): add StatsRow component"
```

---

### Task 5: UsersTable component with inline editing

**Files:**
- Create: `swipely-nextjs/app/admin/components/UsersTable.tsx`

**Step 1: Create the component**

```tsx
// swipely-nextjs/app/admin/components/UsersTable.tsx
"use client";

import { useState, useTransition } from "react";
import { updateUserTier, updateUserBalance } from "../actions";

type UserRow = {
  id: string;
  email: string | null;
  subscription_tier: string | null;
  photo_slides_balance: number | null;
  referral_count: number | null;
  created_at: string | null;
  gen_count: number;
};

function UserEditRow({ user }: { user: UserRow }) {
  const [tier, setTier] = useState(user.subscription_tier || "free");
  const [balance, setBalance] = useState(user.photo_slides_balance ?? 0);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      await updateUserTier(user.id, tier as "free" | "pro");
      await updateUserBalance(user.id, balance);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <tr className="border-b border-[#E8E8E4] hover:bg-[#F9F9F7] transition-colors">
      <td className="py-3 px-4 text-sm text-[#0D0D14] font-medium max-w-[200px] truncate">
        {user.email || "—"}
      </td>
      <td className="py-3 px-4">
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="text-sm border border-[#E8E8E4] rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F542]"
        >
          <option value="free">free</option>
          <option value="pro">pro</option>
        </select>
      </td>
      <td className="py-3 px-4 text-sm text-[#6B7280] font-mono">{user.gen_count}</td>
      <td className="py-3 px-4">
        <input
          type="number"
          value={balance}
          onChange={(e) => setBalance(Number(e.target.value))}
          min={0}
          className="text-sm border border-[#E8E8E4] rounded-lg px-2 py-1 w-20 font-mono focus:outline-none focus:ring-2 focus:ring-[#D4F542]"
        />
      </td>
      <td className="py-3 px-4 text-sm text-[#6B7280] font-mono">
        {user.referral_count ?? 0}
      </td>
      <td className="py-3 px-4 text-sm text-[#9CA3AF]">
        {user.created_at
          ? new Date(user.created_at).toLocaleDateString("ru-RU")
          : "—"}
      </td>
      <td className="py-3 px-4">
        <button
          onClick={handleSave}
          disabled={isPending}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
            saved
              ? "bg-green-100 text-green-700"
              : "bg-[#0D0D14] text-white hover:bg-[#1A1A2E] disabled:opacity-50"
          }`}
        >
          {isPending ? "..." : saved ? "Сохранено" : "Сохранить"}
        </button>
      </td>
    </tr>
  );
}

export function UsersTable({ users }: { users: UserRow[] }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E8E4] overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-[#E8E8E4]">
        <h2 className="font-semibold text-[#0D0D14]">
          Пользователи ({users.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F9F9F7] text-xs text-[#9CA3AF] uppercase tracking-wide">
              <th className="py-3 px-4 text-left font-medium">Email</th>
              <th className="py-3 px-4 text-left font-medium">Тариф</th>
              <th className="py-3 px-4 text-left font-medium">Генераций</th>
              <th className="py-3 px-4 text-left font-medium">Photo-слайды</th>
              <th className="py-3 px-4 text-left font-medium">Рефералы</th>
              <th className="py-3 px-4 text-left font-medium">Регистрация</th>
              <th className="py-3 px-4 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserEditRow key={user.id} user={user} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/admin/components/UsersTable.tsx
git commit -m "feat(admin): add UsersTable with inline tier/balance editing"
```

---

### Task 6: PaymentsTable component

**Files:**
- Create: `swipely-nextjs/app/admin/components/PaymentsTable.tsx`

**Step 1: Create the component**

```tsx
// swipely-nextjs/app/admin/components/PaymentsTable.tsx
type PaymentRow = {
  id: string;
  created_at: string | null;
  amount: number | null;
  currency: string | null;
  status: string | null;
  product_type: string | null;
  provider: string | null;
  user_email: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-600",
};

export function PaymentsTable({ payments }: { payments: PaymentRow[] }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E8E4] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E8E8E4]">
        <h2 className="font-semibold text-[#0D0D14]">
          Платежи (последние {payments.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F9F9F7] text-xs text-[#9CA3AF] uppercase tracking-wide">
              <th className="py-3 px-4 text-left font-medium">Дата</th>
              <th className="py-3 px-4 text-left font-medium">Email</th>
              <th className="py-3 px-4 text-left font-medium">Продукт</th>
              <th className="py-3 px-4 text-left font-medium">Сумма</th>
              <th className="py-3 px-4 text-left font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr
                key={p.id}
                className="border-b border-[#E8E8E4] hover:bg-[#F9F9F7] transition-colors"
              >
                <td className="py-3 px-4 text-sm text-[#9CA3AF]">
                  {p.created_at
                    ? new Date(p.created_at).toLocaleDateString("ru-RU")
                    : "—"}
                </td>
                <td className="py-3 px-4 text-sm text-[#0D0D14] max-w-[200px] truncate">
                  {p.user_email || "—"}
                </td>
                <td className="py-3 px-4 text-sm font-mono text-[#6B7280]">
                  {p.product_type || "—"}
                </td>
                <td className="py-3 px-4 text-sm font-bold font-mono text-[#0D0D14]">
                  {p.amount ? `${p.amount.toLocaleString("ru-RU")} ₽` : "—"}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      STATUS_STYLES[p.status || ""] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {p.status || "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/admin/components/PaymentsTable.tsx
git commit -m "feat(admin): add PaymentsTable component"
```

---

### Task 7: Main admin page (data fetching + assembly)

**Files:**
- Create: `swipely-nextjs/app/admin/page.tsx`

**Step 1: Create the page**

```tsx
// swipely-nextjs/app/admin/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { StatsRow } from "./components/StatsRow";
import { UsersTable } from "./components/UsersTable";
import { PaymentsTable } from "./components/PaymentsTable";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = createAdminClient();

  // --- Fetch all data in parallel ---
  const [
    { data: profiles },
    { data: payments },
    { count: totalGenerations },
    { count: generationsToday },
    { count: newUsersWeek },
    { data: revenueData },
  ] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin
      .from("payments")
      .select("id, created_at, amount, currency, status, product_type, provider, user_id")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("generations")
      .select("*", { count: "exact", head: true }),
    admin
      .from("generations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 86400000).toISOString()),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    admin
      .from("payments")
      .select("amount")
      .eq("status", "confirmed"),
  ]);

  // --- Compute stats ---
  const totalRevenue = (revenueData || []).reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );
  const totalUsers = profiles?.length ?? 0;
  const proUsers = profiles?.filter((p) => p.subscription_tier === "pro").length ?? 0;

  // --- Build user rows with gen counts ---
  // Fetch generation counts per user
  const { data: genCounts } = await admin
    .from("generations")
    .select("user_id");

  const genCountMap: Record<string, number> = {};
  for (const g of genCounts || []) {
    if (g.user_id) genCountMap[g.user_id] = (genCountMap[g.user_id] || 0) + 1;
  }

  const userRows = (profiles || []).map((p) => ({
    id: p.id,
    email: p.email,
    subscription_tier: p.subscription_tier,
    photo_slides_balance: p.photo_slides_balance,
    referral_count: p.referral_count,
    created_at: p.created_at,
    gen_count: genCountMap[p.id] || 0,
  }));

  // --- Build payment rows with email lookup ---
  const emailMap: Record<string, string> = {};
  for (const p of profiles || []) {
    if (p.id && p.email) emailMap[p.id] = p.email;
  }

  const paymentRows = (payments || []).map((p) => ({
    ...p,
    user_email: p.user_id ? (emailMap[p.user_id] || null) : null,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0D0D14] mb-6">Обзор</h1>
      <StatsRow
        totalRevenue={totalRevenue}
        totalUsers={totalUsers}
        proUsers={proUsers}
        generationsToday={generationsToday ?? 0}
        totalGenerations={totalGenerations ?? 0}
        newUsersWeek={newUsersWeek ?? 0}
      />
      <UsersTable users={userRows} />
      <PaymentsTable payments={paymentRows} />
    </div>
  );
}
```

**Step 2: Run dev and verify**

```bash
npm run dev
```

Navigate to `http://localhost:3000/admin`. You should see:
- Header with "Swipely Admin" and your email
- 4 stat cards
- Users table with inline editing working
- Payments table

**Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Fix any type errors before committing.

**Step 4: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat(admin): complete admin dashboard with stats, users, payments"
```

---

## Done

Admin panel is live at `/admin`. Protected by `ADMIN_EMAIL` env var. Features:
- Stats: revenue, users, PRO count, generations, new signups
- Users table: inline tier + balance editing with Server Actions
- Payments table: last 100 payments with status badges
