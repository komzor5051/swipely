"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href: "/admin",
    label: "Обзор",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4" />
      </svg>
    ),
  },
  {
    href: "/admin/users",
    label: "Пользователи",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5" r="3" fill="currentColor" opacity=".9" />
        <path d="M2 13c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".9" />
      </svg>
    ),
  },
  {
    href: "/admin/payments",
    label: "Платежи",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="4" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" opacity=".9" />
        <path d="M1 7h14" stroke="currentColor" strokeWidth="1.5" opacity=".9" />
        <rect x="3" y="9.5" width="4" height="1.5" rx=".75" fill="currentColor" opacity=".6" />
      </svg>
    ),
  },
  {
    href: "/admin/analytics",
    label: "Аналитика",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="9" width="3" height="6" rx="1" fill="currentColor" opacity=".5" />
        <rect x="6" y="5" width="3" height="10" rx="1" fill="currentColor" opacity=".7" />
        <rect x="11" y="1" width="3" height="14" rx="1" fill="currentColor" opacity=".9" />
      </svg>
    ),
  },
  {
    href: "/admin/broadcast",
    label: "Рассылка",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M14 2L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".9" />
        <path d="M14 2L9.5 14.5L7 9L1.5 6.5L14 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity=".9" />
      </svg>
    ),
  },
  {
    href: "/admin/utm",
    label: "UTM-метки",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 2H2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
        <path d="M2 2l5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".9" />
        <path d="M8 4h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".5" />
        <path d="M14 4l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".5" />
      </svg>
    ),
  },
  {
    href: "/admin/api-keys",
    label: "API ключи",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="6" cy="9" r="4" stroke="currentColor" strokeWidth="1.5" opacity=".9" />
        <path d="M9.5 5.5L15 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".9" />
        <path d="M13 3l1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".6" />
        <circle cx="6" cy="9" r="1.5" fill="currentColor" opacity=".9" />
      </svg>
    ),
  },
];

export function AdminSidebar() {
  const path = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-[#1E1E1E] min-h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#D4F542] flex items-center justify-center">
            <span className="text-[#0D0D14] font-bold text-[10px]">ADM</span>
          </div>
          <span className="text-white font-semibold text-sm">Swipely Admin</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = item.href === "/admin" ? path === "/admin" : path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-[#D4F542] text-[#0D0D14]"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className={active ? "text-[#0D0D14]" : ""}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-white/5">
        <p className="text-white/20 text-xs">Swipely © 2025</p>
      </div>
    </aside>
  );
}
