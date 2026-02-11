"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Sparkles,
  Clock,
  Settings,
  LogOut,
  Menu,
  CreditCard,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/queries";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Дашборд" },
  { href: "/generate", icon: Sparkles, label: "Создать" },
  { href: "/history", icon: Clock, label: "История" },
  { href: "/dashboard/settings", icon: Settings, label: "Настройки" },
];

function Sidebar({
  className = "",
  profile,
  email,
  loading,
  onLogout,
}: {
  className?: string;
  profile: Profile | null;
  email: string;
  loading: boolean;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  const tier = profile?.subscription_tier || "free";
  const used = profile?.standard_used || 0;
  const limit = tier === "pro" ? -1 : 3;
  const remaining = tier === "pro" ? "∞" : Math.max(0, limit - used);
  const limitLabel = tier === "pro" ? "∞" : String(limit);

  return (
    <aside
      className={`w-64 bg-[var(--swipely-blue)] text-white p-6 flex flex-col ${className}`}
    >
      {/* Logo */}
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 32 32" fill="none" width={24} height={24}>
              <path
                d="M10 12h12M10 16h12M10 20h8"
                stroke="#0A84FF"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-xl font-bold">Swipely</span>
        </Link>
      </div>

      {/* Balance card */}
      <div className="mb-6 rounded-2xl bg-white/10 p-4">
        <div className="text-xs text-white/60 mb-1">Генерации</div>
        <div className="text-2xl font-bold font-[family-name:var(--font-mono)]">
          {loading ? "—" : remaining}{" "}
          <span className="text-sm font-normal text-white/60">
            / {loading ? "—" : limitLabel}
          </span>
        </div>
        <div className="text-xs text-white/50 mt-1">
          {tier === "pro" ? "PRO тариф" : "Бесплатный тариф"}
        </div>
        {tier !== "pro" && (
          <Link href="/pricing">
            <Button
              size="sm"
              className="w-full mt-3 rounded-full bg-white text-[var(--swipely-blue)] hover:bg-white/90 text-xs font-semibold"
            >
              <CreditCard className="h-3 w-3 mr-1.5" />
              Перейти на PRO
            </Button>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="mt-auto pt-4 border-t border-white/15">
        <div className="mb-3 px-2">
          <p className="text-xs text-white/50">Вход как:</p>
          <p className="text-sm font-medium truncate">
            {loading ? "..." : email || "—"}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer w-full"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      </div>
    </aside>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setEmail(user.email || "");

      // Try to load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
      } else {
        // Profile doesn't exist — create it (fallback for missing trigger)
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            subscription_tier: "free",
            standard_used: 0,
            photo_slides_balance: 0,
          })
          .select()
          .single();

        if (newProfile) setProfile(newProfile as Profile);
      }

      setLoading(false);
    };

    load();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <Sidebar
        className="hidden md:flex"
        profile={profile}
        email={email}
        loading={loading}
        onLogout={handleLogout}
      />

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 h-full">
            <Sidebar
              profile={profile}
              email={email}
              loading={loading}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
          <button
            className="md:hidden p-2 -ml-2"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <Link href="/generate">
              <Button
                size="sm"
                className="rounded-full bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)]"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Создать карусель
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
