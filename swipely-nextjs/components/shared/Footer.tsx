import Link from "next/link";
import { Logo } from "./Logo";

const footerLinks = {
  product: [
    { href: "/pricing", label: "Тарифы" },
    { href: "/generate", label: "Создать карусель" },
    { href: "#templates", label: "Шаблоны" },
  ],
  support: [
    { href: "https://t.me/swipelybot", label: "Telegram-бот" },
    { href: "https://t.me/swipely_support", label: "Поддержка" },
  ],
  legal: [
    { href: "/docs/terms", label: "Условия использования" },
    { href: "/docs/privacy", label: "Политика конфиденциальности" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-[var(--swipely-charcoal)] text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <span className="text-xl font-bold">Swipely</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              AI-генератор каруселей для Instagram и соцсетей
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-white/80">
              Продукт
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-white/80">
              Поддержка
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white transition-colors"
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-white/80">
              Документы
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-white/40">
          &copy; {new Date().getFullYear()} Swipely. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
