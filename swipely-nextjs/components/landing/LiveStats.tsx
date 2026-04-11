import { createAdminClient } from "@/lib/supabase/admin";

async function getStats() {
  try {
    const supabase = createAdminClient();
    const [{ count: totalGenerations }, { count: totalUsers }] = await Promise.all([
      supabase.from("generations").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);
    return {
      generations: totalGenerations ?? 0,
      users: totalUsers ?? 0,
    };
  } catch {
    // Build-time: SUPABASE_SERVICE_ROLE_KEY not available
    return { generations: 0, users: 0 };
  }
}

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(0) + "K+";
  return n.toString();
}

export async function LiveStats() {
  const stats = await getStats();

  return (
    <section className="py-20 px-6 border-y border-border">
      <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
        <div>
          <div className="text-5xl font-bold text-accent tabular-nums">
            {formatNumber(stats.generations)}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">каруселей создано</div>
        </div>
        <div>
          <div className="text-5xl font-bold text-accent tabular-nums">
            {formatNumber(stats.users)}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">пользователей</div>
        </div>
        <div>
          <div className="text-5xl font-bold text-accent">30с</div>
          <div className="mt-2 text-sm text-muted-foreground">среднее время генерации</div>
        </div>
      </div>
    </section>
  );
}
